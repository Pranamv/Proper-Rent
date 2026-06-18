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


class ChatHistoryMessage(ApiSchema):
    role: Literal["assistant", "user"]
    content: str
    suggested_action: SuggestedAction | None = None
    ts: str | None = None


class ChatHistoryResponse(ApiSchema):
    session_id: str
    messages: list[ChatHistoryMessage]
