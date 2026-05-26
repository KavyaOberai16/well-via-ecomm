from app.core.config import settings
from app.email.console import send_console


def send_email(*, to: str, subject: str, body: str) -> None:
    """Send an email via the configured backend (console for dev, SMTP for prod)."""
    if settings.EMAIL_BACKEND == "smtp":
        from app.email.smtp import send_smtp  # imported lazily

        send_smtp(to=to, subject=subject, body=body)
    else:
        send_console(to=to, subject=subject, body=body)
