"""add image_url column to categories table

Revision ID: y0t1u2v3w4x5
Revises: x9s0t1u2v3w4
Create Date: 2026-05-30 00:00:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "y0t1u2v3w4x5"
down_revision: Union[str, None] = "x9s0t1u2v3w4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "categories",
        sa.Column("image_url", sa.String(length=512), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("categories", "image_url")
