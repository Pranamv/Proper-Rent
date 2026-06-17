from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.config import Settings
from app.main import create_app


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Export or verify the deterministic FastAPI OpenAPI contract.",
    )
    parser.add_argument(
        "output_arg",
        nargs="?",
        help="Optional output path. Equivalent to --output and useful with --check.",
    )
    parser.add_argument(
        "--output",
        default="../contracts/openapi.json",
        help="Path to the checked OpenAPI JSON artifact.",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Fail when the generated OpenAPI contract differs from --output.",
    )
    args = parser.parse_args()

    output = args.output_arg or args.output
    output_path = Path(output).resolve()
    generated = render_contract()

    if args.check:
        if not output_path.exists():
            raise SystemExit(f"Missing OpenAPI artifact: {output_path}")
        existing = output_path.read_text(encoding="utf-8")
        if existing != generated:
            raise SystemExit(
                f"OpenAPI contract is out of date. Regenerate with: "
                f"python scripts/export_openapi.py --output {output}"
            )
        return

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(generated, encoding="utf-8")


def render_contract() -> str:
    app = create_app(Settings(app_env="test"))
    contract = strip_volatile_operation_ids(app.openapi())
    return json.dumps(contract, indent=2, sort_keys=True) + "\n"


def strip_volatile_operation_ids(value: Any) -> Any:
    if isinstance(value, dict):
        return {
            key: strip_volatile_operation_ids(child)
            for key, child in value.items()
            if key != "operationId"
        }
    if isinstance(value, list):
        return [strip_volatile_operation_ids(item) for item in value]
    return value


if __name__ == "__main__":
    main()
