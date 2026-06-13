from collections.abc import AsyncGenerator
from functools import lru_cache
from typing import Any

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import StaticPool

from app.config import Settings, get_settings


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


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    session_factory = get_sessionmaker()
    async with session_factory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
