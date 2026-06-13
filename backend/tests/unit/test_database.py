from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings
from app.database import create_sessionmaker, get_db_session
from app.main import create_app


def test_create_sessionmaker_uses_test_database_url() -> None:
    settings = Settings(app_env="test")

    session_factory = create_sessionmaker(settings)

    assert str(session_factory.kw["bind"].url) == "sqlite+aiosqlite:///:memory:"


def test_db_dependency_can_be_overridden_in_tests() -> None:
    app = FastAPI()
    SessionDependency = Annotated[object, Depends(get_db_session)]

    class FakeSession:
        marker = "overridden"

    async def override_db_session() -> AsyncGenerator[FakeSession, None]:
        yield FakeSession()

    @app.get("/db-dependency")
    async def db_dependency(session: SessionDependency) -> dict[str, str]:
        return {"marker": getattr(session, "marker", "missing")}

    app.dependency_overrides[get_db_session] = override_db_session
    client = TestClient(app)

    response = client.get("/db-dependency")

    assert response.status_code == 200
    assert response.json() == {"marker": "overridden"}


def test_db_dependency_uses_create_app_settings(tmp_path) -> None:
    database_url = f"sqlite+aiosqlite:///{tmp_path / 'app-settings.db'}"
    app = create_app(Settings(app_env="test", test_database_url=database_url))
    SessionDependency = Annotated[AsyncSession, Depends(get_db_session)]

    @app.get("/db-url")
    async def db_url(session: SessionDependency) -> dict[str, str]:
        return {"url": str(session.bind.url)}

    client = TestClient(app)

    response = client.get("/db-url")

    assert response.status_code == 200
    assert response.json() == {"url": database_url}
