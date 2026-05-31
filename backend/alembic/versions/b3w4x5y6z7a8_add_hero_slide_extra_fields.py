"""add eyebrow, secondary CTA, countdown label and perks to hero_slides

Revision ID: b3w4x5y6z7a8
Revises: a2v3w4x5y6z7
Create Date: 2026-05-31 00:00:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b3w4x5y6z7a8"
down_revision: Union[str, None] = "a2v3w4x5y6z7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # All nullable — existing rows get NULL, which the storefront treats as
    # "use the built-in default" so the current look is preserved.
    op.add_column("hero_slides", sa.Column("eyebrow", sa.String(length=120), nullable=True))
    op.add_column("hero_slides", sa.Column("cta2_label", sa.String(length=80), nullable=True))
    op.add_column("hero_slides", sa.Column("cta2_href", sa.String(length=512), nullable=True))
    op.add_column(
        "hero_slides", sa.Column("countdown_label", sa.String(length=80), nullable=True)
    )
    op.add_column("hero_slides", sa.Column("perks", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("hero_slides", "perks")
    op.drop_column("hero_slides", "countdown_label")
    op.drop_column("hero_slides", "cta2_href")
    op.drop_column("hero_slides", "cta2_label")
    op.drop_column("hero_slides", "eyebrow")
