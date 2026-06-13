from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db_session
from app.dependencies import get_notification_service
from app.models import Landlord
from app.schemas.landlord import LandlordIntakeRequest, LandlordIntakeResponse
from app.services.notifications import NotificationService

router = APIRouter(tags=["landlords"])

DbSession = Annotated[AsyncSession, Depends(get_db_session)]
Notifications = Annotated[NotificationService, Depends(get_notification_service)]

LANDLORD_INTAKE_MESSAGE = (
    "Thank you. An agent will review your property details and be in touch shortly."
)


@router.post(
    "/landlords",
    response_model=LandlordIntakeResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_landlord_intake(
    payload: LandlordIntakeRequest,
    session: DbSession,
    notifications: Notifications,
    background_tasks: BackgroundTasks,
) -> LandlordIntakeResponse:
    normalized_email = normalize_email(str(payload.email))
    landlord = Landlord(
        full_name=payload.full_name,
        email=normalized_email,
        phone=payload.phone,
        property_address=payload.property_address,
        bedrooms=payload.bedrooms,
        asking_rent=payload.asking_rent,
        available_from=payload.available_from,
        advanced_rent_interest=payload.advanced_rent_interest,
        listing_interest=payload.listing_interest,
        status="new",
        consent_given=payload.consent_given,
        consent_version=payload.consent_version,
        consent_at=datetime.now(UTC),
        notes=payload.notes,
    )
    session.add(landlord)
    await session.flush()
    await session.commit()

    # Email delivery is best-effort and must not control form success.
    background_tasks.add_task(
        notifications.send_landlord_confirmation,
        landlord_id=landlord.id,
        landlord_email=normalized_email,
        consent_version=payload.consent_version,
    )
    background_tasks.add_task(
        notifications.send_landlord_agent_notification,
        landlord_id=landlord.id,
        consent_version=payload.consent_version,
    )

    return LandlordIntakeResponse(
        landlord_id=landlord.id,
        message=LANDLORD_INTAKE_MESSAGE,
    )


def normalize_email(email: str) -> str:
    return email.strip().lower()
