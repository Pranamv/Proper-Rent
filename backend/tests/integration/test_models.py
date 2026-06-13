from __future__ import annotations

import asyncio
from datetime import UTC, date, datetime
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.config import Settings
from app.database import create_engine
from app.models import Agent, Base, Conversation, Landlord, Property, Renter, Transaction
from app.models.transaction import Transaction as TransactionModel


def test_model_import_smoke() -> None:
    assert Agent.__tablename__ == "agents"
    assert Renter.__tablename__ == "renters"
    assert Conversation.__tablename__ == "conversations"
    assert Landlord.__tablename__ == "landlords"
    assert Property.__tablename__ == "properties"
    assert Transaction.__tablename__ == "transactions"


def test_property_timestamp_columns_are_timezone_aware() -> None:
    timestamp_columns = [
        Property.first_seen_at,
        Property.last_seen_at,
        Property.last_fetched_at,
        Property.missing_from_source_at,
        Property.inactive_at,
    ]

    for column in timestamp_columns:
        assert column.property.columns[0].type.timezone is True


def test_basic_create_and_read_for_active_phase_one_models() -> None:
    asyncio.run(run_basic_create_and_read())


async def run_basic_create_and_read() -> None:
    settings = Settings(app_env="test")
    engine = create_engine(settings)
    session_factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    try:
        async with session_factory() as session:
            now = datetime.now(UTC)
            agent = Agent(name="Proper Rent Admin", email="admin@example.com", role="admin")
            renter = Renter(
                source_channel="website",
                session_id="session-123",
                full_name="Test Renter",
                email="renter@example.com",
                phone="07123456789",
                bedrooms_required=2,
                areas_preferred=["Manchester", "Salford"],
                max_rent=Decimal("1200"),
                move_in_from=date(2026, 8, 1),
                move_in_by=date(2026, 9, 1),
                employment_status="employed_full",
                annual_income_range="25000-35000",
                has_guarantor="no",
                deposit_availability="partial",
                current_housing="renting",
                how_heard="facebook",
                furnished_preference="no_preference",
                pets="none",
                has_rented_before=True,
                intent_score=75,
                lead_status="new",
                assigned_agent=agent,
                fintech_flags={"deposit_share": True, "guarantor": False},
                consent_given=True,
                consent_version="2026-06-13",
                consent_at=now,
            )
            conversation = Conversation(
                renter=renter,
                session_id="session-123",
                channel="website",
                transcript=[{"role": "user", "content": "Hello", "ts": now.isoformat()}],
                ai_summary="Initial website conversation",
                intent_score_output=75,
            )
            landlord = Landlord(
                full_name="Test Landlord",
                email="landlord@example.com",
                phone="07987654321",
                property_address="1 Test Street",
                bedrooms=2,
                asking_rent=Decimal("1400"),
                available_from=date(2026, 8, 15),
                advanced_rent_interest=True,
                listing_interest=True,
                status="new",
                consent_given=True,
                consent_version="2026-06-13",
                consent_at=now,
            )

            session.add_all([agent, renter, conversation, landlord])
            await session.commit()

        async with session_factory() as session:
            stored_agent = await session.scalar(
                select(Agent).where(Agent.email == "admin@example.com")
            )
            stored_renter = await session.scalar(
                select(Renter).where(Renter.email == "renter@example.com")
            )
            stored_conversation = await session.scalar(
                select(Conversation).where(Conversation.session_id == "session-123")
            )
            stored_landlord = await session.scalar(
                select(Landlord).where(Landlord.email == "landlord@example.com")
            )
            properties_count = len((await session.scalars(select(Property))).all())
            transactions_count = len((await session.scalars(select(TransactionModel))).all())

        assert stored_agent is not None
        assert stored_agent.role == "admin"
        assert stored_renter is not None
        assert stored_renter.assigned_agent_id == stored_agent.id
        assert stored_renter.fintech_flags == {"deposit_share": True, "guarantor": False}
        assert stored_conversation is not None
        assert stored_conversation.renter_id == stored_renter.id
        assert stored_landlord is not None
        assert stored_landlord.advanced_rent_interest is True
        assert properties_count == 0
        assert transactions_count == 0
    finally:
        await engine.dispose()
