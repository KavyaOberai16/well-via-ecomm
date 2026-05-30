"""add PhonePe gateway settings (provider + credentials in the DB)

Moves the payment-gateway configuration out of `.env` and into
`system_settings` so an admin can pick the provider and paste PhonePe
credentials from the Settings → Payments panel — mirroring how shipping
already stores its provider + Delhivery creds.

The payments factory (`get_payment_provider(db)`) reads these at request
time, so flipping `payments.provider` from `mock` to `phonepe` takes effect
on the next checkout with no restart.

Settings seeded under category `payments`:
  - `payments.provider`              — 'mock' | 'phonepe'
  - `payments.phonepe.merchant_id`   — PhonePe merchant id
  - `payments.phonepe.salt_key`      — signing secret (is_secret=1, masked)
  - `payments.phonepe.salt_index`    — '1' | '2'
  - `payments.phonepe.environment`   — 'sandbox' | 'production'

The redirect/webhook URLs deliberately stay in `.env` — they're
deployment-specific (localhost vs the live domain), not business config.

Revision ID: v7q8r9s0t1u2
Revises: u6p7q8r9s0t1
Create Date: 2026-05-30 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op


revision: str = "v7q8r9s0t1u2"
down_revision: Union[str, None] = "u6p7q8r9s0t1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


_SETTINGS = [
    # Which gateway is live. 'mock' keeps the store demoable with no creds;
    # 'phonepe' routes real checkouts through PhonePe Standard Checkout.
    ("payments.provider", "mock",
     "Payment gateway: 'mock' (test) or 'phonepe' (live)", 0),
    # PhonePe credentials. Only salt_key is a secret — merchant_id and the
    # index/environment are not sensitive and stay readable in the panel.
    ("payments.phonepe.merchant_id", "",
     "PhonePe merchant ID (from the PhonePe dashboard)", 0),
    ("payments.phonepe.salt_key", "",
     "PhonePe salt key — the signing secret for X-VERIFY", 1),
    ("payments.phonepe.salt_index", "1",
     "PhonePe salt index (usually 1, sometimes 2)", 0),
    ("payments.phonepe.environment", "sandbox",
     "PhonePe environment: 'sandbox' (pre-prod) or 'production'", 0),
]


def upgrade() -> None:
    for key, value, description, is_secret in _SETTINGS:
        op.execute(
            "INSERT INTO system_settings (`key`, value, category, description, is_secret) "
            f"VALUES (:k, :v, 'payments', :d, {int(is_secret)})"
            .replace(":k", repr(key))
            .replace(":v", repr(value))
            .replace(":d", repr(description))
        )


def downgrade() -> None:
    keys = ", ".join(repr(key) for key, *_ in _SETTINGS)
    op.execute(f"DELETE FROM system_settings WHERE `key` IN ({keys})")
