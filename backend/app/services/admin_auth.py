from __future__ import annotations

from functools import lru_cache
from typing import Any

import jwt
from jwt import PyJWKClient

SUPABASE_JWT_AUDIENCE = "authenticated"
SUPABASE_LEGACY_JWT_ALGORITHMS = ("HS256",)
SUPABASE_JWKS_ALGORITHMS = ("ES256", "RS256")


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
    supabase_url: str | None = None,
) -> dict[str, Any]:
    try:
        header = jwt.get_unverified_header(token)
    except jwt.InvalidTokenError as exc:
        raise AdminTokenError("Invalid Supabase JWT header") from exc

    algorithm = header.get("alg")
    if algorithm in SUPABASE_JWKS_ALGORITHMS:
        return verify_supabase_jwks_token(token, supabase_url=supabase_url)

    if algorithm not in SUPABASE_LEGACY_JWT_ALGORITHMS:
        raise AdminTokenError("Unsupported Supabase JWT algorithm")

    if not jwt_secret:
        raise AdminAuthConfigurationError("SUPABASE_JWT_SECRET is required")

    return decode_supabase_jwt(
        token,
        key=jwt_secret,
        algorithms=SUPABASE_LEGACY_JWT_ALGORITHMS,
    )


def verify_supabase_jwks_token(
    token: str,
    *,
    supabase_url: str | None,
) -> dict[str, Any]:
    if not supabase_url:
        raise AdminAuthConfigurationError("SUPABASE_URL is required")

    try:
        signing_key = get_jwks_signing_key(jwks_url(supabase_url), token)
    except jwt.PyJWKClientError as exc:
        raise AdminTokenError("Supabase JWT signing key could not be resolved") from exc

    return decode_supabase_jwt(
        token,
        key=signing_key.key,
        algorithms=SUPABASE_JWKS_ALGORITHMS,
        issuer=f"{supabase_url.rstrip('/')}/auth/v1",
    )


def decode_supabase_jwt(
    token: str,
    *,
    key: Any,
    algorithms: tuple[str, ...],
    issuer: str | None = None,
) -> dict[str, Any]:
    try:
        if issuer is not None:
            payload = jwt.decode(
                token,
                key,
                algorithms=list(algorithms),
                audience=SUPABASE_JWT_AUDIENCE,
                issuer=issuer,
                options={"require": ["exp", "sub"]},
            )
        else:
            payload = jwt.decode(
                token,
                key,
                algorithms=list(algorithms),
                audience=SUPABASE_JWT_AUDIENCE,
                options={"require": ["exp", "sub"]},
            )
    except jwt.InvalidTokenError as exc:
        raise AdminTokenError("Invalid Supabase JWT") from exc

    if not isinstance(payload, dict):
        raise AdminTokenError("Invalid Supabase JWT payload")

    return payload


def jwks_url(supabase_url: str) -> str:
    return f"{supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"


def get_jwks_signing_key(jwks_url_value: str, token: str) -> Any:
    return get_jwks_client(jwks_url_value).get_signing_key_from_jwt(token)


@lru_cache
def get_jwks_client(jwks_url_value: str) -> PyJWKClient:
    return PyJWKClient(jwks_url_value, cache_keys=True)


def extract_admin_email(payload: dict[str, Any]) -> str:
    email = payload.get("email")
    if not isinstance(email, str) or not email.strip():
        raise AdminTokenError("Supabase JWT does not include an email claim")
    return email.strip().lower()
