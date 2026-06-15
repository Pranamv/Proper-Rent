from datetime import UTC, datetime, timedelta
from types import SimpleNamespace

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import ec

from app.services.admin_auth import (
    AdminAuthConfigurationError,
    AdminTokenError,
    extract_admin_email,
    jwks_url,
    verify_supabase_access_token,
)

JWT_SECRET = "test-supabase-jwt-secret-at-least-32-bytes"


def test_verify_supabase_access_token_accepts_valid_supabase_token() -> None:
    token = build_token(email="ADMIN@EXAMPLE.COM")

    payload = verify_supabase_access_token(token, jwt_secret=JWT_SECRET)

    assert payload["sub"] == "user-123"
    assert payload["email"] == "ADMIN@EXAMPLE.COM"
    assert extract_admin_email(payload) == "admin@example.com"


def test_verify_supabase_access_token_accepts_asymmetric_supabase_token(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    private_key = ec.generate_private_key(ec.SECP256R1())
    token = build_token(
        email="admin@example.com",
        key=private_key,
        algorithm="ES256",
        issuer="https://project.supabase.co/auth/v1",
    )
    captured: dict[str, str] = {}

    def fake_get_jwks_signing_key(jwks_url_value: str, token_value: str) -> object:
        captured["jwks_url"] = jwks_url_value
        captured["token"] = token_value
        return SimpleNamespace(key=private_key.public_key())

    monkeypatch.setattr(
        "app.services.admin_auth.get_jwks_signing_key",
        fake_get_jwks_signing_key,
    )

    payload = verify_supabase_access_token(
        token,
        jwt_secret=None,
        supabase_url="https://project.supabase.co",
    )

    assert payload["sub"] == "user-123"
    assert payload["email"] == "admin@example.com"
    assert captured == {
        "jwks_url": "https://project.supabase.co/auth/v1/.well-known/jwks.json",
        "token": token,
    }


def test_verify_supabase_access_token_rejects_missing_secret() -> None:
    token = build_token(email="admin@example.com")

    with pytest.raises(AdminAuthConfigurationError):
        verify_supabase_access_token(token, jwt_secret=None)


def test_verify_supabase_access_token_rejects_asymmetric_token_without_url() -> None:
    private_key = ec.generate_private_key(ec.SECP256R1())
    token = build_token(
        email="admin@example.com",
        key=private_key,
        algorithm="ES256",
        issuer="https://project.supabase.co/auth/v1",
    )

    with pytest.raises(AdminAuthConfigurationError):
        verify_supabase_access_token(token, jwt_secret=JWT_SECRET)


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


def test_jwks_url_uses_project_auth_endpoint() -> None:
    assert (
        jwks_url("https://project.supabase.co/")
        == "https://project.supabase.co/auth/v1/.well-known/jwks.json"
    )


def build_token(
    *,
    email: str,
    audience: str = "authenticated",
    expires_at: datetime | None = None,
    key: object = JWT_SECRET,
    algorithm: str = "HS256",
    issuer: str | None = None,
) -> str:
    payload = {
        "aud": audience,
        "sub": "user-123",
        "email": email,
        "exp": expires_at or datetime.now(UTC) + timedelta(minutes=10),
    }
    if issuer is not None:
        payload["iss"] = issuer

    return jwt.encode(payload, key, algorithm=algorithm)
