from __future__ import annotations

import asyncio
from collections.abc import AsyncGenerator, Generator, Sequence
from dataclasses import dataclass, field
from datetime import UTC, date, datetime, timedelta
from uuid import UUID

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker

from app.config import Settings
from app.database import create_engine, get_db_session
from app.dependencies import get_llm_client
from app.main import create_app
from app.models import Base, Conversation, Renter
from app.services.llm_client import LLM_FALLBACK_REPLY, ChatMessage, LLMCompletion

CONSENT_VERSION = "2026-06-13"
INTERNAL_PUBLIC_FIELDS = {
    "intent_score",
    "fintech_flags",
    "assigned_agent_id",
    "scraye_introduction_id",
    "property_id",
    "properties",
    "conversation_id",
    "system_prompt",
    "raw_llm_response",
}


@dataclass
class FakeLLMClient:
    completion: LLMCompletion
    calls: list[list[ChatMessage]] = field(default_factory=list)

    async def complete_chat(
        self,
        messages: Sequence[ChatMessage],
        *,
        model: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> LLMCompletion:
        self.calls.append(list(messages))
        return self.completion


@dataclass(frozen=True)
class ChatEndpointContext:
    client: TestClient
    llm: FakeLLMClient
    session_factory: async_sessionmaker[AsyncSession]


@pytest.fixture
def chat_context() -> Generator[ChatEndpointContext, None, None]:
    settings = Settings(app_env="test")
    engine = create_engine(settings)
    session_factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    llm = FakeLLMClient(
        LLMCompletion(
            content=(
                "Deposit Share can help reduce upfront deposit pressure. [ACTION: show_intake_form]"
            ),
            model="test/model",
        )
    )
    app = create_app(settings)

    asyncio.run(create_tables(engine))

    async def override_db_session() -> AsyncGenerator[AsyncSession, None]:
        async with session_factory() as session:
            try:
                yield session
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_db_session] = override_db_session
    app.dependency_overrides[get_llm_client] = lambda: llm

    try:
        yield ChatEndpointContext(
            client=TestClient(app),
            llm=llm,
            session_factory=session_factory,
        )
    finally:
        app.dependency_overrides.clear()
        asyncio.run(engine.dispose())


async def create_tables(engine: AsyncEngine) -> None:
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)


def test_chat_endpoint_returns_public_shape_and_persists_conversation(
    chat_context: ChatEndpointContext,
) -> None:
    response = chat_context.client.post(
        "/api/v1/chat",
        json={
            "session_id": "session-chat",
            "message": "What is Deposit Share? I want to register.",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body == {
        "reply": "Deposit Share can help reduce upfront deposit pressure.",
        "suggested_action": "show_intake_form",
        "session_id": "session-chat",
    }
    assert INTERNAL_PUBLIC_FIELDS.isdisjoint(body)
    assert "properties" not in response.text
    assert "property_id" not in response.text

    conversation = asyncio.run(
        fetch_conversation(chat_context.session_factory, session_id="session-chat")
    )
    assert conversation is not None
    assert conversation.channel == "website"
    assert conversation.transcript[0]["role"] == "user"
    assert conversation.transcript[0]["content"] == "What is Deposit Share? I want to register."
    assert conversation.transcript[1]["role"] == "assistant"
    assert conversation.transcript[1]["content"] == (
        "Deposit Share can help reduce upfront deposit pressure."
    )
    assert conversation.intent_score_output is not None
    assert conversation.ai_summary is not None

    assert chat_context.llm.calls
    call_text = "\n".join(message.content for message in chat_context.llm.calls[0])
    assert "Deposit Share" in call_text
    assert "Phase 1 has no live properties/listing data" in call_text


def test_chat_endpoint_validation_errors_do_not_create_conversation(
    chat_context: ChatEndpointContext,
) -> None:
    missing_session_response = chat_context.client.post(
        "/api/v1/chat",
        json={"message": "Hello"},
    )
    too_long_response = chat_context.client.post(
        "/api/v1/chat",
        json={"session_id": "too-long", "message": "x" * 1001},
    )

    assert missing_session_response.status_code == 422
    assert too_long_response.status_code == 422
    assert asyncio.run(count_conversations(chat_context.session_factory)) == 0
    assert chat_context.llm.calls == []


def test_chat_endpoint_returns_200_with_fallback_reply(
    chat_context: ChatEndpointContext,
) -> None:
    chat_context.llm.completion = LLMCompletion(
        content=LLM_FALLBACK_REPLY,
        model="test/model",
        is_fallback=True,
        error_type="OpenRouterTimeoutError",
    )

    response = chat_context.client.post(
        "/api/v1/chat",
        json={"session_id": "fallback-session", "message": "Hello"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "reply": LLM_FALLBACK_REPLY,
        "suggested_action": None,
        "session_id": "fallback-session",
    }

    conversation = asyncio.run(
        fetch_conversation(chat_context.session_factory, session_id="fallback-session")
    )
    assert conversation is not None
    assert conversation.transcript[-1]["content"] == LLM_FALLBACK_REPLY


def test_chat_endpoint_scrubs_pii_before_persisting_transcript(
    chat_context: ChatEndpointContext,
) -> None:
    response = chat_context.client.post(
        "/api/v1/chat",
        json={
            "session_id": "pii-session",
            "message": "My email is renter@example.com and phone is 07123 456789.",
        },
    )

    assert response.status_code == 200
    conversation = asyncio.run(
        fetch_conversation(chat_context.session_factory, session_id="pii-session")
    )
    assert conversation is not None
    assert "renter@example.com" not in conversation.transcript[0]["content"]
    assert "07123 456789" not in conversation.transcript[0]["content"]
    assert "[redacted]" in conversation.transcript[0]["content"]

    assert chat_context.llm.calls
    user_prompt = chat_context.llm.calls[-1][-1].content
    assert "renter@example.com" in user_prompt
    assert "07123 456789" in user_prompt


def test_chat_endpoint_ignores_mismatched_renter_id_context(
    chat_context: ChatEndpointContext,
) -> None:
    renter_id = asyncio.run(
        seed_renter(
            chat_context.session_factory,
            session_id="other-session",
            email="private@example.com",
            areas_preferred=["Leeds"],
        )
    )

    response = chat_context.client.post(
        "/api/v1/chat",
        json={
            "session_id": "public-session",
            "message": "Can you help?",
            "renter_id": str(renter_id),
        },
    )

    assert response.status_code == 200
    conversation = asyncio.run(
        fetch_conversation(chat_context.session_factory, session_id="public-session")
    )
    assert conversation is not None
    assert conversation.renter_id is None

    call_text = "\n".join(message.content for message in chat_context.llm.calls[-1])
    assert "Leeds" not in call_text
    assert "private@example.com" not in call_text


async def fetch_conversation(
    session_factory: async_sessionmaker[AsyncSession],
    *,
    session_id: str,
) -> Conversation | None:
    async with session_factory() as session:
        return await session.scalar(
            select(Conversation).where(Conversation.session_id == session_id)
        )


async def count_conversations(session_factory: async_sessionmaker[AsyncSession]) -> int:
    async with session_factory() as session:
        count = await session.scalar(select(func.count()).select_from(Conversation))
        return int(count or 0)


async def seed_renter(
    session_factory: async_sessionmaker[AsyncSession],
    *,
    session_id: str,
    email: str,
    areas_preferred: list[str],
) -> UUID:
    async with session_factory() as session:
        renter = Renter(
            source_channel="website",
            session_id=session_id,
            full_name="Private Renter",
            email=email,
            phone="07123456789",
            bedrooms_required=2,
            areas_preferred=areas_preferred,
            max_rent=1200,
            move_in_by=date.today() + timedelta(days=14),
            employment_status="employed_full",
            has_guarantor="yes",
            deposit_availability="full",
            has_rented_before=True,
            intent_score=85,
            consent_given=True,
            consent_version=CONSENT_VERSION,
            consent_at=datetime.now(UTC),
        )
        session.add(renter)
        await session.commit()
        return renter.id
