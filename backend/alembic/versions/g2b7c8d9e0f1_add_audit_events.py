"""add audit_events

Revision ID: g2b7c8d9e0f1
Revises: f1a6b7c8d9e0
Create Date: 2026-05-28 02:00:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "g2b7c8d9e0f1"
down_revision: Union[str, None] = "f1a6b7c8d9e0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "audit_events",
        sa.Column("id", sa.Integer(), autoincrement=True, primary_key=True),
        sa.Column("actor_user_id", sa.Integer(), nullable=True),
        sa.Column("actor_email", sa.String(length=255), nullable=True),
        sa.Column("actor_ip", sa.String(length=64), nullable=True),
        sa.Column("action", sa.String(length=64), nullable=False),
        sa.Column("target_type", sa.String(length=32), nullable=True),
        sa.Column("target_id", sa.Integer(), nullable=True),
        sa.Column("target_label", sa.String(length=255), nullable=True),
        sa.Column("summary", sa.String(length=500), nullable=False),
        sa.Column("extra", sa.JSON(), nullable=True),
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
        sa.ForeignKeyConstraint(
            ["actor_user_id"], ["users.id"], ondelete="SET NULL"
        ),
    )
    op.create_index(
        op.f("ix_audit_events_actor_user_id"),
        "audit_events",
        ["actor_user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_audit_events_actor_email"),
        "audit_events",
        ["actor_email"],
        unique=False,
    )
    op.create_index(
        op.f("ix_audit_events_action"), "audit_events", ["action"], unique=False
    )
    op.create_index(
        op.f("ix_audit_events_target_type"),
        "audit_events",
        ["target_type"],
        unique=False,
    )
    op.create_index(
        op.f("ix_audit_events_target_id"),
        "audit_events",
        ["target_id"],
        unique=False,
    )
    # Common query is "newest first" — a composite index makes pagination cheap.
    op.create_index(
        "ix_audit_events_created_id",
        "audit_events",
        ["created_at", "id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_audit_events_created_id", table_name="audit_events")
    op.drop_index(op.f("ix_audit_events_target_id"), table_name="audit_events")
    op.drop_index(op.f("ix_audit_events_target_type"), table_name="audit_events")
    op.drop_index(op.f("ix_audit_events_action"), table_name="audit_events")
    op.drop_index(op.f("ix_audit_events_actor_email"), table_name="audit_events")
    op.drop_index(op.f("ix_audit_events_actor_user_id"), table_name="audit_events")
    op.drop_table("audit_events")
