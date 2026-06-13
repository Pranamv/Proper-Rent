import logging
from collections.abc import Sequence
from dataclasses import dataclass
from typing import Literal

import httpx

from app.config import Settings, get_settings

logger = logging.getLogger(__name__)

OPENROUTER_CHAT_COMPLETIONS_URL = "https://openrouter.ai/api/v1/chat/completions"
LLM_TIMEOUT_SECONDS = 10.0
LLM_FALLBACK_REPLY = "Our team can help. Please use the form and we'll be in touch."

ChatRole = Literal["system", "user", "assistant"]


@dataclass(frozen=True)
class ChatMessage:
    role: ChatRole
    content: str


@dataclass(frozen=True)
class LLMCompletion:
    content: str
    model: str
    is_fallback: bool = False
    provider_response_id: str | None = None
    finish_reason: str | None = None
    error_type: str | None = None


class LLMClientError(Exception):
    pass


class OpenRouterConfigurationError(LLMClientError):
    pass


class OpenRouterTimeoutError(LLMClientError):
    pass


class OpenRouterTransportError(LLMClientError):
    pass


class OpenRouterHTTPStatusError(LLMClientError):
    pass


class OpenRouterResponseError(LLMClientError):
    pass


class OpenRouterClient:
    def __init__(
        self,
        *,
        settings: Settings,
        client: httpx.AsyncClient | None = None,
    ) -> None:
        self.settings = settings
        self.client = client

    async def complete_chat(
        self,
        messages: Sequence[ChatMessage],
        *,
        model: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> LLMCompletion:
        selected_model = model or self.settings.llm_model
        try:
            return await self._send_chat_completion(
                messages,
                model=selected_model,
                temperature=temperature,
                max_tokens=max_tokens,
            )
        except LLMClientError as exc:
            log_completion_failure(exc)
            return fallback_completion(model=selected_model, error_type=type(exc).__name__)

    async def _send_chat_completion(
        self,
        messages: Sequence[ChatMessage],
        *,
        model: str,
        temperature: float | None,
        max_tokens: int | None,
    ) -> LLMCompletion:
        if not self.settings.openrouter_api_key:
            raise OpenRouterConfigurationError("OPENROUTER_API_KEY is required")

        payload: dict[str, object] = {
            "model": model,
            "messages": [serialize_message(message) for message in messages],
        }
        if temperature is not None:
            payload["temperature"] = temperature
        if max_tokens is not None:
            payload["max_tokens"] = max_tokens

        headers = {
            "Authorization": f"Bearer {self.settings.openrouter_api_key}",
            "Content-Type": "application/json",
        }

        try:
            if self.client is not None:
                response = await self.client.post(
                    OPENROUTER_CHAT_COMPLETIONS_URL,
                    headers=headers,
                    json=payload,
                    timeout=LLM_TIMEOUT_SECONDS,
                )
            else:
                async with httpx.AsyncClient(timeout=LLM_TIMEOUT_SECONDS) as client:
                    response = await client.post(
                        OPENROUTER_CHAT_COMPLETIONS_URL,
                        headers=headers,
                        json=payload,
                    )
        except httpx.TimeoutException as exc:
            raise OpenRouterTimeoutError("OpenRouter request timed out") from exc
        except httpx.HTTPError as exc:
            raise OpenRouterTransportError("OpenRouter request failed") from exc

        if response.status_code >= 400:
            raise OpenRouterHTTPStatusError(f"OpenRouter returned HTTP {response.status_code}")

        try:
            data: object = response.json()
        except ValueError as exc:
            raise OpenRouterResponseError("OpenRouter response was not valid JSON") from exc

        content, response_model, provider_response_id, finish_reason = parse_completion_response(
            data
        )
        return LLMCompletion(
            content=content,
            model=response_model or model,
            provider_response_id=provider_response_id,
            finish_reason=finish_reason,
        )


def get_llm_client(settings: Settings | None = None) -> OpenRouterClient:
    return OpenRouterClient(settings=settings or get_settings())


def serialize_message(message: ChatMessage) -> dict[str, str]:
    return {"role": message.role, "content": message.content}


def parse_completion_response(data: object) -> tuple[str, str | None, str | None, str | None]:
    if not isinstance(data, dict):
        raise OpenRouterResponseError("OpenRouter response was not an object")

    response_id = get_optional_string(data, "id")
    response_model = get_optional_string(data, "model")
    choices = data.get("choices")
    if not isinstance(choices, list) or not choices:
        raise OpenRouterResponseError("OpenRouter response did not include choices")

    first_choice = choices[0]
    if not isinstance(first_choice, dict):
        raise OpenRouterResponseError("OpenRouter choice was not an object")

    finish_reason = get_optional_string(first_choice, "finish_reason")
    message = first_choice.get("message")
    if not isinstance(message, dict):
        raise OpenRouterResponseError("OpenRouter choice did not include a message")

    content = message.get("content")
    if not isinstance(content, str) or not content.strip():
        raise OpenRouterResponseError("OpenRouter message did not include text content")

    return content, response_model, response_id, finish_reason


def get_optional_string(data: dict[object, object], key: str) -> str | None:
    value = data.get(key)
    if isinstance(value, str) and value:
        return value
    return None


def fallback_completion(*, model: str, error_type: str) -> LLMCompletion:
    return LLMCompletion(
        content=LLM_FALLBACK_REPLY,
        model=model,
        is_fallback=True,
        error_type=error_type,
    )


def log_completion_failure(error: LLMClientError) -> None:
    logger.warning(
        "LLM completion failed",
        extra={"error_type": type(error).__name__},
    )
