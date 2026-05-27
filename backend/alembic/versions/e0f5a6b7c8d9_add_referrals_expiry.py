"""add referrals + users.referral_code + points_transactions.expires_at

Revision ID: e0f5a6b7c8d9
Revises: d9e4f5a6b7c8
Create Date: 2026-05-28 00:00:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "e0f5a6b7c8d9"
down_revision: Union[str, None] = "d9e4f5a6b7c8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Per-user shareable referral code. Nullable because we mint it lazily on
    # first request — accounts created before referrals shipped don't have one.
    op.add_column(
        "users", sa.Column("referral_code", sa.String(length=32), nullable=True)
    )
    op.create_index(
        op.f("ix_users_referral_code"), "users", ["referral_code"], unique=True
    )

    # Referrals — one row per (referrer → friend) pairing.
    op.create_table(
        "referrals",
        sa.Column("id", sa.Integer(), autoincrement=True, primary_key=True),
        sa.Column("referrer_user_id", sa.Integer(), nullable=False),
        sa.Column("referred_user_id", sa.Integer(), nullable=False),
        sa.Column("code", sa.String(length=32), nullable=False),
        sa.Column(
            "status",
            sa.Enum("PENDING", "COMPLETED", name="referralstatus"),
            nullable=False,
            server_default="PENDING",
        ),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_order_id", sa.Integer(), nullable=True),
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
        sa.ForeignKeyConstraint(["referrer_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["referred_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["completed_order_id"], ["orders.id"], ondelete="SET NULL"
        ),
        sa.UniqueConstraint("referred_user_id", name="uq_referrals_referred_user"),
    )
    op.create_index(
        op.f("ix_referrals_referrer_user_id"),
        "referrals",
        ["referrer_user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_referrals_referred_user_id"),
        "referrals",
        ["referred_user_id"],
        unique=False,
    )
    op.create_index(op.f("ix_referrals_code"), "referrals", ["code"], unique=False)
    op.create_index(
        op.f("ix_referrals_status"), "referrals", ["status"], unique=False
    )

    # Expiry timestamp on earn rows. Existing rows: leave null (won't expire);
    # the engine starts dating new earns 365 days out.
    op.add_column(
        "points_transactions",
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        op.f("ix_points_transactions_expires_at"),
        "points_transactions",
        ["expires_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_points_transactions_expires_at"), table_name="points_transactions"
    )
    op.drop_column("points_transactions", "expires_at")

    op.drop_index(op.f("ix_referrals_status"), table_name="referrals")
    op.drop_index(op.f("ix_referrals_code"), table_name="referrals")
    op.drop_index(op.f("ix_referrals_referred_user_id"), table_name="referrals")
    op.drop_index(op.f("ix_referrals_referrer_user_id"), table_name="referrals")
    op.drop_table("referrals")
    op.execute("DROP TYPE IF EXISTS referralstatus")

    op.drop_index(op.f("ix_users_referral_code"), table_name="users")
    op.drop_column("users", "referral_code")
