from typing import cast

from fastapi import Request

from app.config import Settings
from app.database import get_db_session


def get_app_settings(request: Request) -> Settings:
    return cast(Settings, request.app.state.settings)


__all__ = ["get_app_settings", "get_db_session"]
