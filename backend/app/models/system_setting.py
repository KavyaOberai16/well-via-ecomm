"""Runtime-editable system settings.

Anything an admin might want to change without redeploying lives here:
SMTP credentials, Twilio creds, the TOTP system toggle, future feature flags.

`is_secret=True` rows have their value redacted in API responses — admins can
still WRITE them, just can't read them back. The actual stored value remains
plaintext on disk (no extra encryption at this layer); deeper-defense is
welcome but out of scope for v1.
"""
from sqlalchemy import Boolean, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, IDMixin, TimestampMixin


class SystemSetting(Base, IDMixin, TimestampMixin):
    __tablename__ = "system_settings"

    # Dotted machine identifier: "smtp.host", "auth.totp_mode", "sms.provider".
    key: Mapped[str] = mapped_column(
        String(120), unique=True, index=True, nullable=False
    )
    value: Mapped[str | None] = mapped_column(Text)
    # Grouping label for the admin UI: "email", "sms", "security", "general".
    category: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(255))
    # Mask the value in responses; admins can still set a new value.
    is_secret: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
