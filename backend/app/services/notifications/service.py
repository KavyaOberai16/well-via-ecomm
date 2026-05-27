"""Dispatcher that fans out a single domain event to email + SMS.

`notify(order, event)` is the only entry point. Callers don't decide which
channels fire — that's a function of (event, settings, customer profile):

  - The per-event setting must be ON (admin toggle in /admin/settings).
  - Email always fires when the event is enabled (transactional).
  - SMS fires only if the event has an SMS template AND the user has a phone.

Failures are logged and swallowed. Order actions never fail on notification.
"""
from __future__ import annotations

import enum
import logging
from typing import Callable

from sqlalchemy.orm import Session

from app.email import send_email
from app.models.order import Order
from app.services.notifications import templates as t
from app.services.settings_service import SettingsService
from app.sms import send_sms

logger = logging.getLogger(__name__)


class NotificationEvent(str, enum.Enum):
    ORDER_PAID = "order_paid"
    ORDER_SHIPPED = "order_shipped"
    ORDER_DELIVERED = "order_delivered"
    ORDER_CANCELLED = "order_cancelled"
    ORDER_REFUNDED = "order_refunded"


# (settings_key, email_fn, sms_fn). sms_fn=None means email-only.
_EVENT_TABLE: dict[NotificationEvent, tuple[str, Callable, Callable | None]] = {
    NotificationEvent.ORDER_PAID: (
        "notifications.order_paid",
        t.email_order_paid,
        t.sms_order_paid,
    ),
    NotificationEvent.ORDER_SHIPPED: (
        "notifications.order_shipped",
        t.email_order_shipped,
        t.sms_order_shipped,
    ),
    NotificationEvent.ORDER_DELIVERED: (
        "notifications.order_delivered",
        t.email_order_delivered,
        None,
    ),
    NotificationEvent.ORDER_CANCELLED: (
        "notifications.order_cancelled",
        t.email_order_cancelled,
        None,
    ),
    NotificationEvent.ORDER_REFUNDED: (
        "notifications.order_refunded",
        t.email_order_refunded,
        None,
    ),
}


class NotificationService:
    def __init__(self, db: Session):
        self.db = db

    def notify(self, order: Order, event: NotificationEvent) -> None:
        entry = _EVENT_TABLE.get(event)
        if entry is None:
            logger.warning("unknown notification event: %s", event)
            return
        settings_key, email_fn, sms_fn = entry

        if not SettingsService(self.db).get_bool(settings_key, default=True):
            return

        user = order.user
        if user is None or not user.email:
            logger.info(
                "notify %s skipped — order %s has no customer email",
                event.value,
                order.id,
            )
            return

        # Email — always fires when the event is on.
        try:
            subject, body = email_fn(order)
            send_email(to=user.email, subject=subject, body=body, db=self.db)
        except Exception as exc:  # noqa: BLE001
            logger.warning(
                "notify %s email failed for order %s: %s", event.value, order.id, exc
            )

        # SMS — only when the user opted in (phone set) and the event has one.
        if sms_fn is not None and (user.phone or "").strip():
            try:
                send_sms(to=user.phone.strip(), body=sms_fn(order), db=self.db)
            except Exception as exc:  # noqa: BLE001
                logger.warning(
                    "notify %s sms failed for order %s: %s",
                    event.value,
                    order.id,
                    exc,
                )
