"""Payment gateway configuration — a single-row, strongly-typed config table.

Replaces the old flat `payments.*` key/value rows in `system_settings`. One row
holds the active provider plus the PhonePe credentials. The salt key is stored
*encrypted* (Fernet, keyed off SECRET_KEY — see app/core/crypto.py); an empty
`phonepe_salt_key_encrypted` means "not set yet".

The payment factory reads this per request, so flipping `provider` from "mock"
to "phonepe" takes effect on the next checkout with no restart.
"""
from __future__ import annotations

from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, IDMixin, TimestampMixin


class PaymentGatewayConfig(Base, IDMixin, TimestampMixin):
    __tablename__ = "payment_gateway_config"

    # Active gateway: "mock" (test simulator) or "phonepe" (live).
    provider: Mapped[str] = mapped_column(String(16), default="mock", nullable=False)

    # PhonePe credentials. merchant_id / index / environment are not sensitive
    # and round-trip in the clear; the salt key is the signing secret and is
    # stored as Fernet ciphertext ("" = unset).
    phonepe_merchant_id: Mapped[str] = mapped_column(String(64), default="", nullable=False)
    phonepe_salt_key_encrypted: Mapped[str] = mapped_column(String(500), default="", nullable=False)
    phonepe_salt_index: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    phonepe_environment: Mapped[str] = mapped_column(String(16), default="sandbox", nullable=False)
