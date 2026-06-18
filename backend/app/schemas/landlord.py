from datetime import date
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import EmailStr, Field

from app.schemas.base import ApiSchema


class LandlordIntakeRequest(ApiSchema):
    full_name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    phone: str = Field(min_length=1, max_length=50)
    property_address: str = Field(min_length=1, max_length=500)
    bedrooms: int = Field(ge=0, le=50)
    asking_rent: Decimal = Field(gt=0)
    available_from: date | None = None
    advanced_rent_interest: bool = False
    listing_interest: bool = False
    notes: str | None = Field(default=None, max_length=2000)
    consent_given: Literal[True]
    consent_version: str = Field(min_length=1, max_length=40)


class LandlordIntakeResponse(ApiSchema):
    landlord_id: UUID
    message: str
