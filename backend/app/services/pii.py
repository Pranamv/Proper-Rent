import re
from collections.abc import Mapping
from typing import Any

REDACTION_TOKEN = "[redacted]"

EMAIL_PATTERN = re.compile(
    r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b",
    flags=re.IGNORECASE,
)

UK_PHONE_PATTERN = re.compile(
    r"""
    (?<![\w+])
    (?:
        \+44[\s.-]?(?:\(0\)[\s.-]?)?
        |
        0
    )
    (?:
        \(?\d{2,5}\)?[\s.-]?
        \d{3,4}[\s.-]?
        \d{3,4}
        |
        7\d{3}[\s.-]?\d{6}
    )
    (?!\w)
    """,
    flags=re.VERBOSE,
)


def scrub_pii(value: str) -> str:
    without_email = EMAIL_PATTERN.sub(REDACTION_TOKEN, value)
    return UK_PHONE_PATTERN.sub(REDACTION_TOKEN, without_email)


def scrub_transcript_entries(entries: list[Mapping[str, Any]]) -> list[dict[str, Any]]:
    scrubbed_entries: list[dict[str, Any]] = []

    for entry in entries:
        scrubbed_entry = dict(entry)
        content = scrubbed_entry.get("content")
        if isinstance(content, str):
            scrubbed_entry["content"] = scrub_pii(content)
        scrubbed_entries.append(scrubbed_entry)

    return scrubbed_entries
