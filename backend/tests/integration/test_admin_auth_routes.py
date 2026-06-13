from __future__ import annotations

import asyncio
from collections.abc import AsyncGenerator, Generator
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID

import jwt
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.config import Settings
from app.database import create_engine, get_db_session
from app.main import create_app
from app.models import Agent, Base

JWT_SECRET = "test-supabase-jwt-secret-at-least-32-bytes"


@dataclass(frozen=True)
class AdminAuthContext:
    client: TestClient
    session_factory: async_sessionmaker[AsyncSession]


@pytest.fixture
def admin_auth_context() -> Generator[AdminAuthContext, None, None]:
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
        yield AdminAuthContext(
            client=TestClient(app),
            session_factory=session_factory,
        )
    finally:
        app.dependency_overrides.clear()
        asyncio.run(engine.dispose())


async def create_tables(engine: Any) -> None:
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)


def test_admin_auth_check_returns_401_without_token(
    admin_auth_context: AdminAuthContext,
) -> None:
    response = admin_auth_context.client.get("/api/v1/admin/auth/check")

    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


def test_admin_auth_check_returns_401_for_invalid_token(
    admin_auth_context: AdminAuthContext,
) -> None:
    response = admin_auth_context.client.get(
        "/api/v1/admin/auth/check",
        headers={"Authorization": "Bearer not-a-valid-jwt"},
    )

    assert response.status_code == 401


def test_admin_auth_check_returns_403_without_agent_row(
    admin_auth_context: AdminAuthContext,
) -> None:
    response = admin_auth_context.client.get(
        "/api/v1/admin/auth/check",
        headers=auth_headers(build_token(email="missing-agent@example.com")),
    )

    assert response.status_code == 403
    assert response.json() == {"detail": "Admin access required"}


def test_admin_auth_check_returns_403_for_non_admin_agent(
    admin_auth_context: AdminAuthContext,
) -> None:
    asyncio.run(
        seed_agent(
            admin_auth_context.session_factory,
            name="Test Agent",
            email="agent@example.com",
            role="agent",
        )
    )

    response = admin_auth_context.client.get(
        "/api/v1/admin/auth/check",
        headers=auth_headers(build_token(email="agent@example.com")),
    )

    assert response.status_code == 403
    assert response.json() == {"detail": "Admin access required"}


def test_admin_auth_check_returns_200_for_admin_agent(
    admin_auth_context: AdminAuthContext,
) -> None:
    agent_id = asyncio.run(
        seed_agent(
            admin_auth_context.session_factory,
            name="Test Admin",
            email="admin@example.com",
            role="admin",
        )
    )

    response = admin_auth_context.client.get(
        "/api/v1/admin/auth/check",
        headers=auth_headers(build_token(email="ADMIN@EXAMPLE.COM")),
    )

    assert response.status_code == 200
    assert response.json() == {
        "agent_id": str(agent_id),
        "email": "admin@example.com",
        "role": "admin",
    }


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
