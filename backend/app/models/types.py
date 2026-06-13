from typing import Any

from sqlalchemy import JSON, Text
from sqlalchemy.dialects import postgresql
from sqlalchemy.types import TypeEngine

type JsonObject = dict[str, Any]
type JsonList = list[dict[str, Any]]


def json_column_type() -> TypeEngine[Any]:
    return postgresql.JSONB(astext_type=Text()).with_variant(JSON(), "sqlite")


def text_array_column_type() -> TypeEngine[Any]:
    return postgresql.ARRAY(Text()).with_variant(JSON(), "sqlite")
