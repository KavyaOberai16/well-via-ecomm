"""Customer-facing transactional notifications.

The flow is intentionally simple:

  1. A domain event happens (payment service moves an order to PAID, an admin
     calls mark_shipped, etc.).
  2. The caller invokes `NotificationService.notify(order, event)`.
  3. We look up the per-event toggle in system_settings — if off, return.
  4. Render the template, dispatch via the configured email + SMS backends.
  5. Failures are logged, never raised. A flaky Twilio call must NEVER fail
     the underlying order action.

Templates live in `templates.py` next to this module — plain text only for v1.
HTML email is a worthwhile future enhancement but adds template-engine choice
plus accessibility considerations; not in scope here.
"""
from app.services.notifications.service import NotificationEvent, NotificationService

__all__ = ["NotificationService", "NotificationEvent"]
