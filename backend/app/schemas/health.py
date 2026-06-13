from typing import Literal

from app.schemas.base import ApiSchema


class HealthResponse(ApiSchema):
    status: Literal["ok"]
    version: str
