from datetime import date, datetime
from decimal import Decimal
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

type JsonObject = dict[str, Any]
type Transcript = list[dict[str, Any]]

SourceChannel = Literal["website", "whatsapp", "facebook", "referral"]
ChatChannel = Literal["website", "whatsapp", "facebook"]
RenterLeadStatus = Literal[
    "new",
    "contacted",
    "qualified",
    "viewing_arranged",
    "offer_made",
    "let_agreed",
    "completed",
    "lost",
]
LandlordStatus = Literal["new", "contacted", "listed", "inactive"]
EmploymentStatus = Literal[
    "employed_full",
    "employed_part",
    "self_employed",
    "student",
    "universal_credit",
    "other",
]
HasGuarantor = Literal["yes", "no", "unsure"]
DepositAvailability = Literal["full", "partial", "limited"]
CurrentHousing = Literal["renting", "family", "owning"]
FurnishedPreference = Literal["furnished", "unfurnished", "no_preference"]


class ApiSchema(BaseModel):
    model_config = ConfigDict(extra="forbid", from_attributes=True)


class PaginatedResponse(ApiSchema):
    total: int = Field(ge=0)
    page: int = Field(ge=1)
    limit: int = Field(ge=1, le=100)


class TimestampedSchema(ApiSchema):
    created_at: datetime
    updated_at: datetime | None = None


class RenterFields(ApiSchema):
    source_channel: SourceChannel
    session_id: str | None = None
    full_name: str | None = None
    email: str | None = None
    phone: str | None = None
    bedrooms_required: int | None = Field(default=None, ge=0)
    areas_preferred: list[str] | None = None
    max_rent: Decimal | None = Field(default=None, ge=0)
    move_in_from: date | None = None
    move_in_by: date | None = None
    employment_status: EmploymentStatus | None = None
    annual_income_range: str | None = None
    has_guarantor: HasGuarantor | None = None
    deposit_availability: DepositAvailability | None = None
    current_housing: CurrentHousing | None = None
    how_heard: str | None = None
    furnished_preference: FurnishedPreference | None = None
    pets: str | None = None
    accessibility_needs: str | None = None
    has_rented_before: bool | None = None
    notes: str | None = None


class InternalRenterFields(ApiSchema):
    intent_score: int = Field(ge=0)
    lead_status: RenterLeadStatus
    assigned_agent_id: UUID | None = None
    scraye_introduction_id: str | None = None
    fintech_flags: JsonObject = Field(default_factory=dict)
