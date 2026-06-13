AGENT_ROLES = ("agent", "admin")
CHANNELS = ("website", "whatsapp", "facebook")
LANDLORD_STATUSES = ("new", "contacted", "listed", "inactive")
PROPERTY_STATUSES = ("active", "missing", "inactive", "error")
RENTER_SOURCES = ("website", "whatsapp", "facebook", "referral")
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
TRANSACTION_STATUSES = ("introduced", "progressing", "let_agreed", "completed", "cancelled")


def allowed_values_check(column_name: str, allowed_values: tuple[str, ...]) -> str:
    quoted_values = ", ".join(f"'{value}'" for value in allowed_values)
    return f"{column_name} IN ({quoted_values})"
