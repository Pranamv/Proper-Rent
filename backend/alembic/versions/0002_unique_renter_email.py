"""Add case-insensitive partial unique index on renters.email.

Enforces the idempotent duplicate-email contract at the database level so the
check-then-insert in the leads endpoint is safe under concurrency. Partial on
`email IS NOT NULL` because email is nullable (e.g. social-channel leads).

Revision ID: 0002_unique_renter_email
Revises: 0001_initial_schema
Create Date: 2026-06-13
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0002_unique_renter_email"
down_revision: str | None = "0001_initial_schema"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_index(
        "uq_renters_email_lower",
        "renters",
        [sa.text("lower(email)")],
        unique=True,
        postgresql_where=sa.text("email IS NOT NULL"),
        sqlite_where=sa.text("email IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index("uq_renters_email_lower", table_name="renters")
