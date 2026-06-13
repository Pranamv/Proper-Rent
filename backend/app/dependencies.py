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
from app.services.rate_limit import InMemoryRateLimiter

admin_bearer_scheme = HTTPBearer(auto_error=False)


def get_app_settings(request: Request) -> Settings:
    return cast(Settings, request.app.state.settings)


def get_rate_limiter(request: Request) -> InMemoryRateLimiter:
    return cast(InMemoryRateLimiter, request.app.state.rate_limiter)


SettingsDependency = Annotated[Settings, Depends(get_app_settings)]
RateLimiterDependency = Annotated[InMemoryRateLimiter, Depends(get_rate_limiter)]
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


def validate_consent_version(submitted_version: str, settings: Settings) -> None:
    if submitted_version == settings.consent_version:
        return

    raise HTTPException(
        status_code=422,
        detail="Unsupported consent version.",
    )


async def enforce_chat_rate_limit(
    request: Request,
    settings: SettingsDependency,
    rate_limiter: RateLimiterDependency,
) -> None:
    await enforce_public_rate_limit(
        request=request,
        settings=settings,
        rate_limiter=rate_limiter,
        scope="chat",
        limit=settings.chat_rate_limit_max_requests,
    )


async def enforce_leads_rate_limit(
    request: Request,
    settings: SettingsDependency,
    rate_limiter: RateLimiterDependency,
) -> None:
    await enforce_public_rate_limit(
        request=request,
        settings=settings,
        rate_limiter=rate_limiter,
        scope="leads",
        limit=settings.leads_rate_limit_max_requests,
    )


async def enforce_landlords_rate_limit(
    request: Request,
    settings: SettingsDependency,
    rate_limiter: RateLimiterDependency,
) -> None:
    await enforce_public_rate_limit(
        request=request,
        settings=settings,
        rate_limiter=rate_limiter,
        scope="landlords",
        limit=settings.landlords_rate_limit_max_requests,
    )


async def enforce_public_rate_limit(
    *,
    request: Request,
    settings: Settings,
    rate_limiter: InMemoryRateLimiter,
    scope: str,
    limit: int,
) -> None:
    if not settings.public_rate_limit_enabled:
        return

    client_host = request.client.host if request.client else "unknown"
    decision = await rate_limiter.check(
        key=f"{scope}:{client_host}",
        limit=limit,
        window_seconds=settings.public_rate_limit_window_seconds,
    )
    if decision.allowed:
        return

    raise HTTPException(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        detail="Too many requests. Try again later.",
        headers={"Retry-After": str(decision.retry_after_seconds)},
    )


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
    "enforce_chat_rate_limit",
    "enforce_landlords_rate_limit",
    "enforce_leads_rate_limit",
    "get_app_settings",
    "get_db_session",
    "get_llm_client",
    "get_notification_service",
    "get_rate_limiter",
    "require_admin",
    "validate_consent_version",
]
