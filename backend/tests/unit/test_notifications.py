import asyncio
import json
from uuid import UUID, uuid4

import httpx
import pytest

from app.config import Settings
from app.services.notifications import (
    DeliveryStatus,
    EmailMessage,
    EmailTemplate,
    EmailTransportError,
    NotificationConfigurationError,
    NotificationService,
    RecipientKind,
    ResendEmailTransport,
    build_hot_renter_alert,
    build_landlord_agent_notification,
    build_landlord_confirmation,
    build_renter_confirmation,
)

CONSENT_VERSION = "2026-06-13"


class FakeEmailTransport:
    def __init__(self, *, should_fail: bool = False) -> None:
        self.should_fail = should_fail
        self.sent_messages: list[EmailMessage] = []

    async def send(self, message: EmailMessage) -> str:
        if self.should_fail:
            raise EmailTransportError("provider failed for renter@example.com")
        self.sent_messages.append(message)
        return f"msg-{len(self.sent_messages)}"


def test_template_builders_use_expected_recipients_and_plain_next_steps() -> None:
    renter_id = uuid4()
    landlord_id = uuid4()

    renter_confirmation = build_renter_confirmation(
        renter_id=renter_id,
        renter_email="renter@example.com",
        consent_version=CONSENT_VERSION,
    )
    landlord_confirmation = build_landlord_confirmation(
        landlord_id=landlord_id,
        landlord_email="landlord@example.com",
        consent_version=CONSENT_VERSION,
    )
    hot_alert = build_hot_renter_alert(
        renter_id=renter_id,
        admin_email="ops@example.com",
        intent_score=82,
        consent_version=CONSENT_VERSION,
    )
    landlord_notification = build_landlord_agent_notification(
        landlord_id=landlord_id,
        admin_email="ops@example.com",
        consent_version=CONSENT_VERSION,
    )

    assert renter_confirmation.template == EmailTemplate.RENTER_CONFIRMATION
    assert renter_confirmation.recipient_kind == RecipientKind.RENTER
    assert renter_confirmation.to_email == "renter@example.com"
    assert "within 24 hours" in renter_confirmation.text
    assert CONSENT_VERSION in renter_confirmation.text

    assert landlord_confirmation.template == EmailTemplate.LANDLORD_CONFIRMATION
    assert landlord_confirmation.recipient_kind == RecipientKind.LANDLORD
    assert landlord_confirmation.to_email == "landlord@example.com"
    assert "Advanced Rent" in landlord_confirmation.text

    assert hot_alert.template == EmailTemplate.HOT_RENTER_ALERT
    assert hot_alert.recipient_kind == RecipientKind.AGENT
    assert hot_alert.to_email == "ops@example.com"
    assert str(renter_id) in hot_alert.text
    assert "renter@example.com" not in hot_alert.text

    assert landlord_notification.template == EmailTemplate.LANDLORD_AGENT_NOTIFICATION
    assert landlord_notification.recipient_kind == RecipientKind.AGENT
    assert landlord_notification.to_email == "ops@example.com"
    assert str(landlord_id) in landlord_notification.text
    assert "not scored" in landlord_notification.text


def test_notification_service_routes_renter_confirmation_to_renter() -> None:
    asyncio.run(run_renter_confirmation_route())


async def run_renter_confirmation_route() -> None:
    transport = FakeEmailTransport()
    service = NotificationService(settings=Settings(app_env="test"), transport=transport)
    renter_id = uuid4()

    delivery = await service.send_renter_confirmation(
        renter_id=renter_id,
        renter_email="renter@example.com",
        consent_version=CONSENT_VERSION,
    )

    assert delivery.status == DeliveryStatus.SENT
    assert delivery.provider_message_id == "msg-1"
    assert len(transport.sent_messages) == 1
    assert transport.sent_messages[0].to_email == "renter@example.com"
    assert transport.sent_messages[0].template == EmailTemplate.RENTER_CONFIRMATION


def test_notification_service_uses_admin_alert_email_for_agent_notifications() -> None:
    asyncio.run(run_agent_notification_routes())


async def run_agent_notification_routes() -> None:
    transport = FakeEmailTransport()
    settings = Settings(app_env="test", admin_alert_email="alerts@example.com")
    service = NotificationService(settings=settings, transport=transport)
    renter_id = uuid4()
    landlord_id = uuid4()

    hot_delivery = await service.send_hot_renter_alert(
        renter_id=renter_id,
        intent_score=91,
        consent_version=CONSENT_VERSION,
    )
    landlord_delivery = await service.send_landlord_agent_notification(
        landlord_id=landlord_id,
        consent_version=CONSENT_VERSION,
    )

    assert hot_delivery.status == DeliveryStatus.SENT
    assert landlord_delivery.status == DeliveryStatus.SENT
    assert [message.to_email for message in transport.sent_messages] == [
        "alerts@example.com",
        "alerts@example.com",
    ]
    assert [message.template for message in transport.sent_messages] == [
        EmailTemplate.HOT_RENTER_ALERT,
        EmailTemplate.LANDLORD_AGENT_NOTIFICATION,
    ]


def test_missing_admin_alert_email_skips_agent_notifications_without_transport_call() -> None:
    asyncio.run(run_missing_admin_alert_email_skip())


async def run_missing_admin_alert_email_skip() -> None:
    transport = FakeEmailTransport()
    service = NotificationService(settings=Settings(app_env="test"), transport=transport)

    delivery = await service.send_hot_renter_alert(
        renter_id=uuid4(),
        intent_score=70,
        consent_version=CONSENT_VERSION,
    )

    assert delivery.status == DeliveryStatus.SKIPPED
    assert delivery.error_type == "MissingAdminAlertEmail"
    assert transport.sent_messages == []


def test_delivery_failure_is_returned_and_logged_without_pii(monkeypatch) -> None:
    log_calls: list[tuple[str, dict[str, object]]] = []

    def capture_warning(message: str, *, extra: dict[str, object]) -> None:
        log_calls.append((message, extra))

    monkeypatch.setattr(
        "app.services.notifications.logger.warning",
        capture_warning,
    )

    asyncio.run(run_delivery_failure_is_logged_without_pii(log_calls))


async def run_delivery_failure_is_logged_without_pii(
    log_calls: list[tuple[str, dict[str, object]]],
) -> None:
    transport = FakeEmailTransport(should_fail=True)
    service = NotificationService(settings=Settings(app_env="test"), transport=transport)
    renter_id = uuid4()

    delivery = await service.send_renter_confirmation(
        renter_id=renter_id,
        renter_email="renter@example.com",
        consent_version=CONSENT_VERSION,
    )

    assert delivery.status == DeliveryStatus.FAILED
    assert delivery.error_type == "EmailTransportError"
    assert log_calls == [
        (
            "Email delivery failed",
            {
                "template": EmailTemplate.RENTER_CONFIRMATION.value,
                "recipient_kind": RecipientKind.RENTER.value,
                "entity_id": str(renter_id),
                "error_type": "EmailTransportError",
            },
        )
    ]
    assert "renter@example.com" not in repr(log_calls)


def test_resend_transport_sends_expected_payload_with_configured_sender() -> None:
    asyncio.run(run_resend_transport_payload_test())


async def run_resend_transport_payload_test() -> None:
    requests: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return httpx.Response(200, json={"id": "resend-message-id"})

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        transport = ResendEmailTransport(
            api_key="test-api-key",
            from_email="Proper Rent <hello@example.com>",
            client=client,
        )
        message_id = await transport.send(
            EmailMessage(
                template=EmailTemplate.RENTER_CONFIRMATION,
                recipient_kind=RecipientKind.RENTER,
                entity_id=uuid4(),
                to_email="renter@example.com",
                subject="Subject",
                text="Body",
            )
        )

    assert message_id == "resend-message-id"
    assert len(requests) == 1
    request = requests[0]
    assert request.url == httpx.URL("https://api.resend.com/emails")
    assert request.headers["authorization"] == "Bearer test-api-key"
    assert request_payload(request) == {
        "from": "Proper Rent <hello@example.com>",
        "to": ["renter@example.com"],
        "subject": "Subject",
        "text": "Body",
    }


def request_payload(request: httpx.Request) -> dict[str, object]:
    return json.loads(request.content.decode("utf-8"))


def test_resend_transport_requires_api_key() -> None:
    asyncio.run(run_resend_transport_requires_api_key())


async def run_resend_transport_requires_api_key() -> None:
    transport = ResendEmailTransport(api_key=None, from_email="Proper Rent <hello@example.com>")
    message = EmailMessage(
        template=EmailTemplate.RENTER_CONFIRMATION,
        recipient_kind=RecipientKind.RENTER,
        entity_id=UUID("00000000-0000-0000-0000-000000000001"),
        to_email="renter@example.com",
        subject="Subject",
        text="Body",
    )

    with pytest.raises(NotificationConfigurationError):
        await transport.send(message)


def test_resend_transport_wraps_provider_failures_without_pii() -> None:
    asyncio.run(run_resend_transport_wraps_provider_failures())


async def run_resend_transport_wraps_provider_failures() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("provider failed for renter@example.com", request=request)

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        transport = ResendEmailTransport(
            api_key="test-api-key",
            from_email="Proper Rent <hello@example.com>",
            client=client,
        )
        with pytest.raises(EmailTransportError) as exc_info:
            await transport.send(
                EmailMessage(
                    template=EmailTemplate.RENTER_CONFIRMATION,
                    recipient_kind=RecipientKind.RENTER,
                    entity_id=uuid4(),
                    to_email="renter@example.com",
                    subject="Subject",
                    text="Body",
                )
            )

    assert str(exc_info.value) == "Resend request failed"
    assert "renter@example.com" not in str(exc_info.value)


def test_resend_transport_rejects_malformed_success_response() -> None:
    asyncio.run(run_resend_transport_rejects_malformed_success_response())


async def run_resend_transport_rejects_malformed_success_response() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, text="not-json")

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        transport = ResendEmailTransport(
            api_key="test-api-key",
            from_email="Proper Rent <hello@example.com>",
            client=client,
        )
        with pytest.raises(EmailTransportError) as exc_info:
            await transport.send(
                EmailMessage(
                    template=EmailTemplate.RENTER_CONFIRMATION,
                    recipient_kind=RecipientKind.RENTER,
                    entity_id=uuid4(),
                    to_email="renter@example.com",
                    subject="Subject",
                    text="Body",
                )
            )

    assert str(exc_info.value) == "Resend response was not valid JSON"
