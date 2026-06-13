from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Boolean, CheckConstraint, Date, DateTime, Index, Integer, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, CreatedAtMixin, UpdatedAtMixin, UuidPrimaryKeyMixin
from app.models.constants import LANDLORD_STATUSES, allowed_values_check


class Landlord(UuidPrimaryKeyMixin, CreatedAtMixin, UpdatedAtMixin, Base):
    __tablename__ = "landlords"
    __table_args__ = (
        CheckConstraint(
            allowed_values_check("status", LANDLORD_STATUSES),
            name="ck_landlords_status",
        ),
        Index("ix_landlords_status", "status"),
        Index("ix_landlords_created_at", "created_at"),
    )

    full_name: Mapped[str | None] = mapped_column(Text)
    email: Mapped[str | None] = mapped_column(Text)
    phone: Mapped[str | None] = mapped_column(Text)
    property_address: Mapped[str | None] = mapped_column(Text)
    bedrooms: Mapped[int | None] = mapped_column(Integer)
    asking_rent: Mapped[Decimal | None] = mapped_column(Numeric)
    available_from: Mapped[date | None] = mapped_column(Date)
    advanced_rent_interest: Mapped[bool | None] = mapped_column(Boolean, server_default="false")
    listing_interest: Mapped[bool | None] = mapped_column(Boolean, server_default="false")
    status: Mapped[str] = mapped_column(Text, nullable=False, server_default="new")
    consent_given: Mapped[bool] = mapped_column(Boolean, nullable=False)
    consent_version: Mapped[str] = mapped_column(Text, nullable=False)
    consent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)
