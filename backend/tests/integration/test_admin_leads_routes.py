from __future__ import annotations

import asyncio
from collections.abc import AsyncGenerator, Generator
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID, uuid4

import jwt
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.config import Settings
from app.database import create_engine, get_db_session
from app.main import create_app
from app.models import Agent, Base, Conversation, Renter

JWT_SECRET = "test-supabase-jwt-secret-at-least-32-bytes"
CONSENT_VERSION = "2026-06-13"


@dataclass(frozen=True)
class AdminLeadsContext:
    client: TestClient
    session_factory: async_sessionmaker[AsyncSession]


@dataclass(frozen=True)
class SeededLead:
    id: UUID
    email: str


@pytest.fixture
def admin_leads_context() -> Generator[AdminLeadsContext, None, None]:
    settings = Settings(app_env="test", supabase_jwt_secret=JWT_SECRET)
    engine = create_engine(settings)
    session_factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
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

    try:
        yield AdminLeadsContext(
            client=TestClient(app),
            session_factory=session_factory,
        )
    finally:
        app.dependency_overrides.clear()
        asyncio.run(engine.dispose())


async def create_tables(engine: Any) -> None:
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)


def test_admin_leads_list_requires_admin_access(
    admin_leads_context: AdminLeadsContext,
) -> None:
    response = admin_leads_context.client.get("/api/v1/admin/leads")

    assert response.status_code == 401

    asyncio.run(
        seed_agent(
            admin_leads_context.session_factory,
            name="Agent User",
            email="agent@example.com",
            role="agent",
        )
    )
    forbidden_response = admin_leads_context.client.get(
        "/api/v1/admin/leads",
        headers=auth_headers(build_token(email="agent@example.com")),
    )

    assert forbidden_response.status_code == 403


def test_admin_leads_list_filters_paginates_and_returns_summary(
    admin_leads_context: AdminLeadsContext,
) -> None:
    asyncio.run(
        seed_agent(
            admin_leads_context.session_factory,
            name="Admin User",
            email="admin@example.com",
            role="admin",
        )
    )
    assigned_agent_id = asyncio.run(
        seed_agent(
            admin_leads_context.session_factory,
            name="Pipeline Agent",
            email="pipeline@example.com",
            role="agent",
        )
    )
    now = datetime.now(UTC)
    asyncio.run(
        seed_renters(
            admin_leads_context.session_factory,
            [
                renter_seed(
                    email="hot@example.com",
                    full_name="Hot Lead",
                    lead_status="new",
                    intent_score=80,
                    assigned_agent_id=assigned_agent_id,
                    created_at=now,
                ),
                renter_seed(
                    email="contacted@example.com",
                    full_name="Contacted Lead",
                    lead_status="contacted",
                    intent_score=45,
                    assigned_agent_id=assigned_agent_id,
                    created_at=now - timedelta(minutes=5),
                ),
                renter_seed(
                    email="qualified@example.com",
                    full_name="Qualified Lead",
                    lead_status="qualified",
                    intent_score=72,
                    assigned_agent_id=None,
                    created_at=now - timedelta(minutes=10),
                ),
                renter_seed(
                    email="lost@example.com",
                    full_name="Old Lost Lead",
                    lead_status="lost",
                    intent_score=90,
                    assigned_agent_id=assigned_agent_id,
                    created_at=now - timedelta(days=2),
                ),
            ],
        )
    )

    response = admin_leads_context.client.get(
        "/api/v1/admin/leads",
        params={
            "status": "contacted",
            "assigned_agent_id": str(assigned_agent_id),
            "page": 1,
            "limit": 10,
        },
        headers=auth_headers(build_token(email="admin@example.com")),
    )

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["page"] == 1
    assert body["limit"] == 10
    assert [result["email"] for result in body["results"]] == ["contacted@example.com"]
    assert body["results"][0]["lead_status"] == "contacted"
    assert body["results"][0]["assigned_agent_id"] == str(assigned_agent_id)
    assert body["summary"] == {
        "new_leads_today": 3,
        "hot_leads_pending": 1,
        "pipeline_by_stage": {
            "new": 1,
            "contacted": 1,
            "qualified": 1,
            "viewing_arranged": 0,
            "offer_made": 0,
            "let_agreed": 0,
            "completed": 0,
            "lost": 1,
        },
    }


def test_admin_leads_list_orders_by_score_then_created_at(
    admin_leads_context: AdminLeadsContext,
) -> None:
    asyncio.run(
        seed_agent(
            admin_leads_context.session_factory,
            name="Admin User",
            email="admin@example.com",
            role="admin",
        )
    )
    now = datetime.now(UTC)
    asyncio.run(
        seed_renters(
            admin_leads_context.session_factory,
            [
                renter_seed(
                    email="low-newest@example.com",
                    full_name="Low Newest",
                    intent_score=40,
                    created_at=now,
                ),
                renter_seed(
                    email="hot-older@example.com",
                    full_name="Hot Older",
                    intent_score=85,
                    created_at=now - timedelta(minutes=10),
                ),
                renter_seed(
                    email="hot-newer@example.com",
                    full_name="Hot Newer",
                    intent_score=85,
                    created_at=now - timedelta(minutes=5),
                ),
            ],
        )
    )

    response = admin_leads_context.client.get(
        "/api/v1/admin/leads",
        headers=auth_headers(build_token(email="admin@example.com")),
    )

    assert response.status_code == 200
    assert [result["email"] for result in response.json()["results"]] == [
        "hot-newer@example.com",
        "hot-older@example.com",
        "low-newest@example.com",
    ]


def test_admin_lead_detail_returns_404_for_missing_lead(
    admin_leads_context: AdminLeadsContext,
) -> None:
    asyncio.run(
        seed_agent(
            admin_leads_context.session_factory,
            name="Admin User",
            email="admin@example.com",
            role="admin",
        )
    )

    response = admin_leads_context.client.get(
        f"/api/v1/admin/leads/{uuid4()}",
        headers=auth_headers(build_token(email="admin@example.com")),
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Lead not found"}


def test_admin_lead_detail_returns_full_internal_record(
    admin_leads_context: AdminLeadsContext,
) -> None:
    asyncio.run(
        seed_agent(
            admin_leads_context.session_factory,
            name="Admin User",
            email="admin@example.com",
            role="admin",
        )
    )
    lead = asyncio.run(
        seed_renter(
            admin_leads_context.session_factory,
            email="detail@example.com",
            full_name="Detail Lead",
            lead_status="qualified",
            intent_score=73,
            notes="Needs guarantor support.",
            fintech_flags={"deposit_share": True, "guarantor": True},
        )
    )

    response = admin_leads_context.client.get(
        f"/api/v1/admin/leads/{lead.id}",
        headers=auth_headers(build_token(email="admin@example.com")),
    )

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == str(lead.id)
    assert body["full_name"] == "Detail Lead"
    assert body["email"] == "detail@example.com"
    assert body["lead_status"] == "qualified"
    assert body["intent_score"] == 73
    assert body["notes"] == "Needs guarantor support."
    assert body["fintech_flags"] == {"deposit_share": True, "guarantor": True}
    assert body["consent_given"] is True
    assert body["consent_version"] == CONSENT_VERSION
    assert body["consent_at"] is not None


def test_admin_lead_patch_updates_status_assignment_and_notes(
    admin_leads_context: AdminLeadsContext,
) -> None:
    asyncio.run(
        seed_agent(
            admin_leads_context.session_factory,
            name="Admin User",
            email="admin@example.com",
            role="admin",
        )
    )
    assigned_agent_id = asyncio.run(
        seed_agent(
            admin_leads_context.session_factory,
            name="Assigned Agent",
            email="assigned@example.com",
            role="agent",
        )
    )
    lead = asyncio.run(
        seed_renter(
            admin_leads_context.session_factory,
            email="patch@example.com",
            full_name="Patch Lead",
            lead_status="new",
            intent_score=65,
        )
    )

    response = admin_leads_context.client.patch(
        f"/api/v1/admin/leads/{lead.id}",
        json={
            "lead_status": "viewing_arranged",
            "assigned_agent_id": str(assigned_agent_id),
            "notes": "Viewing booked for Friday.",
        },
        headers=auth_headers(build_token(email="admin@example.com")),
    )

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == str(lead.id)
    assert body["lead_status"] == "viewing_arranged"
    assert body["assigned_agent_id"] == str(assigned_agent_id)
    assert body["notes"] == "Viewing booked for Friday."
    assert body["updated_at"] is not None

    renter = asyncio.run(fetch_renter(admin_leads_context.session_factory, lead.id))
    assert renter is not None
    assert renter.lead_status == "viewing_arranged"
    assert renter.assigned_agent_id == assigned_agent_id
    assert renter.notes == "Viewing booked for Friday."
    assert renter.updated_at is not None


def test_admin_lead_patch_rejects_unknown_assigned_agent(
    admin_leads_context: AdminLeadsContext,
) -> None:
    asyncio.run(
        seed_agent(
            admin_leads_context.session_factory,
            name="Admin User",
            email="admin@example.com",
            role="admin",
        )
    )
    lead = asyncio.run(
        seed_renter(
            admin_leads_context.session_factory,
            email="invalid-assignment@example.com",
            full_name="Invalid Assignment Lead",
            lead_status="new",
            intent_score=50,
        )
    )

    response = admin_leads_context.client.patch(
        f"/api/v1/admin/leads/{lead.id}",
        json={"assigned_agent_id": str(uuid4())},
        headers=auth_headers(build_token(email="admin@example.com")),
    )

    assert response.status_code == 422
    assert response.json() == {"detail": "assigned_agent_id does not reference an agent"}


def test_admin_lead_conversation_returns_linked_conversations_in_started_order(
    admin_leads_context: AdminLeadsContext,
) -> None:
    asyncio.run(
        seed_agent(
            admin_leads_context.session_factory,
            name="Admin User",
            email="admin@example.com",
            role="admin",
        )
    )
    lead = asyncio.run(
        seed_renter(
            admin_leads_context.session_factory,
            email="conversation@example.com",
            full_name="Conversation Lead",
            lead_status="new",
            intent_score=77,
            session_id="session-linked",
        )
    )
    started_at = datetime(2026, 6, 13, 10, 0, tzinfo=UTC)
    asyncio.run(
        seed_conversations(
            admin_leads_context.session_factory,
            lead.id,
            [
                conversation_seed(
                    session_id="session-linked",
                    started_at=started_at + timedelta(minutes=10),
                    transcript=[{"role": "assistant", "content": "Second"}],
                    ai_summary="Second conversation",
                ),
                conversation_seed(
                    session_id="session-linked",
                    started_at=started_at,
                    transcript=[{"role": "user", "content": "First"}],
                    ai_summary="First conversation",
                ),
            ],
        )
    )

    response = admin_leads_context.client.get(
        f"/api/v1/admin/leads/{lead.id}/conversation",
        headers=auth_headers(build_token(email="admin@example.com")),
    )

    assert response.status_code == 200
    body = response.json()
    assert [conversation["ai_summary"] for conversation in body] == [
        "First conversation",
        "Second conversation",
    ]
    assert body[0]["renter_id"] == str(lead.id)
    assert body[0]["transcript"] == [{"role": "user", "content": "First"}]


async def seed_agent(
    session_factory: async_sessionmaker[AsyncSession],
    *,
    name: str,
    email: str,
    role: str,
) -> UUID:
    async with session_factory() as session:
        agent = Agent(name=name, email=email, role=role)
        session.add(agent)
        await session.commit()
        return agent.id


async def seed_renters(
    session_factory: async_sessionmaker[AsyncSession],
    seeds: list[dict[str, Any]],
) -> list[SeededLead]:
    async with session_factory() as session:
        renters = [Renter(**seed) for seed in seeds]
        session.add_all(renters)
        await session.commit()
        return [SeededLead(id=renter.id, email=renter.email or "") for renter in renters]


async def seed_renter(
    session_factory: async_sessionmaker[AsyncSession],
    **overrides: Any,
) -> SeededLead:
    return (
        await seed_renters(
            session_factory,
            [
                renter_seed(
                    **overrides,
                )
            ],
        )
    )[0]


async def seed_conversations(
    session_factory: async_sessionmaker[AsyncSession],
    renter_id: UUID,
    seeds: list[dict[str, Any]],
) -> None:
    async with session_factory() as session:
        conversations = [Conversation(renter_id=renter_id, **seed) for seed in seeds]
        session.add_all(conversations)
        await session.commit()


async def fetch_renter(
    session_factory: async_sessionmaker[AsyncSession],
    renter_id: UUID,
) -> Renter | None:
    async with session_factory() as session:
        return await session.scalar(select(Renter).where(Renter.id == renter_id))


def renter_seed(**overrides: Any) -> dict[str, Any]:
    seed: dict[str, Any] = {
        "source_channel": "website",
        "session_id": "session-default",
        "full_name": "Admin Lead",
        "email": "admin-lead@example.com",
        "phone": "07123456789",
        "bedrooms_required": 2,
        "areas_preferred": ["Manchester"],
        "max_rent": 1200,
        "move_in_by": datetime.now(UTC).date(),
        "employment_status": "employed_full",
        "has_guarantor": "yes",
        "deposit_availability": "full",
        "current_housing": "renting",
        "furnished_preference": "no_preference",
        "has_rented_before": True,
        "intent_score": 70,
        "lead_status": "new",
        "fintech_flags": {"deposit_share": False, "guarantor": False},
        "consent_given": True,
        "consent_version": CONSENT_VERSION,
        "consent_at": datetime.now(UTC),
        "created_at": datetime.now(UTC),
    }
    seed.update(overrides)
    return seed


def conversation_seed(**overrides: Any) -> dict[str, Any]:
    seed: dict[str, Any] = {
        "session_id": "session-default",
        "channel": "website",
        "transcript": [],
        "ai_summary": None,
        "intent_score_output": None,
        "started_at": datetime.now(UTC),
    }
    seed.update(overrides)
    return seed


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def build_token(
    *,
    email: str,
    expires_at: datetime | None = None,
) -> str:
    return jwt.encode(
        {
            "aud": "authenticated",
            "sub": "user-123",
            "email": email,
            "exp": expires_at or datetime.now(UTC) + timedelta(minutes=10),
        },
        JWT_SECRET,
        algorithm="HS256",
    )
