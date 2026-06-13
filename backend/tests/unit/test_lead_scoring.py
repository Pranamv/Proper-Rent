from datetime import date, timedelta
from decimal import Decimal

from app.services.lead_scoring import (
    HOT_LEAD_THRESHOLD,
    LeadScoringInput,
    baseline_for_area,
    build_fintech_flags,
    priority_for_score,
    score_budget_realism,
    score_contact_details,
    score_employment,
    score_guarantor,
    score_lead,
    score_move_in_window,
    score_property_interest,
    score_rental_history,
)

TODAY = date(2026, 6, 13)


def test_move_in_window_scoring_branches() -> None:
    assert (
        score_move_in_window(LeadScoringInput(move_in_by=TODAY + timedelta(days=28)), today=TODAY)
        == 30
    )
    assert (
        score_move_in_window(LeadScoringInput(move_in_by=TODAY + timedelta(days=56)), today=TODAY)
        == 15
    )
    assert (
        score_move_in_window(LeadScoringInput(move_in_by=TODAY + timedelta(days=84)), today=TODAY)
        == 5
    )
    assert (
        score_move_in_window(LeadScoringInput(move_in_by=TODAY + timedelta(days=85)), today=TODAY)
        == 0
    )
    assert score_move_in_window(LeadScoringInput(), today=TODAY) == 0


def test_budget_realism_scores_known_affordable_area() -> None:
    lead = LeadScoringInput(
        bedrooms_required=2,
        areas_preferred=["Manchester"],
        max_rent=Decimal("1200"),
    )

    assert score_budget_realism(lead) == 20


def test_budget_realism_rejects_known_below_baseline_budget() -> None:
    lead = LeadScoringInput(
        bedrooms_required=2,
        areas_preferred=["Manchester City Centre"],
        max_rent=Decimal("1000"),
    )

    assert score_budget_realism(lead) == 0


def test_budget_realism_scores_positive_budget_when_area_baseline_is_unknown() -> None:
    lead = LeadScoringInput(
        bedrooms_required=2,
        areas_preferred=["Unknown Area"],
        max_rent=Decimal("900"),
    )

    assert score_budget_realism(lead) == 20


def test_budget_realism_scores_zero_when_budget_or_bedrooms_missing() -> None:
    assert score_budget_realism(LeadScoringInput(bedrooms_required=2, max_rent=None)) == 0
    assert score_budget_realism(LeadScoringInput(bedrooms_required=2, max_rent=0)) == 0
    assert score_budget_realism(LeadScoringInput(bedrooms_required=None, max_rent=1200)) == 0


def test_area_baseline_extrapolates_above_largest_known_bedroom_count() -> None:
    assert baseline_for_area("Manchester", 5) == Decimal("2200")


def test_employment_scoring_branches() -> None:
    assert score_employment("employed_full") == 15
    assert score_employment("employed_part") == 15
    assert score_employment("self_employed") == 10
    assert score_employment("student") == 10
    assert score_employment("universal_credit") == 10
    assert score_employment("other") == 0
    assert score_employment(None) == 0


def test_guarantor_scoring_branches() -> None:
    assert score_guarantor("yes") == 10
    assert score_guarantor("no") == 5
    assert score_guarantor("unsure") == 0
    assert score_guarantor(None) == 0


def test_property_interest_scoring_branches() -> None:
    assert score_property_interest(True) == 10
    assert score_property_interest(False) == 0


def test_rental_history_scoring_branches() -> None:
    assert score_rental_history(True) == 5
    assert score_rental_history(False) == 0
    assert score_rental_history(None) == 0


def test_contact_details_scoring_branches() -> None:
    assert (
        score_contact_details(LeadScoringInput(full_name="A", email="a@example.com", phone="1"))
        == 5
    )
    assert score_contact_details(LeadScoringInput(full_name="A", email="", phone="1")) == 0


def test_fintech_flags_for_no_guarantor_student_self_employed_and_universal_credit() -> None:
    assert build_fintech_flags(LeadScoringInput(has_guarantor="no")) == {
        "deposit_share": True,
        "guarantor": False,
    }
    assert build_fintech_flags(LeadScoringInput(employment_status="student")) == {
        "deposit_share": False,
        "guarantor": True,
    }
    assert build_fintech_flags(LeadScoringInput(employment_status="self_employed")) == {
        "deposit_share": False,
        "guarantor": True,
    }
    assert build_fintech_flags(LeadScoringInput(employment_status="universal_credit")) == {
        "deposit_share": False,
        "guarantor": True,
    }
    assert build_fintech_flags(LeadScoringInput(deposit_availability="partial")) == {
        "deposit_share": True,
        "guarantor": False,
    }


def test_priority_boundaries() -> None:
    assert priority_for_score(HOT_LEAD_THRESHOLD - 1) == "warm"
    assert priority_for_score(HOT_LEAD_THRESHOLD) == "hot"
    assert priority_for_score(45) == "warm"
    assert priority_for_score(44) == "standard"
    assert priority_for_score(25) == "standard"
    assert priority_for_score(24) == "low"


def test_score_lead_returns_breakdown_flags_priority_and_never_filters_website_lead() -> None:
    lead = LeadScoringInput(
        move_in_by=TODAY + timedelta(days=21),
        bedrooms_required=2,
        areas_preferred=["Manchester"],
        max_rent=Decimal("1300"),
        employment_status="employed_full",
        has_guarantor="yes",
        deposit_availability="full",
        has_rented_before=True,
        full_name="Test Renter",
        email="renter@example.com",
        phone="07123456789",
    )

    result = score_lead(lead, today=TODAY)

    assert result.intent_score == 85
    assert result.priority == "hot"
    assert result.route_to_agent is True
    assert result.fintech_flags == {"deposit_share": False, "guarantor": False}
    assert result.breakdown == {
        "move_in": 30,
        "budget": 20,
        "employment": 15,
        "guarantor": 10,
        "property_interest": 0,
        "rental_history": 5,
        "contact_details": 5,
    }
