"""add earn_rules + vip_tiers + users.vip_tier_id

Revision ID: f1a6b7c8d9e0
Revises: e0f5a6b7c8d9
Create Date: 2026-05-28 01:00:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "f1a6b7c8d9e0"
down_revision: Union[str, None] = "e0f5a6b7c8d9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- Earn rules ---
    op.create_table(
        "earn_rules",
        sa.Column("id", sa.Integer(), autoincrement=True, primary_key=True),
        sa.Column("key", sa.String(length=64), nullable=False),
        sa.Column("display_name", sa.String(length=120), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column("points_value", sa.Integer(), nullable=False),
        sa.Column(
            "is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")
        ),
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
        sa.UniqueConstraint("key", name="uq_earn_rules_key"),
    )
    op.create_index(op.f("ix_earn_rules_key"), "earn_rules", ["key"], unique=False)
    op.create_index(
        op.f("ix_earn_rules_is_active"), "earn_rules", ["is_active"], unique=False
    )

    # --- VIP tiers ---
    op.create_table(
        "vip_tiers",
        sa.Column("id", sa.Integer(), autoincrement=True, primary_key=True),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("threshold_lifetime_points", sa.Integer(), nullable=False),
        sa.Column(
            "earn_multiplier",
            sa.Numeric(precision=4, scale=2),
            nullable=False,
            server_default=sa.text("1.00"),
        ),
        sa.Column("benefits", sa.String(length=500), nullable=True),
        sa.Column("color", sa.String(length=16), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default=sa.text("0")),
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
        sa.UniqueConstraint("name", name="uq_vip_tiers_name"),
    )
    op.create_index(
        op.f("ix_vip_tiers_threshold_lifetime_points"),
        "vip_tiers",
        ["threshold_lifetime_points"],
        unique=False,
    )

    # users.vip_tier_id
    op.add_column(
        "users",
        sa.Column("vip_tier_id", sa.Integer(), nullable=True),
    )
    op.create_index(op.f("ix_users_vip_tier_id"), "users", ["vip_tier_id"], unique=False)
    op.create_foreign_key(
        "fk_users_vip_tier", "users", "vip_tiers", ["vip_tier_id"], ["id"], ondelete="SET NULL"
    )

    # --- Seed defaults: earn rules (carry-over from loyalty_config) ---
    op.execute(
        "INSERT INTO earn_rules (`key`, display_name, description, points_value, is_active) VALUES "
        "('signup_bonus', 'Signup bonus', 'One-time bonus when a new customer registers.', 400, 1), "
        "('place_order', 'Place an order', 'Points per currency unit on order subtotal − discount.', 1, 1), "
        "('write_review', 'Write a review', 'Flat points for posting a product review.', 100, 1)"
    )

    # --- Seed defaults: 3 VIP tiers ---
    op.execute(
        "INSERT INTO vip_tiers (name, threshold_lifetime_points, earn_multiplier, benefits, color, sort_order) VALUES "
        "('Bronze', 0,     1.00, 'Welcome to the loyalty program.',                       '#CD7F32', 1), "
        "('Silver', 5000,  1.25, '25% bonus on every points earn. Early access to sales.', '#C0C0C0', 2), "
        "('Gold',   25000, 1.50, '50% bonus on every points earn. Priority support + free shipping perks.', '#FFD700', 3)"
    )


def downgrade() -> None:
    op.drop_constraint("fk_users_vip_tier", "users", type_="foreignkey")
    op.drop_index(op.f("ix_users_vip_tier_id"), table_name="users")
    op.drop_column("users", "vip_tier_id")

    op.drop_index(op.f("ix_vip_tiers_threshold_lifetime_points"), table_name="vip_tiers")
    op.drop_table("vip_tiers")

    op.drop_index(op.f("ix_earn_rules_is_active"), table_name="earn_rules")
    op.drop_index(op.f("ix_earn_rules_key"), table_name="earn_rules")
    op.drop_table("earn_rules")
