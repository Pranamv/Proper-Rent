from app.services.pii import REDACTION_TOKEN, scrub_pii, scrub_transcript_entries


def test_scrub_pii_redacts_email_addresses() -> None:
    text = "Please email me at renter@example.com or backup.name+test@properrent.co.uk."

    assert scrub_pii(text) == f"Please email me at {REDACTION_TOKEN} or {REDACTION_TOKEN}."


def test_scrub_pii_redacts_common_uk_mobile_formats() -> None:
    examples = [
        "Call 07123456789 today",
        "Call 07123 456789 today",
        "Call 07123-456-789 today",
        "Call +44 7123 456789 today",
        "Call +44 (0)7123 456789 today",
    ]

    for example in examples:
        assert scrub_pii(example) == f"Call {REDACTION_TOKEN} today"


def test_scrub_pii_redacts_common_uk_landline_formats() -> None:
    examples = [
        "Office 02079460958 closes at 5",
        "Office 020 7946 0958 closes at 5",
        "Office 0207 946 0958 closes at 5",
        "Office 0161 234 5678 closes at 5",
        "Office +44 20 7946 0958 closes at 5",
    ]

    for example in examples:
        assert scrub_pii(example) == f"Office {REDACTION_TOKEN} closes at 5"


def test_scrub_pii_keeps_non_pii_text_readable() -> None:
    text = "Budget is 1200, move date is 2026-08-01, and we prefer Salford."

    assert scrub_pii(text) == text


def test_scrub_transcript_entries_redacts_content_without_mutating_original_entries() -> None:
    entries = [
        {
            "role": "user",
            "content": "My email is renter@example.com and phone is 07123 456789",
            "ts": "2026-06-13T10:00:00Z",
        },
        {
            "role": "assistant",
            "content": "Please use the intake form for contact details.",
            "ts": "2026-06-13T10:00:01Z",
        },
        {"role": "system", "content": None},
    ]

    scrubbed = scrub_transcript_entries(entries)

    assert scrubbed[0]["content"] == f"My email is {REDACTION_TOKEN} and phone is {REDACTION_TOKEN}"
    assert scrubbed[1]["content"] == "Please use the intake form for contact details."
    assert scrubbed[2]["content"] is None
    assert entries[0]["content"] == "My email is renter@example.com and phone is 07123 456789"
