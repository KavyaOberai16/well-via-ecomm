"""add shipment metadata columns to orders

Phase 4: when we push an order to the carrier we get back an AWB number,
optionally a label URL, and (always) a timestamp. All three live on the order
row — we don't model "shipments" as a separate table yet because a single
order maps 1:1 with a single carrier shipment in v1. A multi-package /
split-shipment world would justify a `order_shipments` table; not in scope.

Index on `shipping_awb` so the tracking webhook (Phase 6) can look orders up
by AWB in O(1) without scanning the table.

Revision ID: m8h9i0j1k2l3
Revises: l7g8h9i0j1k2
Create Date: 2026-05-27 13:00:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "m8h9i0j1k2l3"
down_revision: Union[str, None] = "l7g8h9i0j1k2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "orders",
        sa.Column("shipping_provider", sa.String(length=32), nullable=True),
    )
    op.add_column(
        "orders",
        sa.Column("shipping_awb", sa.String(length=64), nullable=True),
    )
    op.add_column(
        "orders",
        sa.Column("shipping_label_url", sa.String(length=512), nullable=True),
    )
    op.add_column(
        "orders",
        sa.Column(
            "shipment_created_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )
    # Lookup-by-AWB index for the tracking webhook. Not unique because the
    # mock provider issues `MOCK<order_id>-<random>` keys — unique per provider
    # in practice, but cheaper to not enforce here.
    op.create_index("ix_orders_shipping_awb", "orders", ["shipping_awb"])


def downgrade() -> None:
    op.drop_index("ix_orders_shipping_awb", table_name="orders")
    op.drop_column("orders", "shipment_created_at")
    op.drop_column("orders", "shipping_label_url")
    op.drop_column("orders", "shipping_awb")
    op.drop_column("orders", "shipping_provider")
