from typing import Annotated

from fastapi import APIRouter, Depends

from app.config import Settings
from app.dependencies import get_app_settings
from app.schemas.health import HealthResponse

router = APIRouter(tags=["health"])
SettingsDependency = Annotated[Settings, Depends(get_app_settings)]


@router.get("/health", response_model=HealthResponse)
async def health(settings: SettingsDependency) -> HealthResponse:
    return HealthResponse(status="ok", version=settings.app_version)
