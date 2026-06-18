from __future__ import annotations

from app.config import Settings
from app.main import create_app

EXPECTED_PHASE_1_PATHS = {
    "/api/v1/admin/auth/check",
    "/api/v1/admin/landlords",
    "/api/v1/admin/landlords/{landlord_id}",
    "/api/v1/admin/leads",
    "/api/v1/admin/leads/{renter_id}",
    "/api/v1/admin/leads/{renter_id}/conversation",
    "/api/v1/chat",
    "/api/v1/chat/history",
    "/api/v1/health",
    "/api/v1/landlords",
    "/api/v1/leads",
}

INTERNAL_PUBLIC_FIELDS = {
    "assigned_agent_id",
    "conversation_id",
    "fintech_flags",
    "intent_score",
    "properties",
    "property_id",
    "raw_llm_response",
    "scraye_introduction_id",
    "system_prompt",
}


def test_openapi_exposes_only_phase_1_routes() -> None:
    contract = create_app(Settings(app_env="test")).openapi()

    assert set(contract["paths"]) == EXPECTED_PHASE_1_PATHS
    assert not any("/properties" in path for path in contract["paths"])
    assert not any("/transactions" in path for path in contract["paths"])


def test_openapi_public_responses_do_not_expose_internal_fields() -> None:
    schemas = create_app(Settings(app_env="test")).openapi()["components"]["schemas"]

    public_response_schemas = {
        "ChatHistoryMessage",
        "ChatHistoryResponse",
        "ChatResponse",
        "LandlordIntakeResponse",
        "RenterLeadResponse",
    }

    for schema_name in public_response_schemas:
        assert INTERNAL_PUBLIC_FIELDS.isdisjoint(schemas[schema_name]["properties"])


def test_openapi_chat_suggested_action_contract_is_phase_1_only() -> None:
    schema = create_app(Settings(app_env="test")).openapi()["components"]["schemas"]["ChatResponse"]
    suggested_action = schema["properties"]["suggested_action"]["anyOf"]

    assert {"const": "show_intake_form", "type": "string"} in suggested_action
    assert {"type": "null"} in suggested_action
