from datetime import UTC, datetime
from typing import Annotated, cast
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, Response, status
from sqlalchemy import func, or_, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db_session
from app.dependencies import get_notification_service
from app.models import Conversation, Renter
from app.schemas.renter import RenterLeadRequest, RenterLeadResponse
from app.services.lead_scoring import HOT_LEAD_THRESHOLD, LeadScoringInput, score_lead
from app.services.notifications import NotificationService

router = APIRouter(tags=["leads"])

DbSession = Annotated[AsyncSession, Depends(get_db_session)]
Notifications = Annotated[NotificationService, Depends(get_notification_service)]

NEW_LEAD_MESSAGE = "Thank you. Our team will be in touch within 24 hours."
DUPLICATE_LEAD_MESSAGE = "We already have your details. Our team will be in touch within 24 hours."


@router.post(
    "/leads",
    response_model=RenterLeadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_renter_lead(
    payload: RenterLeadRequest,
    response: Response,
    session: DbSession,
    notifications: Notifications,
    background_tasks: BackgroundTasks,
) -> RenterLeadResponse:
    normalized_email = normalize_email(str(payload.email))

    existing_renter = await find_renter_by_email(session, normalized_email)
    if existing_renter is not None:
        return await respond_with_existing_renter(
            session=session,
            response=response,
            session_id=payload.session_id,
            existing_renter=existing_renter,
        )

    scoring_result = score_lead(build_scoring_input(payload, normalized_email=normalized_email))
    renter = Renter(
        source_channel=payload.source_channel,
        session_id=payload.session_id,
        full_name=payload.full_name,
        email=normalized_email,
        phone=payload.phone,
        bedrooms_required=payload.bedrooms_required,
        areas_preferred=list(payload.areas_preferred),
        max_rent=payload.max_rent,
        move_in_from=payload.move_in_from,
        move_in_by=payload.move_in_by,
        employment_status=payload.employment_status,
        annual_income_range=payload.annual_income_range,
        has_guarantor=payload.has_guarantor,
        deposit_availability=payload.deposit_availability,
        current_housing=payload.current_housing,
        how_heard=payload.how_heard,
        furnished_preference=payload.furnished_preference,
        pets=payload.pets,
        accessibility_needs=payload.accessibility_needs,
        has_rented_before=payload.has_rented_before,
        notes=payload.notes,
        intent_score=scoring_result.intent_score,
        lead_status="new",
        fintech_flags=scoring_result.fintech_flags,
        consent_given=payload.consent_given,
        consent_version=payload.consent_version,
        consent_at=datetime.now(UTC),
    )
    session.add(renter)

    try:
        await session.flush()
    except IntegrityError:
        # A concurrent request inserted the same email between our lookup and
        # flush (uq_renters_email_lower). Fall back to the idempotent duplicate
        # response instead of surfacing a 500.
        await session.rollback()
        existing_renter = await find_renter_by_email(session, normalized_email)
        if existing_renter is None:
            raise
        return await respond_with_existing_renter(
            session=session,
            response=response,
            session_id=payload.session_id,
            existing_renter=existing_renter,
        )

    if payload.session_id:
        await link_session_conversations(
            session=session,
            session_id=payload.session_id,
            renter_id=renter.id,
        )

    await session.commit()

    # Email delivery is best-effort and must never block or fail the response.
    # The renter is already persisted; run notifications after the response is
    # sent so a slow/unavailable provider cannot stall the intake form.
    background_tasks.add_task(
        notifications.send_renter_confirmation,
        renter_id=renter.id,
        renter_email=normalized_email,
        consent_version=payload.consent_version,
    )
    if scoring_result.intent_score >= HOT_LEAD_THRESHOLD:
        background_tasks.add_task(
            notifications.send_hot_renter_alert,
            renter_id=renter.id,
            intent_score=scoring_result.intent_score,
            consent_version=payload.consent_version,
        )

    return RenterLeadResponse(renter_id=renter.id, message=NEW_LEAD_MESSAGE)


async def respond_with_existing_renter(
    *,
    session: AsyncSession,
    response: Response,
    session_id: str | None,
    existing_renter: Renter,
) -> RenterLeadResponse:
    if session_id:
        await link_session_conversations(
            session=session,
            session_id=session_id,
            renter_id=existing_renter.id,
        )
        await session.commit()

    response.status_code = status.HTTP_200_OK
    return RenterLeadResponse(renter_id=existing_renter.id, message=DUPLICATE_LEAD_MESSAGE)


async def find_renter_by_email(session: AsyncSession, normalized_email: str) -> Renter | None:
    return cast(
        Renter | None,
        await session.scalar(
            select(Renter).where(func.lower(Renter.email) == normalized_email).limit(1)
        ),
    )


async def link_session_conversations(
    *,
    session: AsyncSession,
    session_id: str,
    renter_id: UUID,
) -> None:
    await session.execute(
        update(Conversation)
        .where(
            Conversation.session_id == session_id,
            or_(Conversation.renter_id.is_(None), Conversation.renter_id == renter_id),
        )
        .values(renter_id=renter_id)
    )


def build_scoring_input(
    payload: RenterLeadRequest,
    *,
    normalized_email: str,
) -> LeadScoringInput:
    return LeadScoringInput(
        move_in_from=payload.move_in_from,
        move_in_by=payload.move_in_by,
        bedrooms_required=payload.bedrooms_required,
        areas_preferred=list(payload.areas_preferred),
        max_rent=payload.max_rent,
        employment_status=payload.employment_status,
        has_guarantor=payload.has_guarantor,
        deposit_availability=payload.deposit_availability,
        has_rented_before=payload.has_rented_before,
        full_name=payload.full_name,
        email=normalized_email,
        phone=payload.phone,
    )


def normalize_email(email: str) -> str:
    return email.strip().lower()
