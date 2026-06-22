"""add loyalty: points_transactions, redemption_tiers, user balances, coupon flag

Revision ID: d9e4f5a6b7c8
Revises: c8d3e4f5a6b7
Create Date: 2026-05-27 23:00:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "d9e4f5a6b7c8"
down_revision: Union[str, None] = "c8d3e4f5a6b7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # The ledger.
    op.create_table(
        "points_transactions",
        sa.Column("id", sa.Integer(), autoincrement=True, primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("delta", sa.Integer(), nullable=False),
        sa.Column(
            "reason",
            sa.Enum(
                "SIGNUP_BONUS",
                "PLACE_ORDER",
                "WRITE_REVIEW",
                "REDEEM",
                "REFUND_REVERSAL",
                "EXPIRY",
                "ADMIN_ADJUST",
                name="pointsreason",
            ),
            nullable=False,
        ),
        sa.Column("ref_type", sa.String(length=32), nullable=True),
        sa.Column("ref_id", sa.Integer(), nullable=True),
        sa.Column("description", sa.String(length=255), nullable=True),
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
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index(
        op.f("ix_points_transactions_user_id"),
        "points_transactions",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_points_transactions_reason"),
        "points_transactions",
        ["reason"],
        unique=False,
    )
    # Idempotency: events with the same (reason, ref_type, ref_id) cannot
    # double-fire. NULLs are treated as distinct in MySQL, which is what we
    # want for admin adjustments.
    op.create_index(
        "ux_points_tx_idempotency",
        "points_transactions",
        ["reason", "ref_type", "ref_id"],
        unique=True,
    )
    op.create_index(
        "ix_points_tx_user_created",
        "points_transactions",
        ["user_id", "created_at"],
        unique=False,
    )

    # Configurable redemption tiers.
    op.create_table(
        "redemption_tiers",
        sa.Column("id", sa.Integer(), autoincrement=True, primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("cost_points", sa.Integer(), nullable=False),
        sa.Column("discount_type", sa.String(length=16), nullable=False),
        sa.Column("discount_value", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("max_discount", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column(
            "expires_after_days", sa.Integer(), nullable=False, server_default=sa.text("30")
        ),
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
    )
    op.create_index(
        op.f("ix_redemption_tiers_cost_points"),
        "redemption_tiers",
        ["cost_points"],
        unique=False,
    )
    op.create_index(
        op.f("ix_redemption_tiers_is_active"),
        "redemption_tiers",
        ["is_active"],
        unique=False,
    )

    # Denormalized totals on users.
    op.add_column(
        "users",
        sa.Column(
            "points_balance", sa.Integer(), nullable=False, server_default=sa.text("0")
        ),
    )
    op.add_column(
        "users",
        sa.Column(
            "lifetime_points", sa.Integer(), nullable=False, server_default=sa.text("0")
        ),
    )

    # Flag so admin coupon list can filter out auto-issued loyalty coupons.
    op.add_column(
        "coupons",
        sa.Column(
            "is_loyalty_reward",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("0"),
        ),
    )
    op.create_index(
        op.f("ix_coupons_is_loyalty_reward"),
        "coupons",
        ["is_loyalty_reward"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_coupons_is_loyalty_reward"), table_name="coupons")
    op.drop_column("coupons", "is_loyalty_reward")
    op.drop_column("users", "lifetime_points")
    op.drop_column("users", "points_balance")

    op.drop_index(op.f("ix_redemption_tiers_is_active"), table_name="redemption_tiers")
    op.drop_index(op.f("ix_redemption_tiers_cost_points"), table_name="redemption_tiers")
    op.drop_table("redemption_tiers")

    op.drop_index("ix_points_tx_user_created", table_name="points_transactions")
    op.drop_index("ux_points_tx_idempotency", table_name="points_transactions")
    op.drop_index(op.f("ix_points_transactions_reason"), table_name="points_transactions")
    op.drop_index(op.f("ix_points_transactions_user_id"), table_name="points_transactions")
    op.drop_table("points_transactions")
    op.execute("DROP TYPE IF EXISTS pointsreason")
