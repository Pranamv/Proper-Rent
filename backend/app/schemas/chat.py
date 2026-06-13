from typing import Literal
from uuid import UUID

from pydantic import Field

from app.schemas.base import ApiSchema

SuggestedAction = Literal["show_intake_form"]


class ChatRequest(ApiSchema):
    session_id: str = Field(min_length=1, max_length=128)
    message: str = Field(min_length=1, max_length=1000)
    renter_id: UUID | None = None


class ChatResponse(ApiSchema):
    reply: str
    suggested_action: SuggestedAction | None = None
    session_id: str
