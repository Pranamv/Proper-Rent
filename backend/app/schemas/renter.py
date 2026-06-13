from datetime import date
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import EmailStr, Field

from app.schemas.base import (
    ApiSchema,
    CurrentHousing,
    DepositAvailability,
    EmploymentStatus,
    FurnishedPreference,
    HasGuarantor,
    SourceChannel,
)


class RenterLeadRequest(ApiSchema):
    source_channel: SourceChannel = "website"
    session_id: str | None = Field(default=None, max_length=128)
    full_name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    phone: str = Field(min_length=1, max_length=50)
    bedrooms_required: int = Field(ge=0, le=20)
    areas_preferred: list[str] = Field(min_length=1)
    max_rent: Decimal = Field(gt=0)
    move_in_from: date | None = None
    move_in_by: date | None = None
    employment_status: EmploymentStatus
    annual_income_range: str | None = Field(default=None, max_length=100)
    has_guarantor: HasGuarantor
    deposit_availability: DepositAvailability
    current_housing: CurrentHousing
    how_heard: str | None = Field(default=None, max_length=100)
    furnished_preference: FurnishedPreference = "no_preference"
    pets: str | None = Field(default=None, max_length=100)
    accessibility_needs: str | None = None
    has_rented_before: bool | None = None
    notes: str | None = None
    consent_given: Literal[True]
    consent_version: str = Field(min_length=1, max_length=40)


class RenterLeadResponse(ApiSchema):
    renter_id: UUID
    message: str
