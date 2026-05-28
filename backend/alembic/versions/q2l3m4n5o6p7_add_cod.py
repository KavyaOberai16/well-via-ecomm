"""add COD (cash on delivery) — order + product columns, cod.* settings

Phase 8 of the shipping initiative. COD adds a payment-method dimension
to orders + a per-product "cannot be COD" flag + global rules in settings.

Schema notes:
  - `orders.payment_method`  : 'prepaid' (default), 'cod', or future 'split_cod'.
    Implemented as a varchar rather than an enum so adding methods later
    doesn't require an ALTER TYPE.
  - `orders.cod_surcharge_amount` : flat fee added at checkout when COD.
  - `orders.cod_balance` : what the carrier collects on delivery.
    For prepaid orders this is always 0; for full COD it equals total.

Revision ID: q2l3m4n5o6p7
Revises: p1k2l3m4n5o6
Create Date: 2026-05-28 14:30:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "q2l3m4n5o6p7"
down_revision: Union[str, None] = "p1k2l3m4n5o6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


_COD_SETTINGS = [
    # Master switch. When off, the COD path is unavailable regardless of
    # other rules — handy for emergency disable.
    ("cod.enabled", "true",
     "Allow Cash on Delivery as a checkout option", 0),
    # Flat surcharge added on top of the order total when COD is chosen.
    # Percent surcharge intentionally excluded in v1 (decision: keep math
    # simple, no rounding surprises).
    ("cod.flat_surcharge", "40",
     "Flat fee in INR added when the customer picks COD", 0),
    # Order-total bounds. Below min, COD doesn't make sense (we'd pay more
    # in surcharges than we'd net); above max, RTO risk gets steep.
    ("cod.min_order_total", "199",
     "Disallow COD for orders below this subtotal", 0),
    ("cod.max_order_total", "5000",
     "Disallow COD for orders above this subtotal (RTO risk)", 0),
    # Behavior toggles. 'First time customer' = no prior PAID/SHIPPED/
    # DELIVERED orders. 'RTO history' = any refunded return on the account.
    ("cod.block_first_time_customer", "false",
     "Disallow COD on a customer's very first order", 0),
    ("cod.block_rto_customers", "false",
     "Disallow COD for customers with prior refunded returns", 0),
]


def upgrade() -> None:
    op.add_column(
        "orders",
        sa.Column(
            "payment_method",
            sa.String(length=32),
            nullable=False,
            server_default="prepaid",
        ),
    )
    op.add_column(
        "orders",
        sa.Column(
            "cod_surcharge_amount",
            sa.Numeric(12, 2),
            nullable=False,
            server_default="0",
        ),
    )
    op.add_column(
        "orders",
        sa.Column(
            "cod_balance",
            sa.Numeric(12, 2),
            nullable=False,
            server_default="0",
        ),
    )
    op.add_column(
        "products",
        sa.Column(
            "cod_blocked",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("0"),
        ),
    )

    for key, value, description, is_secret in _COD_SETTINGS:
        op.execute(
            "INSERT INTO system_settings (`key`, value, category, description, is_secret) "
            f"VALUES (:k, :v, 'cod', :d, {int(is_secret)})"
            .replace(":k", repr(key))
            .replace(":v", repr(value))
            .replace(":d", repr(description))
        )


def downgrade() -> None:
    op.execute("DELETE FROM system_settings WHERE category = 'cod'")
    op.drop_column("products", "cod_blocked")
    op.drop_column("orders", "cod_balance")
    op.drop_column("orders", "cod_surcharge_amount")
    op.drop_column("orders", "payment_method")
