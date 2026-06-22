"""add tracking event log to orders

Phase 6: carriers fire webhooks (or we poll) with status updates. We store
the full event stream as JSON on the order row so the customer order page
can render a "shipment timeline" without a join. A separate
`shipment_tracking_events` table would be cleaner for analytics later — not
in scope for v1, where every event is only read in the context of its order.

`last_tracking_at` is the timestamp of the newest event we've persisted.
Used both for display ("updated 2h ago") and for deciding whether a fresh
webhook is actually news.

Revision ID: o0j1k2l3m4n5
Revises: n9i0j1k2l3m4
Create Date: 2026-05-27 14:00:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "o0j1k2l3m4n5"
down_revision: Union[str, None] = "n9i0j1k2l3m4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "orders",
        sa.Column("tracking_events", sa.JSON(), nullable=True),
    )
    op.add_column(
        "orders",
        sa.Column(
            "last_tracking_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column("orders", "last_tracking_at")
    op.drop_column("orders", "tracking_events")
