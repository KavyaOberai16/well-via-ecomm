"""add shipping amount + pincode to orders, weight_grams to products

Phase 3 of shipping. We need:
  - `products.weight_grams` — input for rate quoting. Nullable because most
    catalogs don't track weight until they need to ship.
  - `orders.shipping_amount` — the dispatch cost we charge the customer.
    NOT NULL DEFAULT 0 so legacy orders read as "free shipping" without a
    backfill (their total was already computed without a shipping line).
  - `orders.shipping_pincode` — denormalized destination pin pulled out of the
    free-text shipping_address. Lets phase 4 / 6 (shipment + tracking) work
    without re-parsing the address.

Revision ID: l7g8h9i0j1k2
Revises: k6f7a8b9c0d1
Create Date: 2026-05-27 12:30:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "l7g8h9i0j1k2"
down_revision: Union[str, None] = "k6f7a8b9c0d1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "products",
        sa.Column("weight_grams", sa.Integer(), nullable=True),
    )
    op.add_column(
        "orders",
        sa.Column(
            "shipping_amount",
            sa.Numeric(12, 2),
            nullable=False,
            server_default="0",
        ),
    )
    op.add_column(
        "orders",
        sa.Column("shipping_pincode", sa.String(length=20), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("orders", "shipping_pincode")
    op.drop_column("orders", "shipping_amount")
    op.drop_column("products", "weight_grams")
