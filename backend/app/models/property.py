from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, CheckConstraint, Index, Numeric, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, UpdatedAtMixin
from app.models.constants import PROPERTY_STATUSES, allowed_values_check
from app.models.types import JsonObject, json_column_type


class Property(UpdatedAtMixin, Base):
    """Schema placeholder for optional later Scraye sync work."""

    __tablename__ = "properties"
    __table_args__ = (
        CheckConstraint(
            allowed_values_check("status", PROPERTY_STATUSES),
            name="ck_properties_status",
        ),
        UniqueConstraint("url", name="uq_properties_url"),
        Index("ix_properties_status", "status"),
        Index("ix_properties_price", "price"),
        Index("ix_properties_bedrooms", "bedrooms"),
        Index("ix_properties_content_hash", "content_hash"),
        Index("ix_properties_locality", "locality"),
        Index("ix_properties_last_seen_at", "last_seen_at"),
        Index("ix_properties_geo_gin", "geo", postgresql_using="gin"),
        Index("ix_properties_section_text_gin", "section_text", postgresql_using="gin"),
    )

    listing_id: Mapped[str] = mapped_column(Text, primary_key=True)
    source: Mapped[str | None] = mapped_column(Text, server_default="scraye")
    url: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(Text, nullable=False)
    title: Mapped[str | None] = mapped_column(Text)
    unit_type: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str | None] = mapped_column(Text)
    reference: Mapped[str | None] = mapped_column(Text)
    verified: Mapped[bool | None] = mapped_column(Boolean)
    price: Mapped[Decimal | None] = mapped_column(Numeric)
    currency: Mapped[str | None] = mapped_column(Text, server_default="GBP")
    agency: Mapped[str | None] = mapped_column(Text)
    standard_deposit: Mapped[Decimal | None] = mapped_column(Numeric)
    deposit_share_upfront: Mapped[Decimal | None] = mapped_column(Numeric)
    rent_club_savings_per_year: Mapped[Decimal | None] = mapped_column(Numeric)
    guarantor_standard_fee: Mapped[Decimal | None] = mapped_column(Numeric)
    guarantor_enhanced_fee: Mapped[Decimal | None] = mapped_column(Numeric)
    available_text: Mapped[str | None] = mapped_column(Text)
    bedrooms: Mapped[int | None] = mapped_column()
    bathrooms: Mapped[int | None] = mapped_column()
    floor_area_sq_ft: Mapped[Decimal | None] = mapped_column(Numeric)
    floor: Mapped[str | None] = mapped_column(Text)
    furnishing: Mapped[str | None] = mapped_column(Text)
    furnished: Mapped[bool | None] = mapped_column(Boolean)
    epc_rating: Mapped[str | None] = mapped_column(Text)
    council_tax_band: Mapped[str | None] = mapped_column(Text)
    address: Mapped[JsonObject | None] = mapped_column(json_column_type())
    locality: Mapped[str | None] = mapped_column(Text)
    region: Mapped[str | None] = mapped_column(Text)
    geo: Mapped[JsonObject | None] = mapped_column(json_column_type())
    map: Mapped[JsonObject | None] = mapped_column(json_column_type())
    street_view: Mapped[JsonObject | None] = mapped_column(json_column_type())
    nearest_tube: Mapped[JsonObject | None] = mapped_column(json_column_type())
    images: Mapped[JsonObject | None] = mapped_column(json_column_type())
    image_objects: Mapped[JsonObject | None] = mapped_column(json_column_type())
    links: Mapped[JsonObject | None] = mapped_column(json_column_type())
    description: Mapped[str | None] = mapped_column(Text)
    section_text: Mapped[JsonObject | None] = mapped_column(json_column_type())
    raw_jsonld: Mapped[JsonObject | None] = mapped_column(json_column_type())
    normalized: Mapped[JsonObject | None] = mapped_column(json_column_type())
    content_hash: Mapped[str | None] = mapped_column(Text)
    first_seen_at: Mapped[datetime | None] = mapped_column()
    last_seen_at: Mapped[datetime | None] = mapped_column()
    last_fetched_at: Mapped[datetime | None] = mapped_column()
    missing_from_source_at: Mapped[datetime | None] = mapped_column()
    inactive_at: Mapped[datetime | None] = mapped_column()
    error_message: Mapped[str | None] = mapped_column(Text)
