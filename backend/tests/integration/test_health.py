from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app


def test_health_returns_status_and_version() -> None:
    client = TestClient(create_app(Settings(app_env="test", app_version="test-version")))

    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "version": "test-version"}
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert response.headers["referrer-policy"] == "strict-origin-when-cross-origin"
