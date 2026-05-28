"""add Split COD settings

Phase 9 — Split COD: customer pays a small portion online (lowering RTO
risk because they have skin in the game) and the balance on delivery.

No new columns — `orders.cod_balance` already captures "amount the carrier
collects on delivery"; for Split COD that's `total - prepaid_portion`,
which is computed at checkout. Only the two new settings ship here:

  - cod.split_enabled         : show Split COD as a third payment method
  - cod.split_prepaid_amount  : flat ₹ collected via the gateway upfront

A `split_prepaid_amount` of 0 (or >= cart total) makes Split COD degenerate
into either full COD or full prepaid — in either case the service hides
the option from the checkout picker so the customer never sees a no-op.

Revision ID: r3m4n5o6p7q8
Revises: q2l3m4n5o6p7
Create Date: 2026-05-28 16:00:00.000000
"""
from typing import Sequence, Union

from alembic import op


revision: str = "r3m4n5o6p7q8"
down_revision: Union[str, None] = "q2l3m4n5o6p7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


_SPLIT_SETTINGS = [
    ("cod.split_enabled", "false",
     "Offer Split COD (partial prepaid, balance on delivery)", 0),
    ("cod.split_prepaid_amount", "100",
     "Flat ₹ collected upfront via the gateway for Split COD", 0),
]


def upgrade() -> None:
    for key, value, description, is_secret in _SPLIT_SETTINGS:
        op.execute(
            "INSERT INTO system_settings (`key`, value, category, description, is_secret) "
            f"VALUES (:k, :v, 'cod', :d, {int(is_secret)})"
            .replace(":k", repr(key))
            .replace(":v", repr(value))
            .replace(":d", repr(description))
        )


def downgrade() -> None:
    op.execute(
        "DELETE FROM system_settings WHERE `key` IN "
        "('cod.split_enabled', 'cod.split_prepaid_amount')"
    )
