"""add returns + return_items tables, returns.* settings

Phase 7: customers request returns on delivered orders; admin reviews and
either rejects or approves (which schedules a reverse pickup with the
carrier). Two new tables:

  - returns         : one row per customer-initiated return request
  - return_items    : the line-item slice of the original order being returned

Plus a `returns.window_days` system setting so the merchant can tune the
allowed window without code changes.

Revision ID: p1k2l3m4n5o6
Revises: o0j1k2l3m4n5
Create Date: 2026-05-27 14:30:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "p1k2l3m4n5o6"
down_revision: Union[str, None] = "o0j1k2l3m4n5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "returns",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "order_id",
            sa.Integer(),
            sa.ForeignKey("orders.id", ondelete="RESTRICT"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="RESTRICT"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "status",
            sa.String(length=32),
            nullable=False,
            server_default="requested",
            index=True,
        ),
        sa.Column("reason", sa.String(length=64), nullable=False),
        sa.Column("customer_notes", sa.Text(), nullable=True),
        sa.Column("admin_notes", sa.Text(), nullable=True),
        sa.Column("reverse_awb", sa.String(length=64), nullable=True, index=True),
        sa.Column("reverse_pickup_id", sa.String(length=64), nullable=True),
        sa.Column("refund_amount", sa.Numeric(12, 2), nullable=True),
        sa.Column("requested_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("rejected_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("picked_up_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("received_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("refunded_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
    )

    op.create_table(
        "return_items",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "return_id",
            sa.Integer(),
            sa.ForeignKey("returns.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "order_item_id",
            sa.Integer(),
            sa.ForeignKey("order_items.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
    )

    op.execute(
        "INSERT INTO system_settings (`key`, value, category, description, is_secret) "
        "VALUES ('returns.window_days', '7', 'returns', "
        "'Days after delivery a customer may request a return', 0)"
    )


def downgrade() -> None:
    op.execute("DELETE FROM system_settings WHERE category = 'returns'")
    op.drop_table("return_items")
    op.drop_table("returns")
