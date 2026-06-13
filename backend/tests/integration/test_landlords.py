from __future__ import annotations

import asyncio
from collections.abc import AsyncGenerator, Generator
from dataclasses import dataclass
from datetime import date
from decimal import Decimal
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
from app.models import Base, Landlord
from app.services.notifications import DeliveryStatus, EmailDelivery, EmailTemplate, RecipientKind

CONSENT_VERSION = "2026-06-13"


@dataclass(frozen=True)
class NotificationCall:
    template: EmailTemplate
    entity_id: UUID
    to_email: str | None = None


class FakeNotificationService:
    def __init__(self) -> None:
        self.calls: list[NotificationCall] = []
        self.confirmation_should_fail = False

    async def send_landlord_confirmation(
        self,
        *,
        landlord_id: UUID,
        landlord_email: str,
        consent_version: str,
    ) -> EmailDelivery:
        self.calls.append(
            NotificationCall(
                template=EmailTemplate.LANDLORD_CONFIRMATION,
                entity_id=landlord_id,
                to_email=landlord_email,
            )
        )
        if self.confirmation_should_fail:
            return EmailDelivery(
                template=EmailTemplate.LANDLORD_CONFIRMATION,
                recipient_kind=RecipientKind.LANDLORD,
                entity_id=landlord_id,
                status=DeliveryStatus.FAILED,
                error_type="EmailTransportError",
            )
        return EmailDelivery(
            template=EmailTemplate.LANDLORD_CONFIRMATION,
            recipient_kind=RecipientKind.LANDLORD,
            entity_id=landlord_id,
            status=DeliveryStatus.SENT,
            provider_message_id=f"confirmation-{len(self.calls)}",
        )

    async def send_landlord_agent_notification(
        self,
        *,
        landlord_id: UUID,
        consent_version: str,
    ) -> EmailDelivery:
        self.calls.append(
            NotificationCall(
                template=EmailTemplate.LANDLORD_AGENT_NOTIFICATION,
                entity_id=landlord_id,
            )
        )
        return EmailDelivery(
            template=EmailTemplate.LANDLORD_AGENT_NOTIFICATION,
            recipient_kind=RecipientKind.AGENT,
            entity_id=landlord_id,
            status=DeliveryStatus.SENT,
            provider_message_id=f"agent-{len(self.calls)}",
        )


@dataclass(frozen=True)
class LandlordEndpointContext:
    client: TestClient
    notifications: FakeNotificationService
    session_factory: async_sessionmaker[AsyncSession]


@pytest.fixture
def landlord_context() -> Generator[LandlordEndpointContext, None, None]:
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
        yield LandlordEndpointContext(
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


def test_create_landlord_intake_stores_row_and_sends_both_notifications(
    landlord_context: LandlordEndpointContext,
) -> None:
    response = landlord_context.client.post("/api/v1/landlords", json=valid_landlord_payload())

    assert response.status_code == 201
    body = response.json()
    assert set(body) == {"landlord_id", "message"}
    assert "score" not in body
    assert body["message"] == (
        "Thank you. An agent will review your property details and be in touch shortly."
    )

    landlord = asyncio.run(fetch_landlord(landlord_context.session_factory, body["landlord_id"]))
    assert landlord is not None
    assert landlord.full_name == "Test Landlord"
    assert landlord.email == "landlord@example.com"
    assert landlord.phone == "07987654321"
    assert landlord.property_address == "1 Test Street"
    assert landlord.bedrooms == 2
    assert landlord.asking_rent == Decimal("1400")
    assert landlord.advanced_rent_interest is True
    assert landlord.listing_interest is True
    assert landlord.status == "new"
    assert landlord.consent_given is True
    assert landlord.consent_version == CONSENT_VERSION
    assert landlord.consent_at is not None

    assert [call.template for call in landlord_context.notifications.calls] == [
        EmailTemplate.LANDLORD_CONFIRMATION,
        EmailTemplate.LANDLORD_AGENT_NOTIFICATION,
    ]
    assert landlord_context.notifications.calls[0].to_email == "landlord@example.com"


def test_create_landlord_intake_rejects_missing_consent_without_side_effects(
    landlord_context: LandlordEndpointContext,
) -> None:
    payload = valid_landlord_payload()
    payload["consent_given"] = False

    response = landlord_context.client.post("/api/v1/landlords", json=payload)

    assert response.status_code == 422
    assert asyncio.run(count_landlords(landlord_context.session_factory)) == 0
    assert landlord_context.notifications.calls == []


def test_create_landlord_intake_rejects_stale_consent_version_without_side_effects(
    landlord_context: LandlordEndpointContext,
) -> None:
    payload = valid_landlord_payload(consent_version="2026-01-01")

    response = landlord_context.client.post("/api/v1/landlords", json=payload)

    assert response.status_code == 422
    assert response.json() == {"detail": "Unsupported consent version."}
    assert asyncio.run(count_landlords(landlord_context.session_factory)) == 0
    assert landlord_context.notifications.calls == []


def test_create_landlord_intake_rate_limits_public_requests(
    landlord_context: LandlordEndpointContext,
) -> None:
    landlord_context.client.app.state.settings.landlords_rate_limit_max_requests = 1

    first_response = landlord_context.client.post(
        "/api/v1/landlords",
        json=valid_landlord_payload(email="rate-one@example.com"),
    )
    second_response = landlord_context.client.post(
        "/api/v1/landlords",
        json=valid_landlord_payload(email="rate-two@example.com"),
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 429
    assert second_response.json() == {"detail": "Too many requests. Try again later."}
    assert int(second_response.headers["retry-after"]) > 0
    assert asyncio.run(count_landlords(landlord_context.session_factory)) == 1


def test_create_landlord_intake_always_sends_agent_notification(
    landlord_context: LandlordEndpointContext,
) -> None:
    payload = valid_landlord_payload(
        advanced_rent_interest=False,
        listing_interest=False,
        email="SECOND-LANDLORD@EXAMPLE.COM",
    )

    response = landlord_context.client.post("/api/v1/landlords", json=payload)

    assert response.status_code == 201
    assert [call.template for call in landlord_context.notifications.calls] == [
        EmailTemplate.LANDLORD_CONFIRMATION,
        EmailTemplate.LANDLORD_AGENT_NOTIFICATION,
    ]
    landlord = asyncio.run(
        fetch_landlord(landlord_context.session_factory, response.json()["landlord_id"])
    )
    assert landlord is not None
    assert landlord.email == "second-landlord@example.com"
    assert landlord.advanced_rent_interest is False
    assert landlord.listing_interest is False


def test_landlord_is_persisted_even_when_confirmation_delivery_fails(
    landlord_context: LandlordEndpointContext,
) -> None:
    landlord_context.notifications.confirmation_should_fail = True

    response = landlord_context.client.post("/api/v1/landlords", json=valid_landlord_payload())

    assert response.status_code == 201
    landlord = asyncio.run(
        fetch_landlord(landlord_context.session_factory, response.json()["landlord_id"])
    )
    assert landlord is not None
    assert [call.template for call in landlord_context.notifications.calls] == [
        EmailTemplate.LANDLORD_CONFIRMATION,
        EmailTemplate.LANDLORD_AGENT_NOTIFICATION,
    ]


def valid_landlord_payload(**overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "full_name": "Test Landlord",
        "email": "landlord@example.com",
        "phone": "07987654321",
        "property_address": "1 Test Street",
        "bedrooms": 2,
        "asking_rent": 1400,
        "available_from": date(2026, 8, 1).isoformat(),
        "advanced_rent_interest": True,
        "listing_interest": True,
        "notes": "Interested in listing and Advanced Rent.",
        "consent_given": True,
        "consent_version": CONSENT_VERSION,
    }
    payload.update(overrides)
    return payload


async def fetch_landlord(
    session_factory: async_sessionmaker[AsyncSession],
    landlord_id: str,
) -> Landlord | None:
    async with session_factory() as session:
        return await session.scalar(select(Landlord).where(Landlord.id == UUID(landlord_id)))


async def count_landlords(session_factory: async_sessionmaker[AsyncSession]) -> int:
    async with session_factory() as session:
        count = await session.scalar(select(func.count()).select_from(Landlord))
        return int(count or 0)
