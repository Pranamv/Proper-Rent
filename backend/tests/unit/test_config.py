import pytest
from pydantic import ValidationError

from app.config import REQUIRED_DEPLOYMENT_SETTINGS, Settings


def test_test_environment_allows_missing_integration_secrets() -> None:
    settings = Settings(app_env="test")

    assert settings.app_env == "test"
    assert settings.api_v1_prefix == "/api/v1"
    assert settings.consent_version == "2026-06-13"
    assert settings.public_rate_limit_window_seconds == 60
    assert settings.chat_rate_limit_max_requests == 30
    assert settings.leads_rate_limit_max_requests == 30
    assert settings.landlords_rate_limit_max_requests == 30
    assert settings.chat_session_max_turns == 50
    assert settings.resolved_database_url() == "sqlite+aiosqlite:///:memory:"


def test_local_environment_allows_missing_database_until_dependency_use() -> None:
    settings = Settings(app_env="local")

    with pytest.raises(ValueError, match="DATABASE_URL is required"):
        settings.resolved_database_url()


def test_deployment_environment_requires_integration_settings(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    for field_name in REQUIRED_DEPLOYMENT_SETTINGS:
        monkeypatch.delenv(field_name.upper(), raising=False)

    with pytest.raises(ValidationError) as exc_info:
        Settings(app_env="production")

    message = str(exc_info.value)
    assert "Missing required deployment settings" in message
    assert "database_url" in message
    assert "openrouter_api_key" in message


def test_deployment_environment_accepts_required_integration_settings() -> None:
    settings = Settings(
        app_env="production",
        database_url="postgresql+asyncpg://postgres:password@example.test:5432/postgres",
        openrouter_api_key="test-openrouter",
        supabase_url="https://example.supabase.co",
        supabase_service_role_key="test-service-role",
        supabase_jwt_secret="test-jwt-secret",
        resend_api_key="test-resend",
        admin_alert_email="admin@example.com",
    )

    assert settings.app_env == "production"
    assert settings.resolved_database_url().startswith("postgresql+asyncpg://")
