from __future__ import annotations

import asyncio
from collections.abc import AsyncGenerator, Generator
from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta
from typing import Any
from uuid import UUID

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.config import Settings
from app.database import create_engine, get_db_session
from app.dependencies import get_notification_service
from app.main import create_app
from app.models import Base, Conversation, Renter
from app.services.notifications import DeliveryStatus, EmailDelivery, EmailTemplate, RecipientKind

CONSENT_VERSION = "2026-06-13"


@dataclass(frozen=True)
class NotificationCall:
    template: EmailTemplate
    entity_id: UUID
    to_email: str | None = None
    intent_score: int | None = None


class FakeNotificationService:
    def __init__(self) -> None:
        self.calls: list[NotificationCall] = []
        self.confirmation_should_fail = False

    async def send_renter_confirmation(
        self,
        *,
        renter_id: UUID,
        renter_email: str,
        consent_version: str,
    ) -> EmailDelivery:
        self.calls.append(
            NotificationCall(
                template=EmailTemplate.RENTER_CONFIRMATION,
                entity_id=renter_id,
                to_email=renter_email,
            )
        )
        if self.confirmation_should_fail:
            # Mirror the real service: delivery failures are returned, not raised.
            return EmailDelivery(
                template=EmailTemplate.RENTER_CONFIRMATION,
                recipient_kind=RecipientKind.RENTER,
                entity_id=renter_id,
                status=DeliveryStatus.FAILED,
                error_type="EmailTransportError",
            )
        return EmailDelivery(
            template=EmailTemplate.RENTER_CONFIRMATION,
            recipient_kind=RecipientKind.RENTER,
            entity_id=renter_id,
            status=DeliveryStatus.SENT,
            provider_message_id=f"confirmation-{len(self.calls)}",
        )

    async def send_hot_renter_alert(
        self,
        *,
        renter_id: UUID,
        intent_score: int,
        consent_version: str,
    ) -> EmailDelivery:
        self.calls.append(
            NotificationCall(
                template=EmailTemplate.HOT_RENTER_ALERT,
                entity_id=renter_id,
                intent_score=intent_score,
            )
        )
        return EmailDelivery(
            template=EmailTemplate.HOT_RENTER_ALERT,
            recipient_kind=RecipientKind.AGENT,
            entity_id=renter_id,
            status=DeliveryStatus.SENT,
            provider_message_id=f"alert-{len(self.calls)}",
        )


@dataclass(frozen=True)
class LeadEndpointContext:
    client: TestClient
    notifications: FakeNotificationService
    session_factory: async_sessionmaker[AsyncSession]


@pytest.fixture
def lead_context() -> Generator[LeadEndpointContext, None, None]:
    settings = Settings(app_env="test")
    engine = create_engine(settings)
    session_factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    notifications = FakeNotificationService()
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
    app.dependency_overrides[get_notification_service] = lambda: notifications

    try:
        yield LeadEndpointContext(
            client=TestClient(app),
            notifications=notifications,
            session_factory=session_factory,
        )
    finally:
        app.dependency_overrides.clear()
        asyncio.run(engine.dispose())


async def create_tables(engine) -> None:  # type: ignore[no-untyped-def]
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)


def test_create_renter_lead_scores_stores_links_and_sends_hot_notifications(
    lead_context: LeadEndpointContext,
) -> None:
    asyncio.run(create_conversation(lead_context.session_factory, session_id="session-hot"))

    response = lead_context.client.post("/api/v1/leads", json=valid_renter_payload())

    assert response.status_code == 201
    body = response.json()
    assert set(body) == {"renter_id", "message"}
    assert body["message"] == "Thank you. Our team will be in touch within 24 hours."

    renter = asyncio.run(fetch_renter(lead_context.session_factory, body["renter_id"]))
    assert renter is not None
    assert renter.email == "renter@example.com"
    assert renter.intent_score == 85
    assert renter.fintech_flags == {"deposit_share": False, "guarantor": False}
    assert renter.consent_given is True
    assert renter.consent_version == CONSENT_VERSION
    assert renter.consent_at is not None

    linked_conversation = asyncio.run(
        fetch_conversation(lead_context.session_factory, session_id="session-hot")
    )
    assert linked_conversation is not None
    assert str(linked_conversation.renter_id) == body["renter_id"]

    assert [call.template for call in lead_context.notifications.calls] == [
        EmailTemplate.RENTER_CONFIRMATION,
        EmailTemplate.HOT_RENTER_ALERT,
    ]
    assert lead_context.notifications.calls[0].to_email == "renter@example.com"
    assert lead_context.notifications.calls[1].intent_score == 85


def test_create_renter_lead_rejects_missing_consent_without_side_effects(
    lead_context: LeadEndpointContext,
) -> None:
    payload = valid_renter_payload()
    payload["consent_given"] = False

    response = lead_context.client.post("/api/v1/leads", json=payload)

    assert response.status_code == 422
    assert asyncio.run(count_renters(lead_context.session_factory)) == 0
    assert lead_context.notifications.calls == []


def test_create_renter_lead_rejects_stale_consent_version_without_side_effects(
    lead_context: LeadEndpointContext,
) -> None:
    payload = valid_renter_payload(consent_version="2026-01-01")

    response = lead_context.client.post("/api/v1/leads", json=payload)

    assert response.status_code == 422
    assert response.json() == {"detail": "Unsupported consent version."}
    assert asyncio.run(count_renters(lead_context.session_factory)) == 0
    assert lead_context.notifications.calls == []


def test_create_renter_lead_rate_limits_public_requests(
    lead_context: LeadEndpointContext,
) -> None:
    lead_context.client.app.state.settings.leads_rate_limit_max_requests = 1

    first_response = lead_context.client.post(
        "/api/v1/leads",
        json=valid_renter_payload(email="rate-one@example.com", session_id="rate-one"),
    )
    second_response = lead_context.client.post(
        "/api/v1/leads",
        json=valid_renter_payload(email="rate-two@example.com", session_id="rate-two"),
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 429
    assert second_response.json() == {"detail": "Too many requests. Try again later."}
    assert int(second_response.headers["retry-after"]) > 0
    assert asyncio.run(count_renters(lead_context.session_factory)) == 1


def test_duplicate_email_returns_existing_renter_and_skips_duplicate_notifications(
    lead_context: LeadEndpointContext,
) -> None:
    first_response = lead_context.client.post("/api/v1/leads", json=valid_renter_payload())
    assert first_response.status_code == 201
    existing_renter_id = first_response.json()["renter_id"]
    initial_notification_calls = list(lead_context.notifications.calls)
    asyncio.run(create_conversation(lead_context.session_factory, session_id="duplicate-session"))

    duplicate_payload = valid_renter_payload(
        email="RENTER@EXAMPLE.COM",
        session_id="duplicate-session",
        full_name="Second Submission",
    )
    duplicate_response = lead_context.client.post("/api/v1/leads", json=duplicate_payload)

    assert duplicate_response.status_code == 200
    assert duplicate_response.json() == {
        "renter_id": existing_renter_id,
        "message": "We already have your details. Our team will be in touch within 24 hours.",
    }
    assert asyncio.run(count_renters(lead_context.session_factory)) == 1
    assert lead_context.notifications.calls == initial_notification_calls

    linked_conversation = asyncio.run(
        fetch_conversation(lead_context.session_factory, session_id="duplicate-session")
    )
    assert linked_conversation is not None
    assert str(linked_conversation.renter_id) == existing_renter_id


def test_non_hot_renter_lead_sends_confirmation_without_agent_alert(
    lead_context: LeadEndpointContext,
) -> None:
    payload = valid_renter_payload(
        session_id="session-standard",
        max_rent=500,
        move_in_by=(date.today() + timedelta(days=120)).isoformat(),
        employment_status="other",
        has_guarantor="unsure",
        deposit_availability="full",
        has_rented_before=False,
        areas_preferred=["Manchester City Centre"],
    )

    response = lead_context.client.post("/api/v1/leads", json=payload)

    assert response.status_code == 201
    renter = asyncio.run(fetch_renter(lead_context.session_factory, response.json()["renter_id"]))
    assert renter is not None
    assert renter.intent_score == 5
    assert [call.template for call in lead_context.notifications.calls] == [
        EmailTemplate.RENTER_CONFIRMATION,
    ]


def test_concurrent_duplicate_email_falls_back_to_existing_without_500(
    lead_context: LeadEndpointContext,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    existing_id = asyncio.run(seed_renter(lead_context.session_factory, email="renter@example.com"))

    from app.routers import leads as leads_module

    real_find = leads_module.find_renter_by_email
    state = {"calls": 0}

    async def flaky_find(session: AsyncSession, normalized_email: str) -> Renter | None:
        # Simulate the race: the pre-insert lookup misses a row a concurrent
        # request committed, so the flush hits uq_renters_email_lower.
        state["calls"] += 1
        if state["calls"] == 1:
            return None
        return await real_find(session, normalized_email)

    monkeypatch.setattr(leads_module, "find_renter_by_email", flaky_find)

    response = lead_context.client.post("/api/v1/leads", json=valid_renter_payload(session_id=None))

    assert response.status_code == 200
    assert response.json()["renter_id"] == str(existing_id)
    assert asyncio.run(count_renters(lead_context.session_factory)) == 1
    assert lead_context.notifications.calls == []


def test_lead_is_persisted_even_when_confirmation_delivery_fails(
    lead_context: LeadEndpointContext,
) -> None:
    lead_context.notifications.confirmation_should_fail = True

    response = lead_context.client.post("/api/v1/leads", json=valid_renter_payload(session_id=None))

    assert response.status_code == 201
    renter = asyncio.run(fetch_renter(lead_context.session_factory, response.json()["renter_id"]))
    assert renter is not None
    assert renter.email == "renter@example.com"
    # Confirmation was still attempted (best-effort, after the response).
    assert lead_context.notifications.calls[0].template == EmailTemplate.RENTER_CONFIRMATION


def valid_renter_payload(**overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "source_channel": "website",
        "session_id": "session-hot",
        "full_name": "Test Renter",
        "email": "renter@example.com",
        "phone": "07123456789",
        "bedrooms_required": 2,
        "areas_preferred": ["Manchester"],
        "max_rent": 1200,
        "move_in_from": (date.today() + timedelta(days=14)).isoformat(),
        "move_in_by": (date.today() + timedelta(days=21)).isoformat(),
        "employment_status": "employed_full",
        "annual_income_range": "25000-35000",
        "has_guarantor": "yes",
        "deposit_availability": "full",
        "current_housing": "renting",
        "how_heard": "facebook",
        "furnished_preference": "no_preference",
        "pets": "none",
        "accessibility_needs": None,
        "has_rented_before": True,
        "notes": "Looking for a flat near transport.",
        "consent_given": True,
        "consent_version": CONSENT_VERSION,
    }
    payload.update(overrides)
    return payload


async def create_conversation(
    session_factory: async_sessionmaker[AsyncSession],
    *,
    session_id: str,
) -> None:
    async with session_factory() as session:
        session.add(
            Conversation(
                session_id=session_id,
                channel="website",
                transcript=[{"role": "user", "content": "Hello", "ts": "2026-06-13T10:00:00Z"}],
            )
        )
        await session.commit()


async def seed_renter(
    session_factory: async_sessionmaker[AsyncSession],
    *,
    email: str,
) -> UUID:
    async with session_factory() as session:
        renter = Renter(
            source_channel="website",
            email=email,
            consent_given=True,
            consent_version=CONSENT_VERSION,
            consent_at=datetime.now(UTC),
        )
        session.add(renter)
        await session.commit()
        return renter.id


async def fetch_renter(
    session_factory: async_sessionmaker[AsyncSession],
    renter_id: str,
) -> Renter | None:
    async with session_factory() as session:
        return await session.scalar(select(Renter).where(Renter.id == UUID(renter_id)))


async def fetch_conversation(
    session_factory: async_sessionmaker[AsyncSession],
    *,
    session_id: str,
) -> Conversation | None:
    async with session_factory() as session:
        return await session.scalar(
            select(Conversation).where(Conversation.session_id == session_id)
        )


async def count_renters(session_factory: async_sessionmaker[AsyncSession]) -> int:
    async with session_factory() as session:
        count = await session.scalar(select(func.count()).select_from(Renter))
        return int(count or 0)
