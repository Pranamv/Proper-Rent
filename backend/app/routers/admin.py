from datetime import UTC, datetime
from typing import Annotated, cast
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db_session
from app.dependencies import AuthenticatedAdmin, require_admin
from app.models import Agent, Conversation, Landlord, Renter
from app.models.constants import RENTER_STATUSES
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
)
from app.schemas.base import LandlordStatus, RenterLeadStatus
from app.services.lead_scoring import HOT_LEAD_THRESHOLD

router = APIRouter(prefix="/admin", tags=["admin"])

AdminDependency = Annotated[AuthenticatedAdmin, Depends(require_admin)]
DbSession = Annotated[AsyncSession, Depends(get_db_session)]


@router.get(
    "/auth/check",
    response_model=AdminAuthCheckResponse,
    status_code=status.HTTP_200_OK,
)
async def check_admin_auth(admin: AdminDependency) -> AdminAuthCheckResponse:
    return AdminAuthCheckResponse(
        agent_id=admin.agent_id,
        email=admin.email,
        role=admin.role,
    )


@router.get(
    "/leads",
    response_model=AdminLeadListResponse,
    status_code=status.HTTP_200_OK,
)
async def list_admin_leads(
    _admin: AdminDependency,
    session: DbSession,
    lead_status: Annotated[RenterLeadStatus | None, Query(alias="status")] = None,
    assigned_agent_id: UUID | None = None,
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> AdminLeadListResponse:
    filtered_query = apply_lead_filters(
        select(Renter),
        lead_status=lead_status,
        assigned_agent_id=assigned_agent_id,
    )
    total_query = apply_lead_filters(
        select(func.count()).select_from(Renter),
        lead_status=lead_status,
        assigned_agent_id=assigned_agent_id,
    )

    total = int(await session.scalar(total_query) or 0)
    renters = (
        await session.scalars(
            filtered_query.order_by(Renter.intent_score.desc(), Renter.created_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
        )
    ).all()

    return AdminLeadListResponse(
        total=total,
        page=page,
        limit=limit,
        summary=await build_lead_summary(session),
        results=[AdminLeadListItem.model_validate(renter) for renter in renters],
    )


@router.get(
    "/leads/{renter_id}",
    response_model=AdminLeadDetail,
    status_code=status.HTTP_200_OK,
)
async def get_admin_lead(
    renter_id: UUID,
    _admin: AdminDependency,
    session: DbSession,
) -> AdminLeadDetail:
    renter = await get_renter_or_404(session, renter_id)
    return AdminLeadDetail.model_validate(renter)


@router.patch(
    "/leads/{renter_id}",
    response_model=AdminLeadDetail,
    status_code=status.HTTP_200_OK,
)
async def update_admin_lead(
    renter_id: UUID,
    payload: AdminLeadUpdateRequest,
    _admin: AdminDependency,
    session: DbSession,
) -> AdminLeadDetail:
    renter = await get_renter_or_404(session, renter_id)

    if payload.lead_status is not None:
        renter.lead_status = payload.lead_status

    if "assigned_agent_id" in payload.model_fields_set:
        if payload.assigned_agent_id is not None:
            await validate_agent_exists(session, payload.assigned_agent_id)
        renter.assigned_agent_id = payload.assigned_agent_id

    if "notes" in payload.model_fields_set:
        renter.notes = payload.notes

    renter.updated_at = datetime.now(UTC)
    await session.commit()
    await session.refresh(renter)

    return AdminLeadDetail.model_validate(renter)


@router.get(
    "/leads/{renter_id}/conversation",
    response_model=list[AdminConversation],
    status_code=status.HTTP_200_OK,
)
async def list_admin_lead_conversations(
    renter_id: UUID,
    _admin: AdminDependency,
    session: DbSession,
) -> list[AdminConversation]:
    await get_renter_or_404(session, renter_id)
    conversations = (
        await session.scalars(
            select(Conversation)
            .where(Conversation.renter_id == renter_id)
            .order_by(Conversation.started_at.asc(), Conversation.created_at.asc())
        )
    ).all()
    return [AdminConversation.model_validate(conversation) for conversation in conversations]


@router.get(
    "/landlords",
    response_model=AdminLandlordListResponse,
    status_code=status.HTTP_200_OK,
)
async def list_admin_landlords(
    _admin: AdminDependency,
    session: DbSession,
    landlord_status: Annotated[LandlordStatus | None, Query(alias="status")] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> AdminLandlordListResponse:
    filtered_query = apply_landlord_filters(
        select(Landlord),
        landlord_status=landlord_status,
    )
    total_query = apply_landlord_filters(
        select(func.count()).select_from(Landlord),
        landlord_status=landlord_status,
    )

    total = int(await session.scalar(total_query) or 0)
    landlords = (
        await session.scalars(
            filtered_query.order_by(Landlord.created_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
        )
    ).all()

    return AdminLandlordListResponse(
        total=total,
        page=page,
        limit=limit,
        results=[AdminLandlordListItem.model_validate(landlord) for landlord in landlords],
    )


@router.get(
    "/landlords/{landlord_id}",
    response_model=AdminLandlordDetail,
    status_code=status.HTTP_200_OK,
)
async def get_admin_landlord(
    landlord_id: UUID,
    _admin: AdminDependency,
    session: DbSession,
) -> AdminLandlordDetail:
    landlord = await get_landlord_or_404(session, landlord_id)
    return AdminLandlordDetail.model_validate(landlord)


@router.patch(
    "/landlords/{landlord_id}",
    response_model=AdminLandlordDetail,
    status_code=status.HTTP_200_OK,
)
async def update_admin_landlord(
    landlord_id: UUID,
    payload: AdminLandlordUpdateRequest,
    _admin: AdminDependency,
    session: DbSession,
) -> AdminLandlordDetail:
    landlord = await get_landlord_or_404(session, landlord_id)

    if payload.status is not None:
        landlord.status = payload.status

    if "notes" in payload.model_fields_set:
        landlord.notes = payload.notes

    landlord.updated_at = datetime.now(UTC)
    await session.commit()
    await session.refresh(landlord)

    return AdminLandlordDetail.model_validate(landlord)


def apply_lead_filters(
    query: Select[tuple[Renter]] | Select[tuple[int]],
    *,
    lead_status: RenterLeadStatus | None,
    assigned_agent_id: UUID | None,
) -> Select[tuple[Renter]] | Select[tuple[int]]:
    if lead_status is not None:
        query = query.where(Renter.lead_status == lead_status)
    if assigned_agent_id is not None:
        query = query.where(Renter.assigned_agent_id == assigned_agent_id)
    return query


def apply_landlord_filters(
    query: Select[tuple[Landlord]] | Select[tuple[int]],
    *,
    landlord_status: LandlordStatus | None,
) -> Select[tuple[Landlord]] | Select[tuple[int]]:
    if landlord_status is not None:
        query = query.where(Landlord.status == landlord_status)
    return query


async def build_lead_summary(session: AsyncSession) -> AdminLeadSummary:
    start_of_today = datetime.now(UTC).replace(hour=0, minute=0, second=0, microsecond=0)
    new_leads_today = int(
        await session.scalar(
            select(func.count()).select_from(Renter).where(Renter.created_at >= start_of_today)
        )
        or 0
    )
    hot_leads_pending = int(
        await session.scalar(
            select(func.count())
            .select_from(Renter)
            .where(
                Renter.intent_score >= HOT_LEAD_THRESHOLD,
                Renter.lead_status == "new",
            )
        )
        or 0
    )
    stage_counts = {
        status_name: 0 for status_name in cast(tuple[RenterLeadStatus, ...], RENTER_STATUSES)
    }
    rows = await session.execute(
        select(Renter.lead_status, func.count()).group_by(Renter.lead_status)
    )
    for status_name, count in rows:
        stage_counts[cast(RenterLeadStatus, status_name)] = int(count)

    return AdminLeadSummary(
        new_leads_today=new_leads_today,
        hot_leads_pending=hot_leads_pending,
        pipeline_by_stage=stage_counts,
    )


async def get_renter_or_404(session: AsyncSession, renter_id: UUID) -> Renter:
    renter = await session.get(Renter, renter_id)
    if renter is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found",
        )
    return renter


async def get_landlord_or_404(session: AsyncSession, landlord_id: UUID) -> Landlord:
    landlord = await session.get(Landlord, landlord_id)
    if landlord is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Landlord lead not found",
        )
    return landlord


async def validate_agent_exists(session: AsyncSession, agent_id: UUID) -> None:
    agent_exists = await session.scalar(
        select(func.count()).select_from(Agent).where(Agent.id == agent_id)
    )
    if not agent_exists:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="assigned_agent_id does not reference an agent",
        )
