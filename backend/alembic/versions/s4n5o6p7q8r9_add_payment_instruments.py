"""add payment_instrument tracking + instrument-level discounts

Phase 10 — the "Pay online" path expands into specific instruments
(UPI / Netbanking / Cards / Wallets). Each instrument can carry its
own discount (e.g. "Extra 5% off on UPI") because instrument MDR
costs differ wildly in India: UPI is ~0%, cards 1.5–2.5%. Stores
pass the savings to nudge customers toward the cheaper rails.

Schema additions:
  - `orders.payment_instrument`        — 'upi'|'netbanking'|'card'|'wallet'|null
  - `orders.payment_discount_amount`   — discount applied for instrument choice,
                                          tracked separately from coupon discount
                                          so reporting can split the two.

Settings seeded under category `payments`:
  - `payments.instruments.<name>.enabled`
  - `payments.instruments.<name>.discount_percent`
  - `payments.suggested_instrument`  — picker highlights this one

Revision ID: s4n5o6p7q8r9
Revises: r3m4n5o6p7q8
Create Date: 2026-05-28 17:00:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "s4n5o6p7q8r9"
down_revision: Union[str, None] = "r3m4n5o6p7q8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


_SETTINGS = [
    # The "Pay online" methods exposed on the picker. UPI gets a default
    # 5% discount because UPI MDR is ~0 and most Indian merchants pass
    # that saving on. Tune per store.
    ("payments.instruments.upi.enabled", "true",
     "Show UPI as a checkout option", 0),
    ("payments.instruments.upi.discount_percent", "5",
     "Discount % applied when the customer pays via UPI", 0),
    ("payments.instruments.netbanking.enabled", "true",
     "Show Netbanking as a checkout option", 0),
    ("payments.instruments.netbanking.discount_percent", "0",
     "Discount % applied when the customer pays via Netbanking", 0),
    ("payments.instruments.card.enabled", "true",
     "Show Debit/Credit cards as a checkout option", 0),
    ("payments.instruments.card.discount_percent", "0",
     "Discount % applied when the customer pays via card", 0),
    ("payments.instruments.wallet.enabled", "true",
     "Show Wallets as a checkout option", 0),
    ("payments.instruments.wallet.discount_percent", "0",
     "Discount % applied when the customer pays via wallets", 0),
    # The "Suggested" chip on the picker. Defaults to UPI — that's where
    # the 5% incentive points.
    ("payments.suggested_instrument", "upi",
     "Which instrument shows the 'Suggested' chip (upi|netbanking|card|wallet)", 0),
]


def upgrade() -> None:
    op.add_column(
        "orders",
        sa.Column("payment_instrument", sa.String(length=32), nullable=True),
    )
    op.add_column(
        "orders",
        sa.Column(
            "payment_discount_amount",
            sa.Numeric(12, 2),
            nullable=False,
            server_default="0",
        ),
    )

    for key, value, description, is_secret in _SETTINGS:
        op.execute(
            "INSERT INTO system_settings (`key`, value, category, description, is_secret) "
            f"VALUES (:k, :v, 'payments', :d, {int(is_secret)})"
            .replace(":k", repr(key))
            .replace(":v", repr(value))
            .replace(":d", repr(description))
        )


def downgrade() -> None:
    op.execute("DELETE FROM system_settings WHERE category = 'payments'")
    op.drop_column("orders", "payment_discount_amount")
    op.drop_column("orders", "payment_instrument")
