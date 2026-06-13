from datetime import UTC, datetime, timedelta

import jwt
import pytest

from app.services.admin_auth import (
    AdminAuthConfigurationError,
    AdminTokenError,
    extract_admin_email,
    verify_supabase_access_token,
)

JWT_SECRET = "test-supabase-jwt-secret-at-least-32-bytes"


def test_verify_supabase_access_token_accepts_valid_supabase_token() -> None:
    token = build_token(email="ADMIN@EXAMPLE.COM")

    payload = verify_supabase_access_token(token, jwt_secret=JWT_SECRET)

    assert payload["sub"] == "user-123"
    assert payload["email"] == "ADMIN@EXAMPLE.COM"
    assert extract_admin_email(payload) == "admin@example.com"


def test_verify_supabase_access_token_rejects_missing_secret() -> None:
    token = build_token(email="admin@example.com")

    with pytest.raises(AdminAuthConfigurationError):
        verify_supabase_access_token(token, jwt_secret=None)


def test_verify_supabase_access_token_rejects_bad_audience() -> None:
    token = build_token(email="admin@example.com", audience="service_role")

    with pytest.raises(AdminTokenError):
        verify_supabase_access_token(token, jwt_secret=JWT_SECRET)


def test_verify_supabase_access_token_rejects_expired_token() -> None:
    token = build_token(
        email="admin@example.com",
        expires_at=datetime.now(UTC) - timedelta(minutes=1),
    )

    with pytest.raises(AdminTokenError):
        verify_supabase_access_token(token, jwt_secret=JWT_SECRET)


def test_extract_admin_email_rejects_missing_or_blank_email() -> None:
    with pytest.raises(AdminTokenError):
        extract_admin_email({"sub": "user-123"})

    with pytest.raises(AdminTokenError):
        extract_admin_email({"sub": "user-123", "email": " "})


def build_token(
    *,
    email: str,
    audience: str = "authenticated",
    expires_at: datetime | None = None,
) -> str:
    return jwt.encode(
        {
            "aud": audience,
            "sub": "user-123",
            "email": email,
            "exp": expires_at or datetime.now(UTC) + timedelta(minutes=10),
        },
        JWT_SECRET,
        algorithm="HS256",
    )
