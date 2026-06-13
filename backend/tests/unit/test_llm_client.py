import asyncio
import json
from pathlib import Path

import httpx

from app.config import Settings
from app.services.llm_client import (
    LLM_FALLBACK_REPLY,
    LLM_TIMEOUT_SECONDS,
    OPENROUTER_CHAT_COMPLETIONS_URL,
    ChatMessage,
    OpenRouterClient,
)

BACKEND_ROOT = Path(__file__).resolve().parents[2]
APP_ROOT = BACKEND_ROOT / "app"


def test_openrouter_client_sends_expected_chat_completion_request() -> None:
    asyncio.run(run_openrouter_request_test())


async def run_openrouter_request_test() -> None:
    requests: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return httpx.Response(
            200,
            json={
                "id": "openrouter-response-id",
                "model": "test/provider-model",
                "choices": [
                    {
                        "message": {"role": "assistant", "content": "Helpful answer."},
                        "finish_reason": "stop",
                    }
                ],
            },
        )

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        llm = OpenRouterClient(
            settings=Settings(
                app_env="test",
                openrouter_api_key="test-openrouter-key",
                llm_model="test/default-model",
            ),
            client=client,
        )
        completion = await llm.complete_chat(
            [
                ChatMessage(role="system", content="You are helpful."),
                ChatMessage(role="user", content="How does Proper Rent work?"),
            ],
            model="test/request-model",
            temperature=0.2,
            max_tokens=256,
        )

    assert completion.content == "Helpful answer."
    assert completion.model == "test/provider-model"
    assert completion.provider_response_id == "openrouter-response-id"
    assert completion.finish_reason == "stop"
    assert completion.is_fallback is False
    assert completion.error_type is None

    assert len(requests) == 1
    request = requests[0]
    assert request.url == httpx.URL(OPENROUTER_CHAT_COMPLETIONS_URL)
    assert request.headers["authorization"] == "Bearer test-openrouter-key"
    assert request.headers["content-type"] == "application/json"
    assert request.extensions["timeout"] == {
        "connect": LLM_TIMEOUT_SECONDS,
        "read": LLM_TIMEOUT_SECONDS,
        "write": LLM_TIMEOUT_SECONDS,
        "pool": LLM_TIMEOUT_SECONDS,
    }
    assert request_payload(request) == {
        "model": "test/request-model",
        "messages": [
            {"role": "system", "content": "You are helpful."},
            {"role": "user", "content": "How does Proper Rent work?"},
        ],
        "temperature": 0.2,
        "max_tokens": 256,
    }


def test_openrouter_client_falls_back_without_api_key() -> None:
    asyncio.run(run_missing_api_key_test())


async def run_missing_api_key_test() -> None:
    llm = OpenRouterClient(settings=Settings(app_env="test", llm_model="test/model"))

    completion = await llm.complete_chat([ChatMessage(role="user", content="Hello")])

    assert completion.content == LLM_FALLBACK_REPLY
    assert completion.model == "test/model"
    assert completion.is_fallback is True
    assert completion.error_type == "OpenRouterConfigurationError"


def test_openrouter_client_falls_back_on_timeout_without_leaking_error_text() -> None:
    asyncio.run(run_timeout_fallback_test())


async def run_timeout_fallback_test() -> None:
    log_calls: list[tuple[str, dict[str, object]]] = []

    def capture_warning(message: str, *, extra: dict[str, object]) -> None:
        log_calls.append((message, extra))

    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout("timeout for renter@example.com", request=request)

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        llm = OpenRouterClient(
            settings=Settings(
                app_env="test",
                openrouter_api_key="test-key",
                llm_model="test/model",
            ),
            client=client,
        )
        from app.services import llm_client as llm_client_module

        original_warning = llm_client_module.logger.warning
        llm_client_module.logger.warning = capture_warning
        try:
            completion = await llm.complete_chat([ChatMessage(role="user", content="Hello")])
        finally:
            llm_client_module.logger.warning = original_warning

    assert completion.content == LLM_FALLBACK_REPLY
    assert completion.is_fallback is True
    assert completion.error_type == "OpenRouterTimeoutError"
    assert log_calls == [
        ("LLM completion failed", {"error_type": "OpenRouterTimeoutError"}),
    ]
    assert "renter@example.com" not in repr(log_calls)
    assert "renter@example.com" not in repr(completion)


def test_openrouter_client_falls_back_on_http_error() -> None:
    asyncio.run(run_http_error_fallback_test())


async def run_http_error_fallback_test() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(503, text="provider failed for renter@example.com")

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        llm = OpenRouterClient(
            settings=Settings(
                app_env="test",
                openrouter_api_key="test-key",
                llm_model="test/model",
            ),
            client=client,
        )
        completion = await llm.complete_chat([ChatMessage(role="user", content="Hello")])

    assert completion.content == LLM_FALLBACK_REPLY
    assert completion.is_fallback is True
    assert completion.error_type == "OpenRouterHTTPStatusError"
    assert "renter@example.com" not in repr(completion)


def test_openrouter_client_falls_back_on_malformed_success_response() -> None:
    asyncio.run(run_malformed_response_fallback_test())


async def run_malformed_response_fallback_test() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"choices": []})

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        llm = OpenRouterClient(
            settings=Settings(
                app_env="test",
                openrouter_api_key="test-key",
                llm_model="test/model",
            ),
            client=client,
        )
        completion = await llm.complete_chat([ChatMessage(role="user", content="Hello")])

    assert completion.content == LLM_FALLBACK_REPLY
    assert completion.is_fallback is True
    assert completion.error_type == "OpenRouterResponseError"


def test_only_llm_client_talks_to_openrouter_or_imports_vendor_sdks() -> None:
    direct_openrouter_callers: list[str] = []
    forbidden_imports: list[str] = []
    forbidden_patterns = (
        "import openai",
        "from openai",
        "import anthropic",
        "from anthropic",
    )

    for path in APP_ROOT.rglob("*.py"):
        text = path.read_text()
        relative_path = str(path.relative_to(APP_ROOT))
        if "openrouter.ai/api" in text and relative_path != "services/llm_client.py":
            direct_openrouter_callers.append(relative_path)
        if relative_path != "services/llm_client.py":
            for pattern in forbidden_patterns:
                if pattern in text:
                    forbidden_imports.append(f"{relative_path}: {pattern}")

    assert direct_openrouter_callers == []
    assert forbidden_imports == []


def request_payload(request: httpx.Request) -> dict[str, object]:
    return json.loads(request.content.decode("utf-8"))
