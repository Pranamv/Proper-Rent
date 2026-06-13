from dataclasses import dataclass
from typing import Annotated, Literal, cast
from uuid import UUID

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings
from app.database import get_db_session
from app.models import Agent
from app.services.admin_auth import (
    AdminAuthError,
    extract_admin_email,
    verify_supabase_access_token,
)
from app.services.llm_client import OpenRouterClient
from app.services.llm_client import get_llm_client as build_llm_client
from app.services.notifications import NotificationService

admin_bearer_scheme = HTTPBearer(auto_error=False)


def get_app_settings(request: Request) -> Settings:
    return cast(Settings, request.app.state.settings)


SettingsDependency = Annotated[Settings, Depends(get_app_settings)]
DbSession = Annotated[AsyncSession, Depends(get_db_session)]
BearerCredentials = Annotated[
    HTTPAuthorizationCredentials | None,
    Depends(admin_bearer_scheme),
]


@dataclass(frozen=True)
class AuthenticatedAdmin:
    agent_id: UUID
    email: str
    role: Literal["admin"]


def get_notification_service(settings: SettingsDependency) -> NotificationService:
    return NotificationService(settings=settings)


def get_llm_client(settings: SettingsDependency) -> OpenRouterClient:
    return build_llm_client(settings)


async def require_admin(
    credentials: BearerCredentials,
    settings: SettingsDependency,
    session: DbSession,
) -> AuthenticatedAdmin:
    if credentials is None:
        raise admin_unauthorized("Missing bearer token")

    try:
        payload = verify_supabase_access_token(
            credentials.credentials,
            jwt_secret=settings.supabase_jwt_secret,
        )
        email = extract_admin_email(payload)
    except AdminAuthError:
        raise admin_unauthorized("Invalid admin token") from None

    agent = await session.scalar(select(Agent).where(func.lower(Agent.email) == email).limit(1))
    if agent is None or agent.role != "admin":
        raise admin_forbidden()

    return AuthenticatedAdmin(agent_id=agent.id, email=agent.email, role="admin")


def admin_unauthorized(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def admin_forbidden() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Admin access required",
    )


__all__ = [
    "AuthenticatedAdmin",
    "get_app_settings",
    "get_db_session",
    "get_llm_client",
    "get_notification_service",
    "require_admin",
]
