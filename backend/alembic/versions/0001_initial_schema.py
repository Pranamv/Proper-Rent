"""Create initial Phase 1 schema.

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-06-13
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0001_initial_schema"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

RENTER_STATUSES = (
    "new",
    "contacted",
    "qualified",
    "viewing_arranged",
    "offer_made",
    "let_agreed",
    "completed",
    "lost",
)
LANDLORD_STATUSES = ("new", "contacted", "listed", "inactive")
PROPERTY_STATUSES = ("active", "missing", "inactive", "error")
TRANSACTION_STATUSES = ("introduced", "progressing", "let_agreed", "completed", "cancelled")
AGENT_ROLES = ("agent", "admin")
CHANNELS = ("website", "whatsapp", "facebook")
SOURCES = ("website", "whatsapp", "facebook", "referral")

# Tables to lock down on PostgreSQL/Supabase. RLS is enabled with no policies so
# the PostgREST-exposed anon/authenticated roles are denied, while FastAPI's
# owner connection over DATABASE_URL still bypasses RLS. SQLite has no RLS.
RLS_TABLES = ("agents", "properties", "renters", "conversations", "landlords", "transactions")


def _dialect_name() -> str:
    return op.get_bind().dialect.name


def _is_postgresql() -> bool:
    return _dialect_name() == "postgresql"


def _uuid_type() -> sa.types.TypeEngine[object]:
    return sa.Uuid(as_uuid=True)


def _uuid_default() -> sa.TextClause | None:
    if _is_postgresql():
        return sa.text("gen_random_uuid()")
    return None


def _json_type() -> sa.types.TypeEngine[object]:
    if _is_postgresql():
        return postgresql.JSONB(astext_type=sa.Text())
    return sa.JSON()


def _text_array_type() -> sa.types.TypeEngine[object]:
    if _is_postgresql():
        return postgresql.ARRAY(sa.Text())
    return sa.JSON()


def _json_default(value: str) -> sa.TextClause:
    if _is_postgresql():
        return sa.text(f"'{value}'::jsonb")
    return sa.text(f"'{value}'")


def _text_array_default() -> sa.TextClause:
    if _is_postgresql():
        return sa.text("'{}'::text[]")
    return sa.text("'[]'")


def _timestamp() -> sa.DateTime:
    return sa.DateTime(timezone=True)


def _allowed_values_check(column_name: str, allowed_values: tuple[str, ...]) -> str:
    quoted_values = ", ".join(f"'{value}'" for value in allowed_values)
    return f"{column_name} IN ({quoted_values})"


def upgrade() -> None:
    if _is_postgresql():
        op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")

    op.create_table(
        "agents",
        sa.Column("id", _uuid_type(), primary_key=True, server_default=_uuid_default()),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("email", sa.Text(), nullable=False),
        sa.Column("role", sa.Text(), nullable=False, server_default="agent"),
        sa.Column("created_at", _timestamp(), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint(_allowed_values_check("role", AGENT_ROLES), name="ck_agents_role"),
        sa.UniqueConstraint("email", name="uq_agents_email"),
    )

    op.create_table(
        "properties",
        sa.Column("listing_id", sa.Text(), primary_key=True),
        sa.Column("source", sa.Text(), server_default="scraye"),
        sa.Column("url", sa.Text(), nullable=False),
        sa.Column("status", sa.Text(), nullable=False),
        sa.Column("title", sa.Text()),
        sa.Column("unit_type", sa.Text()),
        sa.Column("category", sa.Text()),
        sa.Column("reference", sa.Text()),
        sa.Column("verified", sa.Boolean()),
        sa.Column("price", sa.Numeric()),
        sa.Column("currency", sa.Text(), server_default="GBP"),
        sa.Column("agency", sa.Text()),
        sa.Column("standard_deposit", sa.Numeric()),
        sa.Column("deposit_share_upfront", sa.Numeric()),
        sa.Column("rent_club_savings_per_year", sa.Numeric()),
        sa.Column("guarantor_standard_fee", sa.Numeric()),
        sa.Column("guarantor_enhanced_fee", sa.Numeric()),
        sa.Column("available_text", sa.Text()),
        sa.Column("bedrooms", sa.Integer()),
        sa.Column("bathrooms", sa.Integer()),
        sa.Column("floor_area_sq_ft", sa.Numeric()),
        sa.Column("floor", sa.Text()),
        sa.Column("furnishing", sa.Text()),
        sa.Column("furnished", sa.Boolean()),
        sa.Column("epc_rating", sa.Text()),
        sa.Column("council_tax_band", sa.Text()),
        sa.Column("address", _json_type()),
        sa.Column("locality", sa.Text()),
        sa.Column("region", sa.Text()),
        sa.Column("geo", _json_type()),
        sa.Column("map", _json_type()),
        sa.Column("street_view", _json_type()),
        sa.Column("nearest_tube", _json_type()),
        sa.Column("images", _json_type()),
        sa.Column("image_objects", _json_type()),
        sa.Column("links", _json_type()),
        sa.Column("description", sa.Text()),
        sa.Column("section_text", _json_type()),
        sa.Column("raw_jsonld", _json_type()),
        sa.Column("normalized", _json_type()),
        sa.Column("content_hash", sa.Text()),
        sa.Column("first_seen_at", _timestamp()),
        sa.Column("last_seen_at", _timestamp()),
        sa.Column("last_fetched_at", _timestamp()),
        sa.Column("missing_from_source_at", _timestamp()),
        sa.Column("inactive_at", _timestamp()),
        sa.Column("error_message", sa.Text()),
        sa.Column("updated_at", _timestamp()),
        sa.CheckConstraint(
            _allowed_values_check("status", PROPERTY_STATUSES),
            name="ck_properties_status",
        ),
        sa.UniqueConstraint("url", name="uq_properties_url"),
    )

    op.create_table(
        "renters",
        sa.Column("id", _uuid_type(), primary_key=True, server_default=_uuid_default()),
        sa.Column("source_channel", sa.Text(), nullable=False),
        sa.Column("session_id", sa.Text()),
        sa.Column("full_name", sa.Text()),
        sa.Column("email", sa.Text()),
        sa.Column("phone", sa.Text()),
        sa.Column("bedrooms_required", sa.Integer()),
        sa.Column("areas_preferred", _text_array_type()),
        sa.Column("max_rent", sa.Numeric()),
        sa.Column("move_in_from", sa.Date()),
        sa.Column("move_in_by", sa.Date()),
        sa.Column("employment_status", sa.Text()),
        sa.Column("annual_income_range", sa.Text()),
        sa.Column("has_guarantor", sa.Text()),
        sa.Column("deposit_availability", sa.Text()),
        sa.Column("current_housing", sa.Text()),
        sa.Column("how_heard", sa.Text()),
        sa.Column("furnished_preference", sa.Text()),
        sa.Column("pets", sa.Text()),
        sa.Column("accessibility_needs", sa.Text()),
        sa.Column("has_rented_before", sa.Boolean()),
        sa.Column("notes", sa.Text()),
        sa.Column("intent_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("lead_status", sa.Text(), nullable=False, server_default="new"),
        sa.Column("assigned_agent_id", _uuid_type(), sa.ForeignKey("agents.id")),
        sa.Column("scraye_introduction_id", sa.Text()),
        sa.Column(
            "fintech_flags",
            _json_type(),
            nullable=False,
            server_default=_json_default("{}"),
        ),
        sa.Column("consent_given", sa.Boolean(), nullable=False),
        sa.Column("consent_version", sa.Text(), nullable=False),
        sa.Column("consent_at", _timestamp(), nullable=False),
        sa.Column("created_at", _timestamp(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", _timestamp()),
        sa.CheckConstraint(
            _allowed_values_check("source_channel", SOURCES),
            name="ck_renters_source_channel",
        ),
        sa.CheckConstraint(
            _allowed_values_check("lead_status", RENTER_STATUSES),
            name="ck_renters_lead_status",
        ),
    )

    op.create_table(
        "conversations",
        sa.Column("id", _uuid_type(), primary_key=True, server_default=_uuid_default()),
        sa.Column("renter_id", _uuid_type(), sa.ForeignKey("renters.id")),
        sa.Column("session_id", sa.Text(), nullable=False),
        sa.Column("channel", sa.Text(), nullable=False),
        sa.Column("external_id", sa.Text()),
        sa.Column("transcript", _json_type(), nullable=False, server_default=_json_default("[]")),
        sa.Column("ai_summary", sa.Text()),
        sa.Column("intent_score_output", sa.Integer()),
        sa.Column("started_at", _timestamp(), nullable=False, server_default=sa.func.now()),
        sa.Column("ended_at", _timestamp()),
        sa.Column("created_at", _timestamp(), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint(
            _allowed_values_check("channel", CHANNELS),
            name="ck_conversations_channel",
        ),
    )

    op.create_table(
        "landlords",
        sa.Column("id", _uuid_type(), primary_key=True, server_default=_uuid_default()),
        sa.Column("full_name", sa.Text()),
        sa.Column("email", sa.Text()),
        sa.Column("phone", sa.Text()),
        sa.Column("property_address", sa.Text()),
        sa.Column("bedrooms", sa.Integer()),
        sa.Column("asking_rent", sa.Numeric()),
        sa.Column("available_from", sa.Date()),
        sa.Column("advanced_rent_interest", sa.Boolean(), server_default=sa.false()),
        sa.Column("listing_interest", sa.Boolean(), server_default=sa.false()),
        sa.Column("status", sa.Text(), nullable=False, server_default="new"),
        sa.Column("consent_given", sa.Boolean(), nullable=False),
        sa.Column("consent_version", sa.Text(), nullable=False),
        sa.Column("consent_at", _timestamp(), nullable=False),
        sa.Column("notes", sa.Text()),
        sa.Column("created_at", _timestamp(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", _timestamp()),
        sa.CheckConstraint(
            _allowed_values_check("status", LANDLORD_STATUSES),
            name="ck_landlords_status",
        ),
    )

    op.create_table(
        "transactions",
        sa.Column("id", _uuid_type(), primary_key=True, server_default=_uuid_default()),
        sa.Column("renter_id", _uuid_type(), sa.ForeignKey("renters.id"), nullable=False),
        sa.Column(
            "listing_id",
            sa.Text(),
            sa.ForeignKey("properties.listing_id"),
            nullable=False,
        ),
        sa.Column("scraye_introduction_id", sa.Text()),
        sa.Column("scraye_tenancy_id", sa.Text()),
        sa.Column("introduction_date", sa.Date()),
        sa.Column("tenancy_start_date", sa.Date()),
        sa.Column("monthly_rent", sa.Numeric()),
        sa.Column("annual_rent", sa.Numeric(), sa.Computed("monthly_rent * 12", persisted=True)),
        sa.Column("intro_commission_expected", sa.Numeric()),
        sa.Column("intro_commission_received", sa.Numeric()),
        sa.Column("intro_commission_paid_at", sa.Date()),
        sa.Column(
            "fintech_products_used",
            _text_array_type(),
            server_default=_text_array_default(),
        ),
        sa.Column("fintech_commissions_expected", sa.Numeric(), server_default="0"),
        sa.Column("fintech_commissions_received", sa.Numeric(), server_default="0"),
        sa.Column("viewing_fee_earned", sa.Numeric(), server_default="0"),
        sa.Column("checkin_bonus_earned", sa.Numeric(), server_default="0"),
        sa.Column("status", sa.Text(), nullable=False, server_default="introduced"),
        sa.Column("notes", sa.Text()),
        sa.Column("created_at", _timestamp(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", _timestamp()),
        sa.CheckConstraint(
            _allowed_values_check("status", TRANSACTION_STATUSES),
            name="ck_transactions_status",
        ),
    )

    op.create_index("ix_properties_status", "properties", ["status"])
    op.create_index("ix_properties_price", "properties", ["price"])
    op.create_index("ix_properties_bedrooms", "properties", ["bedrooms"])
    op.create_index("ix_properties_content_hash", "properties", ["content_hash"])
    op.create_index("ix_properties_locality", "properties", ["locality"])
    op.create_index("ix_properties_last_seen_at", "properties", ["last_seen_at"])

    if _is_postgresql():
        op.create_index("ix_properties_geo_gin", "properties", ["geo"], postgresql_using="gin")
        op.create_index(
            "ix_properties_section_text_gin",
            "properties",
            ["section_text"],
            postgresql_using="gin",
        )

    op.create_index("ix_renters_email", "renters", ["email"])
    op.create_index("ix_renters_session_id", "renters", ["session_id"])
    op.create_index("ix_renters_lead_status", "renters", ["lead_status"])
    op.create_index("ix_renters_assigned_agent_id", "renters", ["assigned_agent_id"])
    op.create_index("ix_renters_created_at", "renters", ["created_at"])
    op.create_index("ix_conversations_session_id", "conversations", ["session_id"])
    op.create_index("ix_conversations_renter_id", "conversations", ["renter_id"])
    op.create_index("ix_landlords_status", "landlords", ["status"])
    op.create_index("ix_landlords_created_at", "landlords", ["created_at"])
    op.create_index("ix_transactions_status", "transactions", ["status"])
    op.create_index("ix_transactions_renter_id", "transactions", ["renter_id"])

    if _is_postgresql():
        for table_name in RLS_TABLES:
            op.execute(f"ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY")
        # Alembic's own version table is also PostgREST-exposed; lock it down too.
        # It exists by the time upgrade() runs (IF EXISTS guards offline/--sql runs).
        op.execute("ALTER TABLE IF EXISTS alembic_version ENABLE ROW LEVEL SECURITY")


def downgrade() -> None:
    # The RLS_TABLES are dropped below, which removes their RLS state; only
    # alembic_version survives a downgrade, so reverse the lock-down on it.
    if _is_postgresql():
        op.execute("ALTER TABLE IF EXISTS alembic_version DISABLE ROW LEVEL SECURITY")

    op.drop_index("ix_transactions_renter_id", table_name="transactions")
    op.drop_index("ix_transactions_status", table_name="transactions")
    op.drop_index("ix_landlords_created_at", table_name="landlords")
    op.drop_index("ix_landlords_status", table_name="landlords")
    op.drop_index("ix_conversations_renter_id", table_name="conversations")
    op.drop_index("ix_conversations_session_id", table_name="conversations")
    op.drop_index("ix_renters_created_at", table_name="renters")
    op.drop_index("ix_renters_assigned_agent_id", table_name="renters")
    op.drop_index("ix_renters_lead_status", table_name="renters")
    op.drop_index("ix_renters_session_id", table_name="renters")
    op.drop_index("ix_renters_email", table_name="renters")

    if _is_postgresql():
        op.drop_index("ix_properties_section_text_gin", table_name="properties")
        op.drop_index("ix_properties_geo_gin", table_name="properties")

    op.drop_index("ix_properties_last_seen_at", table_name="properties")
    op.drop_index("ix_properties_locality", table_name="properties")
    op.drop_index("ix_properties_content_hash", table_name="properties")
    op.drop_index("ix_properties_bedrooms", table_name="properties")
    op.drop_index("ix_properties_price", table_name="properties")
    op.drop_index("ix_properties_status", table_name="properties")

    op.drop_table("transactions")
    op.drop_table("landlords")
    op.drop_table("conversations")
    op.drop_table("renters")
    op.drop_table("properties")
    op.drop_table("agents")
