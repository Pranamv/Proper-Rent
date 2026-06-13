from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import CheckConstraint, Computed, Date, ForeignKey, Index, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, CreatedAtMixin, UpdatedAtMixin, UuidPrimaryKeyMixin
from app.models.constants import TRANSACTION_STATUSES, allowed_values_check
from app.models.types import text_array_column_type

if TYPE_CHECKING:
    from app.models.property import Property
    from app.models.renter import Renter


class Transaction(UuidPrimaryKeyMixin, CreatedAtMixin, UpdatedAtMixin, Base):
    """Schema placeholder for optional later commission tracking work."""

    __tablename__ = "transactions"
    __table_args__ = (
        CheckConstraint(
            allowed_values_check("status", TRANSACTION_STATUSES),
            name="ck_transactions_status",
        ),
        Index("ix_transactions_status", "status"),
        Index("ix_transactions_renter_id", "renter_id"),
    )

    renter_id: Mapped[UUID] = mapped_column(ForeignKey("renters.id"), nullable=False)
    listing_id: Mapped[str] = mapped_column(ForeignKey("properties.listing_id"), nullable=False)
    scraye_introduction_id: Mapped[str | None] = mapped_column(Text)
    scraye_tenancy_id: Mapped[str | None] = mapped_column(Text)
    introduction_date: Mapped[date | None] = mapped_column(Date)
    tenancy_start_date: Mapped[date | None] = mapped_column(Date)
    monthly_rent: Mapped[Decimal | None] = mapped_column(Numeric)
    annual_rent: Mapped[Decimal | None] = mapped_column(
        Numeric,
        Computed("monthly_rent * 12", persisted=True),
    )
    intro_commission_expected: Mapped[Decimal | None] = mapped_column(Numeric)
    intro_commission_received: Mapped[Decimal | None] = mapped_column(Numeric)
    intro_commission_paid_at: Mapped[date | None] = mapped_column(Date)
    fintech_products_used: Mapped[list[str] | None] = mapped_column(text_array_column_type())
    fintech_commissions_expected: Mapped[Decimal | None] = mapped_column(
        Numeric,
        server_default="0",
    )
    fintech_commissions_received: Mapped[Decimal | None] = mapped_column(
        Numeric,
        server_default="0",
    )
    viewing_fee_earned: Mapped[Decimal | None] = mapped_column(Numeric, server_default="0")
    checkin_bonus_earned: Mapped[Decimal | None] = mapped_column(Numeric, server_default="0")
    status: Mapped[str] = mapped_column(Text, nullable=False, server_default="introduced")
    notes: Mapped[str | None] = mapped_column(Text)

    renter: Mapped[Renter] = relationship(back_populates="transactions")
    property: Mapped[Property] = relationship()
