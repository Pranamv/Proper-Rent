from typing import Annotated, cast

from fastapi import Depends, Request

from app.config import Settings
from app.database import get_db_session
from app.services.notifications import NotificationService


def get_app_settings(request: Request) -> Settings:
    return cast(Settings, request.app.state.settings)


SettingsDependency = Annotated[Settings, Depends(get_app_settings)]


def get_notification_service(settings: SettingsDependency) -> NotificationService:
    return NotificationService(settings=settings)


__all__ = ["get_app_settings", "get_db_session", "get_notification_service"]
