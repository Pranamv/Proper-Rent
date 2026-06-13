from __future__ import annotations

import asyncio
from collections.abc import AsyncGenerator, Generator
from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
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
from app.models import Agent, Base, Landlord

JWT_SECRET = "test-supabase-jwt-secret-at-least-32-bytes"
CONSENT_VERSION = "2026-06-13"


@dataclass(frozen=True)
class AdminLandlordsContext:
    client: TestClient
    session_factory: async_sessionmaker[AsyncSession]


@dataclass(frozen=True)
class SeededLandlord:
    id: UUID
    email: str


@pytest.fixture
def admin_landlords_context() -> Generator[AdminLandlordsContext, None, None]:
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
        yield AdminLandlordsContext(
            client=TestClient(app),
            session_factory=session_factory,
        )
    finally:
        app.dependency_overrides.clear()
        asyncio.run(engine.dispose())


async def create_tables(engine: Any) -> None:
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)


def test_admin_landlords_list_requires_admin_access(
    admin_landlords_context: AdminLandlordsContext,
) -> None:
    response = admin_landlords_context.client.get("/api/v1/admin/landlords")

    assert response.status_code == 401

    asyncio.run(
        seed_agent(
            admin_landlords_context.session_factory,
            name="Agent User",
            email="agent@example.com",
            role="agent",
        )
    )
    forbidden_response = admin_landlords_context.client.get(
        "/api/v1/admin/landlords",
        headers=auth_headers(build_token(email="agent@example.com")),
    )

    assert forbidden_response.status_code == 403


def test_admin_landlords_list_filters_paginates_and_orders_by_created_at(
    admin_landlords_context: AdminLandlordsContext,
) -> None:
    asyncio.run(
        seed_agent(
            admin_landlords_context.session_factory,
            name="Admin User",
            email="admin@example.com",
            role="admin",
        )
    )
    now = datetime.now(UTC)
    asyncio.run(
        seed_landlords(
            admin_landlords_context.session_factory,
            [
                landlord_seed(
                    email="new@example.com",
                    full_name="New Landlord",
                    status="new",
                    created_at=now,
                ),
                landlord_seed(
                    email="contacted-newer@example.com",
                    full_name="Contacted Newer",
                    status="contacted",
                    created_at=now - timedelta(minutes=5),
                ),
                landlord_seed(
                    email="contacted-older@example.com",
                    full_name="Contacted Older",
                    status="contacted",
                    created_at=now - timedelta(minutes=30),
                ),
                landlord_seed(
                    email="listed@example.com",
                    full_name="Listed Landlord",
                    status="listed",
                    created_at=now - timedelta(hours=1),
                ),
            ],
        )
    )

    response = admin_landlords_context.client.get(
        "/api/v1/admin/landlords",
        params={"status": "contacted", "page": 2, "limit": 1},
        headers=auth_headers(build_token(email="admin@example.com")),
    )

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 2
    assert body["page"] == 2
    assert body["limit"] == 1
    assert [result["email"] for result in body["results"]] == ["contacted-older@example.com"]
    assert body["results"][0]["full_name"] == "Contacted Older"
    assert body["results"][0]["status"] == "contacted"
    assert Decimal(str(body["results"][0]["asking_rent"])) == Decimal("1400")


def test_admin_landlord_detail_returns_404_for_missing_landlord(
    admin_landlords_context: AdminLandlordsContext,
) -> None:
    asyncio.run(
        seed_agent(
            admin_landlords_context.session_factory,
            name="Admin User",
            email="admin@example.com",
            role="admin",
        )
    )

    response = admin_landlords_context.client.get(
        f"/api/v1/admin/landlords/{uuid4()}",
        headers=auth_headers(build_token(email="admin@example.com")),
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Landlord lead not found"}


def test_admin_landlord_detail_returns_full_record(
    admin_landlords_context: AdminLandlordsContext,
) -> None:
    asyncio.run(
        seed_agent(
            admin_landlords_context.session_factory,
            name="Admin User",
            email="admin@example.com",
            role="admin",
        )
    )
    landlord = asyncio.run(
        seed_landlord(
            admin_landlords_context.session_factory,
            email="detail@example.com",
            full_name="Detail Landlord",
            property_address="99 Detail Road",
            status="listed",
            notes="Already listed with Scraye.",
        )
    )

    response = admin_landlords_context.client.get(
        f"/api/v1/admin/landlords/{landlord.id}",
        headers=auth_headers(build_token(email="admin@example.com")),
    )

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == str(landlord.id)
    assert body["full_name"] == "Detail Landlord"
    assert body["email"] == "detail@example.com"
    assert body["property_address"] == "99 Detail Road"
    assert body["status"] == "listed"
    assert body["notes"] == "Already listed with Scraye."
    assert body["consent_given"] is True
    assert body["consent_version"] == CONSENT_VERSION
    assert body["consent_at"] is not None


def test_admin_landlord_patch_updates_status_and_notes(
    admin_landlords_context: AdminLandlordsContext,
) -> None:
    asyncio.run(
        seed_agent(
            admin_landlords_context.session_factory,
            name="Admin User",
            email="admin@example.com",
            role="admin",
        )
    )
    landlord = asyncio.run(
        seed_landlord(
            admin_landlords_context.session_factory,
            email="patch@example.com",
            full_name="Patch Landlord",
            status="new",
            notes="Initial note.",
        )
    )

    response = admin_landlords_context.client.patch(
        f"/api/v1/admin/landlords/{landlord.id}",
        json={"status": "contacted", "notes": "Called owner and requested photos."},
        headers=auth_headers(build_token(email="admin@example.com")),
    )

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == str(landlord.id)
    assert body["status"] == "contacted"
    assert body["notes"] == "Called owner and requested photos."
    assert body["updated_at"] is not None

    updated_landlord = asyncio.run(
        fetch_landlord(admin_landlords_context.session_factory, landlord.id)
    )
    assert updated_landlord is not None
    assert updated_landlord.status == "contacted"
    assert updated_landlord.notes == "Called owner and requested photos."
    assert updated_landlord.updated_at is not None


def test_admin_landlord_patch_can_clear_notes_without_status_change(
    admin_landlords_context: AdminLandlordsContext,
) -> None:
    asyncio.run(
        seed_agent(
            admin_landlords_context.session_factory,
            name="Admin User",
            email="admin@example.com",
            role="admin",
        )
    )
    landlord = asyncio.run(
        seed_landlord(
            admin_landlords_context.session_factory,
            email="clear-notes@example.com",
            full_name="Clear Notes Landlord",
            status="contacted",
            notes="Temporary note.",
        )
    )

    response = admin_landlords_context.client.patch(
        f"/api/v1/admin/landlords/{landlord.id}",
        json={"notes": None},
        headers=auth_headers(build_token(email="admin@example.com")),
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "contacted"
    assert body["notes"] is None


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


async def seed_landlords(
    session_factory: async_sessionmaker[AsyncSession],
    seeds: list[dict[str, Any]],
) -> list[SeededLandlord]:
    async with session_factory() as session:
        landlords = [Landlord(**seed) for seed in seeds]
        session.add_all(landlords)
        await session.commit()
        return [
            SeededLandlord(id=landlord.id, email=landlord.email or "") for landlord in landlords
        ]


async def seed_landlord(
    session_factory: async_sessionmaker[AsyncSession],
    **overrides: Any,
) -> SeededLandlord:
    return (
        await seed_landlords(
            session_factory,
            [
                landlord_seed(
                    **overrides,
                )
            ],
        )
    )[0]


async def fetch_landlord(
    session_factory: async_sessionmaker[AsyncSession],
    landlord_id: UUID,
) -> Landlord | None:
    async with session_factory() as session:
        return await session.scalar(select(Landlord).where(Landlord.id == landlord_id))


def landlord_seed(**overrides: Any) -> dict[str, Any]:
    seed: dict[str, Any] = {
        "full_name": "Admin Landlord",
        "email": "admin-landlord@example.com",
        "phone": "07987654321",
        "property_address": "1 Admin Street",
        "bedrooms": 2,
        "asking_rent": Decimal("1400"),
        "available_from": date(2026, 8, 1),
        "advanced_rent_interest": True,
        "listing_interest": True,
        "status": "new",
        "consent_given": True,
        "consent_version": CONSENT_VERSION,
        "consent_at": datetime.now(UTC),
        "notes": "Interested in listing.",
        "created_at": datetime.now(UTC),
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
