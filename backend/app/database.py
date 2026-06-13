from collections.abc import AsyncGenerator
from functools import lru_cache
from typing import Any, cast

from fastapi import Request
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import StaticPool

from app.config import Settings, get_settings

SESSIONMAKER_STATE_KEY = "db_sessionmaker"


def create_engine(settings: Settings) -> AsyncEngine:
    database_url = settings.resolved_database_url()
    engine_kwargs: dict[str, Any] = {
        "echo": settings.database_echo,
        "pool_pre_ping": True,
    }

    if database_url.startswith("sqlite+aiosqlite://"):
        engine_kwargs["connect_args"] = {"check_same_thread": False}
        if database_url.startswith("sqlite+aiosqlite:///:memory:"):
            engine_kwargs["poolclass"] = StaticPool
    else:
        engine_kwargs["pool_size"] = settings.database_pool_size
        engine_kwargs["max_overflow"] = settings.database_max_overflow

    return create_async_engine(database_url, **engine_kwargs)


def create_sessionmaker(settings: Settings) -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(
        bind=create_engine(settings),
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )


@lru_cache
def get_engine() -> AsyncEngine:
    return create_engine(get_settings())


@lru_cache
def get_sessionmaker() -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(
        bind=get_engine(),
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )


def get_request_sessionmaker(request: Request) -> async_sessionmaker[AsyncSession]:
    session_factory = cast(
        async_sessionmaker[AsyncSession] | None,
        getattr(request.app.state, SESSIONMAKER_STATE_KEY, None),
    )
    if session_factory is not None:
        return session_factory

    settings = cast(Settings | None, getattr(request.app.state, "settings", None))
    session_factory = create_sessionmaker(settings or get_settings())
    setattr(request.app.state, SESSIONMAKER_STATE_KEY, session_factory)
    return session_factory


async def get_db_session(request: Request) -> AsyncGenerator[AsyncSession, None]:
    session_factory = get_request_sessionmaker(request)
    async with session_factory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
