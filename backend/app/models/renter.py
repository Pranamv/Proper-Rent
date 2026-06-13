from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    Text,
    column,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, CreatedAtMixin, UpdatedAtMixin, UuidPrimaryKeyMixin
from app.models.constants import RENTER_SOURCES, RENTER_STATUSES, allowed_values_check
from app.models.types import JsonObject, json_column_type, text_array_column_type

if TYPE_CHECKING:
    from app.models.agent import Agent
    from app.models.conversation import Conversation
    from app.models.transaction import Transaction


class Renter(UuidPrimaryKeyMixin, CreatedAtMixin, UpdatedAtMixin, Base):
    __tablename__ = "renters"
    __table_args__ = (
        CheckConstraint(
            allowed_values_check("source_channel", RENTER_SOURCES),
            name="ck_renters_source_channel",
        ),
        CheckConstraint(
            allowed_values_check("lead_status", RENTER_STATUSES),
            name="ck_renters_lead_status",
        ),
        Index("ix_renters_email", "email"),
        Index("ix_renters_session_id", "session_id"),
        Index("ix_renters_lead_status", "lead_status"),
        Index("ix_renters_assigned_agent_id", "assigned_agent_id"),
        Index("ix_renters_created_at", "created_at"),
        # Case-insensitive uniqueness for the idempotent duplicate-email contract.
        # Partial so the many NULL-email rows (e.g. social-channel leads) are exempt.
        # Emails are stored normalized, so lower() is index-backed for lookups too.
        Index(
            "uq_renters_email_lower",
            func.lower(column("email")),
            unique=True,
            postgresql_where=text("email IS NOT NULL"),
            sqlite_where=text("email IS NOT NULL"),
        ),
    )

    source_channel: Mapped[str] = mapped_column(Text, nullable=False)
    session_id: Mapped[str | None] = mapped_column(Text)
    full_name: Mapped[str | None] = mapped_column(Text)
    email: Mapped[str | None] = mapped_column(Text)
    phone: Mapped[str | None] = mapped_column(Text)
    bedrooms_required: Mapped[int | None] = mapped_column(Integer)
    areas_preferred: Mapped[list[str] | None] = mapped_column(text_array_column_type())
    max_rent: Mapped[Decimal | None] = mapped_column(Numeric)
    move_in_from: Mapped[date | None] = mapped_column(Date)
    move_in_by: Mapped[date | None] = mapped_column(Date)
    employment_status: Mapped[str | None] = mapped_column(Text)
    annual_income_range: Mapped[str | None] = mapped_column(Text)
    has_guarantor: Mapped[str | None] = mapped_column(Text)
    deposit_availability: Mapped[str | None] = mapped_column(Text)
    current_housing: Mapped[str | None] = mapped_column(Text)
    how_heard: Mapped[str | None] = mapped_column(Text)
    furnished_preference: Mapped[str | None] = mapped_column(Text)
    pets: Mapped[str | None] = mapped_column(Text)
    accessibility_needs: Mapped[str | None] = mapped_column(Text)
    has_rented_before: Mapped[bool | None] = mapped_column(Boolean)
    notes: Mapped[str | None] = mapped_column(Text)

    intent_score: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    lead_status: Mapped[str] = mapped_column(Text, nullable=False, server_default="new")
    assigned_agent_id: Mapped[UUID | None] = mapped_column(ForeignKey("agents.id"))
    scraye_introduction_id: Mapped[str | None] = mapped_column(Text)
    fintech_flags: Mapped[JsonObject] = mapped_column(
        json_column_type(),
        nullable=False,
        default=dict,
        server_default="{}",
    )

    consent_given: Mapped[bool] = mapped_column(Boolean, nullable=False)
    consent_version: Mapped[str] = mapped_column(Text, nullable=False)
    consent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    assigned_agent: Mapped[Agent | None] = relationship(back_populates="renters")
    conversations: Mapped[list[Conversation]] = relationship(back_populates="renter")
    transactions: Mapped[list[Transaction]] = relationship(back_populates="renter")
