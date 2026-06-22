"""add reviews table + product rating aggregates

Revision ID: c8d3e4f5a6b7
Revises: b7c1d2e3f4a5
Create Date: 2026-05-27 22:00:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "c8d3e4f5a6b7"
down_revision: Union[str, None] = "b7c1d2e3f4a5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "reviews",
        sa.Column("id", sa.Integer(), autoincrement=True, primary_key=True),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("author_name", sa.String(length=120), nullable=True),
        sa.Column("rating", sa.SmallInteger(), nullable=False),
        sa.Column("title", sa.String(length=160), nullable=True),
        sa.Column("body", sa.Text(), nullable=True),
        sa.Column(
            "is_verified_purchase", sa.Boolean(), nullable=False, server_default=sa.text("0")
        ),
        sa.Column(
            "is_approved", sa.Boolean(), nullable=False, server_default=sa.text("1")
        ),
        sa.Column("helpful_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.UniqueConstraint("product_id", "user_id", name="uq_reviews_product_user"),
        sa.CheckConstraint("rating BETWEEN 1 AND 5", name="ck_reviews_rating_range"),
    )
    op.create_index(op.f("ix_reviews_product_id"), "reviews", ["product_id"], unique=False)
    op.create_index(op.f("ix_reviews_user_id"), "reviews", ["user_id"], unique=False)
    op.create_index(op.f("ix_reviews_is_approved"), "reviews", ["is_approved"], unique=False)

    # Denormalized aggregates on products. Backfilled with zeros — the service
    # recomputes them whenever a review lands.
    op.add_column(
        "products",
        sa.Column(
            "rating_avg",
            sa.Numeric(precision=3, scale=2),
            nullable=False,
            server_default=sa.text("0"),
        ),
    )
    op.add_column(
        "products",
        sa.Column(
            "rating_count", sa.Integer(), nullable=False, server_default=sa.text("0")
        ),
    )
    op.add_column(
        "products",
        sa.Column("rating_distribution", sa.JSON(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("products", "rating_distribution")
    op.drop_column("products", "rating_count")
    op.drop_column("products", "rating_avg")
    op.drop_index(op.f("ix_reviews_is_approved"), table_name="reviews")
    op.drop_index(op.f("ix_reviews_user_id"), table_name="reviews")
    op.drop_index(op.f("ix_reviews_product_id"), table_name="reviews")
    op.drop_table("reviews")
