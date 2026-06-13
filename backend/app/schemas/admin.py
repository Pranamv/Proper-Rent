from datetime import date, datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import Field

from app.schemas.base import (
    ApiSchema,
    ChatChannel,
    InternalRenterFields,
    JsonObject,
    LandlordStatus,
    PaginatedResponse,
    RenterFields,
    RenterLeadStatus,
    TimestampedSchema,
    Transcript,
)


class AdminAuthCheckResponse(ApiSchema):
    agent_id: UUID
    email: str
    role: Literal["admin"]


class AdminLeadSummary(ApiSchema):
    new_leads_today: int = Field(ge=0)
    hot_leads_pending: int = Field(ge=0)
    pipeline_by_stage: dict[RenterLeadStatus, int]


class AdminLeadListItem(RenterFields, InternalRenterFields, TimestampedSchema):
    id: UUID


class AdminLeadDetail(AdminLeadListItem):
    consent_given: bool
    consent_version: str
    consent_at: datetime


class AdminLeadListResponse(PaginatedResponse):
    summary: AdminLeadSummary
    results: list[AdminLeadListItem]


class AdminLeadUpdateRequest(ApiSchema):
    lead_status: RenterLeadStatus | None = None
    assigned_agent_id: UUID | None = None
    notes: str | None = None


class AdminConversation(TimestampedSchema):
    id: UUID
    renter_id: UUID | None = None
    session_id: str
    channel: ChatChannel
    external_id: str | None = None
    transcript: Transcript = Field(default_factory=list)
    ai_summary: str | None = None
    intent_score_output: int | None = None
    started_at: datetime
    ended_at: datetime | None = None


class AdminLandlordListItem(TimestampedSchema):
    id: UUID
    full_name: str | None = None
    email: str | None = None
    phone: str | None = None
    property_address: str | None = None
    bedrooms: int | None = None
    asking_rent: Decimal | None = None
    available_from: date | None = None
    advanced_rent_interest: bool | None = None
    listing_interest: bool | None = None
    status: LandlordStatus


class AdminLandlordDetail(AdminLandlordListItem):
    consent_given: bool
    consent_version: str
    consent_at: datetime
    notes: str | None = None


class AdminLandlordListResponse(PaginatedResponse):
    results: list[AdminLandlordListItem]


class AdminLandlordUpdateRequest(ApiSchema):
    status: LandlordStatus | None = None
    notes: str | None = None


class ErrorResponse(ApiSchema):
    detail: str | JsonObject
