from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal, InvalidOperation
from typing import Literal

LeadPriority = Literal["hot", "warm", "standard", "low"]

HOT_LEAD_THRESHOLD = 70
WARM_LEAD_THRESHOLD = 45
STANDARD_LEAD_THRESHOLD = 25

GUARANTOR_EMPLOYMENT_STATUSES = {"self_employed", "student", "universal_credit"}
EMPLOYED_STATUSES = {"employed_full", "employed_part"}
DEPOSIT_SHARE_DEPOSIT_STATUSES = {"partial", "limited"}

KNOWN_AREA_RENT_BASELINES: dict[str, dict[int, Decimal]] = {
    "manchester": {
        0: Decimal("850"),
        1: Decimal("950"),
        2: Decimal("1200"),
        3: Decimal("1500"),
    },
    "manchester city centre": {
        0: Decimal("950"),
        1: Decimal("1100"),
        2: Decimal("1400"),
        3: Decimal("1800"),
    },
    "salford": {
        0: Decimal("750"),
        1: Decimal("850"),
        2: Decimal("1100"),
        3: Decimal("1400"),
    },
}


@dataclass(frozen=True)
class LeadScoringInput:
    move_in_from: date | None = None
    move_in_by: date | None = None
    bedrooms_required: int | None = None
    areas_preferred: list[str] = field(default_factory=list)
    max_rent: Decimal | int | str | None = None
    employment_status: str | None = None
    has_guarantor: str | None = None
    deposit_availability: str | None = None
    has_rented_before: bool | None = None
    full_name: str | None = None
    email: str | None = None
    phone: str | None = None
    specific_property_interest: bool = False


@dataclass(frozen=True)
class LeadScoringResult:
    intent_score: int
    priority: LeadPriority
    fintech_flags: dict[str, bool]
    breakdown: dict[str, int]
    route_to_agent: bool = True


def score_lead(lead: LeadScoringInput, *, today: date | None = None) -> LeadScoringResult:
    scoring_date = today or date.today()
    breakdown = {
        "move_in": score_move_in_window(lead, today=scoring_date),
        "budget": score_budget_realism(lead),
        "employment": score_employment(lead.employment_status),
        "guarantor": score_guarantor(lead.has_guarantor),
        "property_interest": score_property_interest(lead.specific_property_interest),
        "rental_history": score_rental_history(lead.has_rented_before),
        "contact_details": score_contact_details(lead),
    }
    intent_score = sum(breakdown.values())

    return LeadScoringResult(
        intent_score=intent_score,
        priority=priority_for_score(intent_score),
        fintech_flags=build_fintech_flags(lead),
        breakdown=breakdown,
        route_to_agent=True,
    )


def priority_for_score(score: int) -> LeadPriority:
    if score >= HOT_LEAD_THRESHOLD:
        return "hot"
    if score >= WARM_LEAD_THRESHOLD:
        return "warm"
    if score >= STANDARD_LEAD_THRESHOLD:
        return "standard"
    return "low"


def score_move_in_window(lead: LeadScoringInput, *, today: date) -> int:
    target_date = lead.move_in_by or lead.move_in_from
    if target_date is None:
        return 0

    days_until_move = (target_date - today).days
    if days_until_move <= 28:
        return 30
    if days_until_move <= 56:
        return 15
    if days_until_move <= 84:
        return 5
    return 0


def score_budget_realism(lead: LeadScoringInput) -> int:
    max_rent = parse_decimal(lead.max_rent)
    if max_rent is None or max_rent <= 0 or lead.bedrooms_required is None:
        return 0

    known_baselines: list[Decimal] = []
    for area in lead.areas_preferred:
        baseline = baseline_for_area(area, lead.bedrooms_required)
        if baseline is not None:
            known_baselines.append(baseline)

    if not known_baselines:
        return 20

    return 20 if any(max_rent >= baseline for baseline in known_baselines) else 0


def score_employment(employment_status: str | None) -> int:
    normalized = normalize_text(employment_status)
    if normalized in EMPLOYED_STATUSES:
        return 15
    if normalized in GUARANTOR_EMPLOYMENT_STATUSES:
        return 10
    return 0


def score_guarantor(has_guarantor: str | None) -> int:
    normalized = normalize_text(has_guarantor)
    if normalized == "yes":
        return 10
    if normalized == "no":
        return 5
    return 0


def score_property_interest(specific_property_interest: bool) -> int:
    return 10 if specific_property_interest else 0


def score_rental_history(has_rented_before: bool | None) -> int:
    return 5 if has_rented_before is True else 0


def score_contact_details(lead: LeadScoringInput) -> int:
    if all(has_text(value) for value in (lead.full_name, lead.email, lead.phone)):
        return 5
    return 0


def build_fintech_flags(lead: LeadScoringInput) -> dict[str, bool]:
    employment_status = normalize_text(lead.employment_status)
    has_guarantor = normalize_text(lead.has_guarantor)
    deposit_availability = normalize_text(lead.deposit_availability)

    return {
        "deposit_share": (
            has_guarantor == "no" or deposit_availability in DEPOSIT_SHARE_DEPOSIT_STATUSES
        ),
        "guarantor": employment_status in GUARANTOR_EMPLOYMENT_STATUSES,
    }


def baseline_for_area(area: str, bedrooms_required: int) -> Decimal | None:
    area_baselines = KNOWN_AREA_RENT_BASELINES.get(normalize_area(area))
    if not area_baselines:
        return None

    normalized_bedrooms = max(0, bedrooms_required)
    if normalized_bedrooms in area_baselines:
        return area_baselines[normalized_bedrooms]

    largest_known_bedroom_count = max(area_baselines)
    largest_known_baseline = area_baselines[largest_known_bedroom_count]
    extra_bedrooms = normalized_bedrooms - largest_known_bedroom_count
    if extra_bedrooms <= 0:
        return largest_known_baseline
    return largest_known_baseline + (Decimal("350") * extra_bedrooms)


def parse_decimal(value: Decimal | int | str | None) -> Decimal | None:
    if value is None:
        return None
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError):
        return None


def normalize_area(value: str) -> str:
    return " ".join(value.strip().lower().split())


def normalize_text(value: str | None) -> str | None:
    if value is None:
        return None
    return value.strip().lower()


def has_text(value: str | None) -> bool:
    return bool(value and value.strip())
