"""add order fulfillment columns (tracking, status timestamps, notes)

Revision ID: i4d9e0f1a2b3
Revises: h3c8d9e0f1a2
Create Date: 2026-05-28 04:00:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "i4d9e0f1a2b3"
down_revision: Union[str, None] = "h3c8d9e0f1a2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "orders", sa.Column("tracking_number", sa.String(length=120), nullable=True)
    )
    op.add_column("orders", sa.Column("carrier", sa.String(length=60), nullable=True))
    op.add_column(
        "orders", sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True)
    )
    op.add_column(
        "orders", sa.Column("shipped_at", sa.DateTime(timezone=True), nullable=True)
    )
    op.add_column(
        "orders", sa.Column("delivered_at", sa.DateTime(timezone=True), nullable=True)
    )
    op.add_column(
        "orders", sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True)
    )
    op.add_column(
        "orders", sa.Column("refunded_at", sa.DateTime(timezone=True), nullable=True)
    )
    op.add_column(
        "orders", sa.Column("refund_reason", sa.String(length=255), nullable=True)
    )
    op.add_column("orders", sa.Column("internal_notes", sa.Text(), nullable=True))


def downgrade() -> None:
    for col in (
        "internal_notes",
        "refund_reason",
        "refunded_at",
        "cancelled_at",
        "delivered_at",
        "shipped_at",
        "paid_at",
        "carrier",
        "tracking_number",
    ):
        op.drop_column("orders", col)
