from datetime import UTC, datetime
from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.schemas import ErrorResponse
from app.schemas.admin import AdminAuthCheckResponse, AdminLeadListItem
from app.schemas.chat import ChatHistoryResponse, ChatRequest, ChatResponse
from app.schemas.landlord import LandlordIntakeRequest, LandlordIntakeResponse
from app.schemas.renter import RenterLeadRequest, RenterLeadResponse

INTERNAL_PUBLIC_FIELDS = {
    "intent_score",
    "fintech_flags",
    "assigned_agent_id",
    "scraye_introduction_id",
    "property_id",
    "properties",
    "system_prompt",
    "raw_llm_response",
}


def test_schema_import_smoke() -> None:
    assert ChatRequest.model_fields
    assert RenterLeadRequest.model_fields
    assert LandlordIntakeRequest.model_fields
    assert AdminLeadListItem.model_fields


def test_chat_response_only_exposes_public_fields() -> None:
    assert set(ChatResponse.model_fields) == {"reply", "suggested_action", "session_id"}
    assert INTERNAL_PUBLIC_FIELDS.isdisjoint(ChatResponse.model_fields)


def test_chat_history_response_only_exposes_public_fields() -> None:
    assert set(ChatHistoryResponse.model_fields) == {"session_id", "messages"}
    assert INTERNAL_PUBLIC_FIELDS.isdisjoint(ChatHistoryResponse.model_fields)


def test_renter_public_response_only_exposes_id_and_message() -> None:
    assert set(RenterLeadResponse.model_fields) == {"renter_id", "message"}
    assert INTERNAL_PUBLIC_FIELDS.isdisjoint(RenterLeadResponse.model_fields)


def test_landlord_public_response_only_exposes_id_and_message() -> None:
    assert set(LandlordIntakeResponse.model_fields) == {"landlord_id", "message"}
    assert INTERNAL_PUBLIC_FIELDS.isdisjoint(LandlordIntakeResponse.model_fields)


def test_public_response_serialization_excludes_internal_fields() -> None:
    responses = [
        ChatResponse(reply="Hello", suggested_action=None, session_id="session-123"),
        ChatHistoryResponse(session_id="session-123", messages=[]),
        RenterLeadResponse(renter_id=uuid4(), message="Thanks"),
        LandlordIntakeResponse(landlord_id=uuid4(), message="Thanks"),
    ]

    for response in responses:
        assert INTERNAL_PUBLIC_FIELDS.isdisjoint(response.model_dump())


def test_error_response_is_exported_from_schemas_package() -> None:
    assert ErrorResponse(detail="not found").model_dump() == {"detail": "not found"}


def test_public_request_schemas_enforce_consent_true() -> None:
    renter_payload = valid_renter_payload()
    renter_payload["consent_given"] = False

    with pytest.raises(ValidationError):
        RenterLeadRequest.model_validate(renter_payload)

    landlord_payload = valid_landlord_payload()
    landlord_payload["consent_given"] = False

    with pytest.raises(ValidationError):
        LandlordIntakeRequest.model_validate(landlord_payload)


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("areas_preferred", ["x" * 101]),
        ("areas_preferred", [f"Area {index}" for index in range(13)]),
        ("accessibility_needs", "x" * 1001),
        ("notes", "x" * 2001),
    ],
)
def test_renter_request_rejects_oversized_public_text_fields(
    field: str,
    value: object,
) -> None:
    payload = valid_renter_payload()
    payload[field] = value

    with pytest.raises(ValidationError):
        RenterLeadRequest.model_validate(payload)


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("property_address", "x" * 501),
        ("notes", "x" * 2001),
    ],
)
def test_landlord_request_rejects_oversized_public_text_fields(
    field: str,
    value: object,
) -> None:
    payload = valid_landlord_payload()
    payload[field] = value

    with pytest.raises(ValidationError):
        LandlordIntakeRequest.model_validate(payload)


def test_admin_lead_schema_can_expose_internal_fields() -> None:
    now = datetime.now(UTC)
    payload = {
        "id": uuid4(),
        "source_channel": "website",
        "full_name": "Test Renter",
        "email": "renter@example.com",
        "phone": "07123456789",
        "areas_preferred": ["Manchester"],
        "max_rent": 1200,
        "move_in_by": "2026-09-01",
        "intent_score": 75,
        "lead_status": "new",
        "assigned_agent_id": uuid4(),
        "fintech_flags": {"deposit_share": True, "guarantor": False},
        "created_at": now,
    }

    schema = AdminLeadListItem.model_validate(payload)

    assert schema.intent_score == 75
    assert schema.fintech_flags == {"deposit_share": True, "guarantor": False}
    assert schema.assigned_agent_id == payload["assigned_agent_id"]


def test_admin_auth_check_schema_exposes_admin_identity() -> None:
    agent_id = uuid4()

    schema = AdminAuthCheckResponse(
        agent_id=agent_id,
        email="admin@example.com",
        role="admin",
    )

    assert schema.model_dump() == {
        "agent_id": agent_id,
        "email": "admin@example.com",
        "role": "admin",
    }


def test_chat_request_rejects_overlong_message() -> None:
    with pytest.raises(ValidationError):
        ChatRequest.model_validate({"session_id": "session", "message": "x" * 1001})


def valid_renter_payload() -> dict[str, object]:
    return {
        "source_channel": "website",
        "session_id": "session-123",
        "full_name": "Test Renter",
        "email": "renter@example.com",
        "phone": "07123456789",
        "bedrooms_required": 2,
        "areas_preferred": ["Manchester"],
        "max_rent": 1200,
        "move_in_from": "2026-08-01",
        "move_in_by": "2026-09-01",
        "employment_status": "employed_full",
        "annual_income_range": "25000-35000",
        "has_guarantor": "no",
        "deposit_availability": "partial",
        "current_housing": "renting",
        "how_heard": "facebook",
        "furnished_preference": "no_preference",
        "pets": "none",
        "has_rented_before": True,
        "consent_given": True,
        "consent_version": "2026-06-13",
    }


def valid_landlord_payload() -> dict[str, object]:
    return {
        "full_name": "Test Landlord",
        "email": "landlord@example.com",
        "phone": "07987654321",
        "property_address": "1 Test Street",
        "bedrooms": 2,
        "asking_rent": 1400,
        "available_from": "2026-08-01",
        "advanced_rent_interest": True,
        "listing_interest": True,
        "consent_given": True,
        "consent_version": "2026-06-13",
    }
