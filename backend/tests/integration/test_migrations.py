from pathlib import Path

from alembic.config import Config
from sqlalchemy import create_engine, inspect, text

from alembic import command

BACKEND_ROOT = Path(__file__).resolve().parents[2]

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


def assert_table_contracts(inspector) -> None:  # type: ignore[no-untyped-def]
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
