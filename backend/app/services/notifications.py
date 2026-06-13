import logging
from dataclasses import dataclass
from enum import StrEnum
from typing import Protocol
from uuid import UUID

import httpx

from app.config import Settings, get_settings

logger = logging.getLogger(__name__)

RESEND_EMAILS_URL = "https://api.resend.com/emails"
EMAIL_TIMEOUT_SECONDS = 10.0


class EmailTemplate(StrEnum):
    RENTER_CONFIRMATION = "renter_confirmation"
    LANDLORD_CONFIRMATION = "landlord_confirmation"
    HOT_RENTER_ALERT = "hot_renter_alert"
    LANDLORD_AGENT_NOTIFICATION = "landlord_agent_notification"


class RecipientKind(StrEnum):
    RENTER = "renter"
    LANDLORD = "landlord"
    AGENT = "agent"


class DeliveryStatus(StrEnum):
    SENT = "sent"
    FAILED = "failed"
    SKIPPED = "skipped"


class NotificationError(Exception):
    pass


class NotificationConfigurationError(NotificationError):
    pass


class EmailTransportError(NotificationError):
    pass


@dataclass(frozen=True)
class EmailMessage:
    template: EmailTemplate
    recipient_kind: RecipientKind
    entity_id: UUID
    to_email: str
    subject: str
    text: str


@dataclass(frozen=True)
class EmailDelivery:
    template: EmailTemplate
    recipient_kind: RecipientKind
    entity_id: UUID
    status: DeliveryStatus
    provider_message_id: str | None = None
    error_type: str | None = None


class EmailTransport(Protocol):
    async def send(self, message: EmailMessage) -> str:
        pass


class ResendEmailTransport:
    def __init__(
        self,
        *,
        api_key: str | None,
        from_email: str,
        client: httpx.AsyncClient | None = None,
    ) -> None:
        self.api_key = api_key
        self.from_email = from_email
        self.client = client

    async def send(self, message: EmailMessage) -> str:
        if not self.api_key:
            raise NotificationConfigurationError("RESEND_API_KEY is required to send email")

        payload = {
            "from": self.from_email,
            "to": [message.to_email],
            "subject": message.subject,
            "text": message.text,
        }
        headers = {"Authorization": f"Bearer {self.api_key}"}

        try:
            if self.client is not None:
                response = await self.client.post(
                    RESEND_EMAILS_URL,
                    headers=headers,
                    json=payload,
                    timeout=EMAIL_TIMEOUT_SECONDS,
                )
            else:
                async with httpx.AsyncClient(timeout=EMAIL_TIMEOUT_SECONDS) as client:
                    response = await client.post(RESEND_EMAILS_URL, headers=headers, json=payload)
        except httpx.HTTPError as exc:
            raise EmailTransportError("Resend request failed") from exc

        if response.status_code >= 400:
            raise EmailTransportError(f"Resend returned HTTP {response.status_code}")

        try:
            data: object = response.json()
        except ValueError as exc:
            raise EmailTransportError("Resend response was not valid JSON") from exc

        if not isinstance(data, dict):
            raise EmailTransportError("Resend response did not include a message id")

        message_id = data.get("id")
        if not isinstance(message_id, str) or not message_id:
            raise EmailTransportError("Resend response did not include a message id")
        return message_id


class NotificationService:
    def __init__(self, *, settings: Settings, transport: EmailTransport | None = None) -> None:
        self.settings = settings
        self.transport = transport or ResendEmailTransport(
            api_key=settings.resend_api_key,
            from_email=settings.resend_from_email,
        )

    async def send_renter_confirmation(
        self,
        *,
        renter_id: UUID,
        renter_email: str,
        consent_version: str,
    ) -> EmailDelivery:
        return await self._send(
            build_renter_confirmation(
                renter_id=renter_id,
                renter_email=renter_email,
                consent_version=consent_version,
            )
        )

    async def send_landlord_confirmation(
        self,
        *,
        landlord_id: UUID,
        landlord_email: str,
        consent_version: str,
    ) -> EmailDelivery:
        return await self._send(
            build_landlord_confirmation(
                landlord_id=landlord_id,
                landlord_email=landlord_email,
                consent_version=consent_version,
            )
        )

    async def send_hot_renter_alert(
        self,
        *,
        renter_id: UUID,
        intent_score: int,
        consent_version: str,
    ) -> EmailDelivery:
        admin_email = self.settings.admin_alert_email
        if not admin_email:
            return skipped_delivery(
                template=EmailTemplate.HOT_RENTER_ALERT,
                recipient_kind=RecipientKind.AGENT,
                entity_id=renter_id,
                error_type="MissingAdminAlertEmail",
            )

        return await self._send(
            build_hot_renter_alert(
                renter_id=renter_id,
                admin_email=admin_email,
                intent_score=intent_score,
                consent_version=consent_version,
            )
        )

    async def send_landlord_agent_notification(
        self,
        *,
        landlord_id: UUID,
        consent_version: str,
    ) -> EmailDelivery:
        admin_email = self.settings.admin_alert_email
        if not admin_email:
            return skipped_delivery(
                template=EmailTemplate.LANDLORD_AGENT_NOTIFICATION,
                recipient_kind=RecipientKind.AGENT,
                entity_id=landlord_id,
                error_type="MissingAdminAlertEmail",
            )

        return await self._send(
            build_landlord_agent_notification(
                landlord_id=landlord_id,
                admin_email=admin_email,
                consent_version=consent_version,
            )
        )

    async def _send(self, message: EmailMessage) -> EmailDelivery:
        try:
            provider_message_id = await self.transport.send(message)
        except NotificationError as exc:
            log_delivery_failure(message, exc)
            return EmailDelivery(
                template=message.template,
                recipient_kind=message.recipient_kind,
                entity_id=message.entity_id,
                status=DeliveryStatus.FAILED,
                error_type=type(exc).__name__,
            )

        return EmailDelivery(
            template=message.template,
            recipient_kind=message.recipient_kind,
            entity_id=message.entity_id,
            status=DeliveryStatus.SENT,
            provider_message_id=provider_message_id,
        )


def get_notification_service(settings: Settings | None = None) -> NotificationService:
    return NotificationService(settings=settings or get_settings())


def build_renter_confirmation(
    *,
    renter_id: UUID,
    renter_email: str,
    consent_version: str,
) -> EmailMessage:
    return EmailMessage(
        template=EmailTemplate.RENTER_CONFIRMATION,
        recipient_kind=RecipientKind.RENTER,
        entity_id=renter_id,
        to_email=renter_email,
        subject="Proper Rent: we received your renter registration",
        text=(
            "Thank you for registering with Proper Rent.\n\n"
            "Our team will review your requirements and be in touch within 24 hours. "
            "If you asked about deposits, guarantors, affordability, or the letting process, "
            "we can talk through the relevant Scraye options in general terms.\n\n"
            "Consent and privacy notice version: "
            f"{consent_version}.\n\n"
            "Proper Rent"
        ),
    )


def build_landlord_confirmation(
    *,
    landlord_id: UUID,
    landlord_email: str,
    consent_version: str,
) -> EmailMessage:
    return EmailMessage(
        template=EmailTemplate.LANDLORD_CONFIRMATION,
        recipient_kind=RecipientKind.LANDLORD,
        entity_id=landlord_id,
        to_email=landlord_email,
        subject="Proper Rent: we received your landlord enquiry",
        text=(
            "Thank you for contacting Proper Rent.\n\n"
            "Our team will review the property details and follow up about listing support, "
            "tenant introductions, and Advanced Rent where relevant.\n\n"
            "Consent and privacy notice version: "
            f"{consent_version}.\n\n"
            "Proper Rent"
        ),
    )


def build_hot_renter_alert(
    *,
    renter_id: UUID,
    admin_email: str,
    intent_score: int,
    consent_version: str,
) -> EmailMessage:
    return EmailMessage(
        template=EmailTemplate.HOT_RENTER_ALERT,
        recipient_kind=RecipientKind.AGENT,
        entity_id=renter_id,
        to_email=admin_email,
        subject="Proper Rent: hot renter lead ready for review",
        text=(
            "A hot renter lead is ready for review.\n\n"
            f"Renter ID: {renter_id}\n"
            f"Intent score: {intent_score}\n"
            "Recommended SLA: contact within 2 hours.\n"
            "Review the lead in the admin panel before follow-up.\n\n"
            f"Consent version: {consent_version}."
        ),
    )


def build_landlord_agent_notification(
    *,
    landlord_id: UUID,
    admin_email: str,
    consent_version: str,
) -> EmailMessage:
    return EmailMessage(
        template=EmailTemplate.LANDLORD_AGENT_NOTIFICATION,
        recipient_kind=RecipientKind.AGENT,
        entity_id=landlord_id,
        to_email=admin_email,
        subject="Proper Rent: new landlord lead ready for review",
        text=(
            "A new landlord lead is ready for review.\n\n"
            f"Landlord ID: {landlord_id}\n"
            "Landlord leads are not scored in Phase 1. Review the lead in the admin panel "
            "and follow up on listing interest or Advanced Rent interest.\n\n"
            f"Consent version: {consent_version}."
        ),
    )


def skipped_delivery(
    *,
    template: EmailTemplate,
    recipient_kind: RecipientKind,
    entity_id: UUID,
    error_type: str,
) -> EmailDelivery:
    return EmailDelivery(
        template=template,
        recipient_kind=recipient_kind,
        entity_id=entity_id,
        status=DeliveryStatus.SKIPPED,
        error_type=error_type,
    )


def log_delivery_failure(message: EmailMessage, error: NotificationError) -> None:
    logger.warning(
        "Email delivery failed",
        extra={
            "template": message.template.value,
            "recipient_kind": message.recipient_kind.value,
            "entity_id": str(message.entity_id),
            "error_type": type(error).__name__,
        },
    )
