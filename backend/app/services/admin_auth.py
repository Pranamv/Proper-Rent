from __future__ import annotations

from typing import Any

import jwt

SUPABASE_JWT_AUDIENCE = "authenticated"
SUPABASE_JWT_ALGORITHMS = ("HS256",)


class AdminAuthError(Exception):
    pass


class AdminAuthConfigurationError(AdminAuthError):
    pass


class AdminTokenError(AdminAuthError):
    pass


def verify_supabase_access_token(
    token: str,
    *,
    jwt_secret: str | None,
) -> dict[str, Any]:
    if not jwt_secret:
        raise AdminAuthConfigurationError("SUPABASE_JWT_SECRET is required")

    try:
        payload = jwt.decode(
            token,
            jwt_secret,
            algorithms=list(SUPABASE_JWT_ALGORITHMS),
            audience=SUPABASE_JWT_AUDIENCE,
            options={"require": ["exp", "sub"]},
        )
    except jwt.InvalidTokenError as exc:
        raise AdminTokenError("Invalid Supabase JWT") from exc

    if not isinstance(payload, dict):
        raise AdminTokenError("Invalid Supabase JWT payload")

    return payload


def extract_admin_email(payload: dict[str, Any]) -> str:
    email = payload.get("email")
    if not isinstance(email, str) or not email.strip():
        raise AdminTokenError("Supabase JWT does not include an email claim")
    return email.strip().lower()
