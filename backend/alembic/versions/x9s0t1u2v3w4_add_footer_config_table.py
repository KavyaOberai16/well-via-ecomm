"""add footer_config table for storefront footer JSON document

Revision ID: x9s0t1u2v3w4
Revises: w8r9s0t1u2v3
Create Date: 2026-05-30 00:00:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "x9s0t1u2v3w4"
down_revision: Union[str, None] = "w8r9s0t1u2v3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "footer_config",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        # MySQL 8.0 does not allow server_default on JSON columns (error 1101).
        # The ORM model's `default=dict` fires in Python on every INSERT, so
        # an application-level default is sufficient. Raw SQL inserts must
        # supply the value explicitly.
        sa.Column("data", sa.JSON(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_table("footer_config")
