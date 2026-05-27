"""add users.phone + seed notification settings

Revision ID: j5e0f1a2b3c4
Revises: i4d9e0f1a2b3
Create Date: 2026-05-28 05:00:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "j5e0f1a2b3c4"
down_revision: Union[str, None] = "i4d9e0f1a2b3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("phone", sa.String(length=32), nullable=True))

    # Seed one row per event so the admin UI has something to toggle.
    op.execute(
        "INSERT INTO system_settings (`key`, value, category, description, is_secret) VALUES "
        "('notifications.order_paid',      'true', 'notifications', 'Email + SMS on order PAID',      0), "
        "('notifications.order_shipped',   'true', 'notifications', 'Email + SMS on order SHIPPED',   0), "
        "('notifications.order_delivered', 'true', 'notifications', 'Email on order DELIVERED',       0), "
        "('notifications.order_cancelled', 'true', 'notifications', 'Email on order CANCELLED',       0), "
        "('notifications.order_refunded',  'true', 'notifications', 'Email on order REFUNDED',        0)"
    )


def downgrade() -> None:
    op.execute("DELETE FROM system_settings WHERE category = 'notifications'")
    op.drop_column("users", "phone")
