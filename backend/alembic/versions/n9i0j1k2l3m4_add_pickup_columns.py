"""add pickup scheduling columns to orders

Phase 5: once a shipment has an AWB, the next step is asking the carrier to
come collect the package. Delhivery's pickup endpoint returns a pickup
reference id; we persist it (+ the scheduled date) so the admin UI can show
"Pickup scheduled for Friday" and so we can refuse double-scheduling.

Revision ID: n9i0j1k2l3m4
Revises: m8h9i0j1k2l3
Create Date: 2026-05-27 13:30:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "n9i0j1k2l3m4"
down_revision: Union[str, None] = "m8h9i0j1k2l3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "orders",
        sa.Column("pickup_id", sa.String(length=64), nullable=True),
    )
    op.add_column(
        "orders",
        sa.Column(
            "pickup_scheduled_for", sa.DateTime(timezone=True), nullable=True
        ),
    )


def downgrade() -> None:
    op.drop_column("orders", "pickup_scheduled_for")
    op.drop_column("orders", "pickup_id")
