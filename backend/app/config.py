from functools import lru_cache
from typing import Literal, Self

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

AppEnv = Literal["local", "test", "staging", "production"]

REQUIRED_DEPLOYMENT_SETTINGS = (
    "database_url",
    "openrouter_api_key",
    "supabase_url",
    "supabase_service_role_key",
    "supabase_jwt_secret",
    "resend_api_key",
    "admin_alert_email",
)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=("../.env", ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    app_env: AppEnv = "local"
    app_version: str = "0.1.0"
    api_v1_prefix: str = "/api/v1"
    cors_allowed_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])

    database_url: str | None = None
    test_database_url: str = "sqlite+aiosqlite:///:memory:"
    database_echo: bool = False
    database_pool_size: int = 5
    database_max_overflow: int = 10

    openrouter_api_key: str | None = None
    llm_model: str = "openai/gpt-4o-mini"
    supabase_url: str | None = None
    supabase_service_role_key: str | None = None
    supabase_jwt_secret: str | None = None
    resend_api_key: str | None = None
    admin_alert_email: str | None = None

    sync_interval_hours: int = 12
    meta_app_secret: str | None = None
    meta_webhook_verify_token: str | None = None

    @model_validator(mode="after")
    def require_deployment_integrations(self) -> Self:
        if self.app_env not in {"staging", "production"}:
            return self

        missing = [
            field_name
            for field_name in REQUIRED_DEPLOYMENT_SETTINGS
            if not getattr(self, field_name)
        ]
        if missing:
            names = ", ".join(sorted(missing))
            raise ValueError(f"Missing required deployment settings: {names}")

        return self

    def resolved_database_url(self) -> str:
        if self.app_env == "test":
            return self.test_database_url
        if self.database_url:
            return self.database_url
        raise ValueError("DATABASE_URL is required before using the database outside tests")


@lru_cache
def get_settings() -> Settings:
    return Settings()
