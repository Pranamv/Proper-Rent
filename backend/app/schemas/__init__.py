"""Pydantic API contracts for public and admin routes."""

from app.schemas.admin import (
    AdminAuthCheckResponse,
    AdminConversation,
    AdminLandlordDetail,
    AdminLandlordListItem,
    AdminLandlordListResponse,
    AdminLandlordUpdateRequest,
    AdminLeadDetail,
    AdminLeadListItem,
    AdminLeadListResponse,
    AdminLeadSummary,
    AdminLeadUpdateRequest,
    ErrorResponse,
)
from app.schemas.chat import ChatRequest, ChatResponse, SuggestedAction
from app.schemas.health import HealthResponse
from app.schemas.landlord import LandlordIntakeRequest, LandlordIntakeResponse
from app.schemas.renter import RenterLeadRequest, RenterLeadResponse

__all__ = [
    "AdminAuthCheckResponse",
    "AdminConversation",
    "AdminLandlordDetail",
    "AdminLandlordListItem",
    "AdminLandlordListResponse",
    "AdminLandlordUpdateRequest",
    "AdminLeadDetail",
    "AdminLeadListItem",
    "AdminLeadListResponse",
    "AdminLeadSummary",
    "AdminLeadUpdateRequest",
    "ChatRequest",
    "ChatResponse",
    "ErrorResponse",
    "HealthResponse",
    "LandlordIntakeRequest",
    "LandlordIntakeResponse",
    "RenterLeadRequest",
    "RenterLeadResponse",
    "SuggestedAction",
]
