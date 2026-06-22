"""add carousel upgrade columns to hero_slides

Revision ID: z1u2v3w4x5y6
Revises: y0t1u2v3w4x5
Create Date: 2026-05-30 00:00:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "z1u2v3w4x5y6"
down_revision: Union[str, None] = "y0t1u2v3w4x5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # kind and text_theme are NOT NULL — include server_default so existing
    # rows are backfilled without requiring a Python-side migration pass.
    op.add_column(
        "hero_slides",
        sa.Column(
            "kind",
            sa.String(length=16),
            nullable=False,
            server_default="photo",
        ),
    )
    op.add_column(
        "hero_slides",
        sa.Column("heading", sa.String(length=200), nullable=True),
    )
    op.add_column(
        "hero_slides",
        sa.Column("subtext", sa.String(length=400), nullable=True),
    )
    op.add_column(
        "hero_slides",
        sa.Column("badge_text", sa.String(length=80), nullable=True),
    )
    op.add_column(
        "hero_slides",
        sa.Column("cta_label", sa.String(length=80), nullable=True),
    )
    op.add_column(
        "hero_slides",
        sa.Column("cta_href", sa.String(length=512), nullable=True),
    )
    op.add_column(
        "hero_slides",
        sa.Column("countdown_end", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "hero_slides",
        sa.Column(
            "text_theme",
            sa.String(length=16),
            nullable=False,
            server_default="light",
        ),
    )


def downgrade() -> None:
    op.drop_column("hero_slides", "text_theme")
    op.drop_column("hero_slides", "countdown_end")
    op.drop_column("hero_slides", "cta_href")
    op.drop_column("hero_slides", "cta_label")
    op.drop_column("hero_slides", "badge_text")
    op.drop_column("hero_slides", "subtext")
    op.drop_column("hero_slides", "heading")
    op.drop_column("hero_slides", "kind")
