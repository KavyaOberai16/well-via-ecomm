import logging

logger = logging.getLogger("app.email")


def send_console(*, to: str, subject: str, body: str) -> None:
    """Dev email backend — logs the message instead of sending it."""
    logger.info("EMAIL (console) to=%s subject=%s\n%s", to, subject, body)
