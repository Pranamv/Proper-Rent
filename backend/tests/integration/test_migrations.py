import asyncio
import os
import re
from pathlib import Path

import pytest
from alembic.config import Config
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.ext.asyncio import create_async_engine

from alembic import command

BACKEND_ROOT = Path(__file__).resolve().parents[2]
POSTGRES_TEST_DATABASE_URL_ENV = "POSTGRES_TEST_DATABASE_URL"

EXPECTED_TABLES = {
    "agents",
    "renters",
    "conversations",
    "landlords",
    "properties",
    "transactions",
}


def make_alembic_config(database_url: str) -> Config:
    config = Config(str(BACKEND_ROOT / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND_ROOT / "alembic"))
    config.set_main_option("sqlalchemy.url", database_url)
    return config


def test_initial_migration_upgrade_and_downgrade(tmp_path: Path) -> None:
    database_path = tmp_path / "migration-smoke.db"
    async_url = f"sqlite+aiosqlite:///{database_path}"
    sync_url = f"sqlite:///{database_path}"
    config = make_alembic_config(async_url)

    command.upgrade(config, "head")

    engine = create_engine(sync_url)
    try:
        inspector = inspect(engine)
        assert EXPECTED_TABLES.issubset(set(inspector.get_table_names()))
        assert_table_contracts(inspector)
        assert_schema_only_tables_are_empty(engine)

        command.downgrade(config, "base")

        inspector = inspect(engine)
        assert EXPECTED_TABLES.isdisjoint(set(inspector.get_table_names()))
    finally:
        engine.dispose()


@pytest.mark.postgres
def test_initial_migration_postgres_contracts() -> None:
    database_url = os.getenv(POSTGRES_TEST_DATABASE_URL_ENV)
    if not database_url:
        pytest.skip(f"{POSTGRES_TEST_DATABASE_URL_ENV} is not configured")

    config = make_alembic_config(database_url)

    command.downgrade(config, "base")
    command.upgrade(config, "head")
    try:
        asyncio.run(assert_postgres_contracts(database_url))
    finally:
        command.downgrade(config, "base")


async def assert_postgres_contracts(database_url: str) -> None:
    engine = create_async_engine(database_url)
    try:
        async with engine.connect() as connection:
            await connection.run_sync(assert_postgres_schema)
    finally:
        await engine.dispose()


def assert_postgres_schema(connection) -> None:  # type: ignore[no-untyped-def]
    inspector = inspect(connection)
    assert EXPECTED_TABLES.issubset(set(inspector.get_table_names()))
    assert_table_contracts(inspector, expect_postgres=True)
    assert_row_level_security_enabled(connection)


def assert_row_level_security_enabled(connection) -> None:  # type: ignore[no-untyped-def]
    rows = connection.execute(
        text(
            "SELECT relname FROM pg_class c "
            "JOIN pg_namespace n ON n.oid = c.relnamespace "
            "WHERE n.nspname = 'public' AND c.relrowsecurity"
        )
    ).fetchall()
    rls_tables = {row[0] for row in rows}
    assert EXPECTED_TABLES.issubset(rls_tables)


def assert_table_contracts(inspector, *, expect_postgres: bool = False) -> None:  # type: ignore[no-untyped-def]
    renters_columns = column_map(inspector, "renters")
    landlords_columns = column_map(inspector, "landlords")
    agents_columns = column_map(inspector, "agents")
    properties_columns = column_map(inspector, "properties")
    transactions_columns = column_map(inspector, "transactions")

    assert renters_columns["consent_given"]["nullable"] is False
    assert renters_columns["consent_version"]["nullable"] is False
    assert renters_columns["consent_at"]["nullable"] is False
    assert landlords_columns["consent_given"]["nullable"] is False
    assert landlords_columns["consent_version"]["nullable"] is False
    assert landlords_columns["consent_at"]["nullable"] is False

    assert renters_columns["lead_status"]["nullable"] is False
    assert landlords_columns["status"]["nullable"] is False
    assert agents_columns["role"]["nullable"] is False
    assert properties_columns["status"]["nullable"] is False
    assert transactions_columns["status"]["nullable"] is False

    assert_check_exists(inspector, "renters", "ck_renters_lead_status")
    assert_check_exists(inspector, "landlords", "ck_landlords_status")
    assert_check_exists(inspector, "agents", "ck_agents_role")
    assert_check_exists(inspector, "properties", "ck_properties_status")
    assert_check_exists(inspector, "transactions", "ck_transactions_status")

    property_indexes = index_names(inspector, "properties")
    assert {
        "ix_properties_status",
        "ix_properties_price",
        "ix_properties_bedrooms",
        "ix_properties_content_hash",
        "ix_properties_locality",
        "ix_properties_last_seen_at",
    }.issubset(property_indexes)

    if expect_postgres:
        assert str(agents_columns["id"]["type"]).upper() == "UUID"
        assert {
            "ix_properties_geo_gin",
            "ix_properties_section_text_gin",
        }.issubset(property_indexes)
        assert "JSONB" in str(renters_columns["fintech_flags"]["type"]).upper()
        assert "ARRAY" in str(transactions_columns["fintech_products_used"]["type"]).upper()
        annual_rent_computed = transactions_columns["annual_rent"].get("computed")
        assert isinstance(annual_rent_computed, dict)
        # PostgreSQL normalizes generated-column expressions when it stores them,
        # so "monthly_rent * 12" is reflected back as "(monthly_rent * (12)::numeric)".
        # Assert on the meaningful structure rather than the verbatim source text.
        sqltext = str(annual_rent_computed.get("sqltext"))
        assert re.search(r"monthly_rent\s*\*\s*\(?12\b", sqltext), sqltext


def column_map(inspector, table_name: str) -> dict[str, dict[str, object]]:  # type: ignore[no-untyped-def]
    return {column["name"]: column for column in inspector.get_columns(table_name)}


def index_names(inspector, table_name: str) -> set[str]:  # type: ignore[no-untyped-def]
    return {index["name"] for index in inspector.get_indexes(table_name)}


def assert_check_exists(inspector, table_name: str, check_name: str) -> None:  # type: ignore[no-untyped-def]
    check_names = {constraint["name"] for constraint in inspector.get_check_constraints(table_name)}
    assert check_name in check_names


def assert_schema_only_tables_are_empty(engine) -> None:  # type: ignore[no-untyped-def]
    with engine.connect() as connection:
        properties_count = connection.execute(text("SELECT COUNT(*) FROM properties")).scalar_one()
        transactions_count = connection.execute(
            text("SELECT COUNT(*) FROM transactions")
        ).scalar_one()

    assert properties_count == 0
    assert transactions_count == 0
