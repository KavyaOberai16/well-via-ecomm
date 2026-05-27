"""add system_settings + user TOTP columns

Revision ID: h3c8d9e0f1a2
Revises: g2b7c8d9e0f1
Create Date: 2026-05-28 03:00:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "h3c8d9e0f1a2"
down_revision: Union[str, None] = "g2b7c8d9e0f1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ---- system_settings ----
    op.create_table(
        "system_settings",
        sa.Column("id", sa.Integer(), autoincrement=True, primary_key=True),
        sa.Column("key", sa.String(length=120), nullable=False),
        sa.Column("value", sa.Text(), nullable=True),
        sa.Column("category", sa.String(length=40), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column("is_secret", sa.Boolean(), nullable=False, server_default=sa.text("0")),
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
        sa.UniqueConstraint("key", name="uq_system_settings_key"),
    )
    op.create_index(
        op.f("ix_system_settings_key"), "system_settings", ["key"], unique=False
    )
    op.create_index(
        op.f("ix_system_settings_category"),
        "system_settings",
        ["category"],
        unique=False,
    )

    # Seed the schema we ship with. Values stay null/empty so the env fallback
    # remains in effect until the admin sets them from the UI.
    op.execute(
        "INSERT INTO system_settings (`key`, value, category, description, is_secret) VALUES "
        # Email
        "('email.backend',  '',  'email', 'Active backend: console | smtp', 0), "
        "('smtp.host',      '',  'email', 'SMTP host (e.g. smtp.sendgrid.net)', 0), "
        "('smtp.port',      '587','email', 'SMTP port', 0), "
        "('smtp.user',      '',  'email', 'SMTP username', 0), "
        "('smtp.password',  '',  'email', 'SMTP password', 1), "
        "('smtp.use_tls',   'true', 'email', 'Use STARTTLS', 0), "
        "('email.from',     '',  'email', 'Default From address', 0), "
        # SMS
        "('sms.backend',           'console', 'sms', 'Active backend: console | twilio', 0), "
        "('twilio.account_sid',    '',  'sms', 'Twilio Account SID', 0), "
        "('twilio.auth_token',     '',  'sms', 'Twilio Auth Token', 1), "
        "('twilio.from_number',    '',  'sms', 'Twilio From phone number (E.164)', 0), "
        # Security
        "('auth.totp_mode', 'optional', 'security', 'TOTP availability: off | optional', 0)"
    )

    # ---- users TOTP columns ----
    op.add_column(
        "users", sa.Column("totp_secret", sa.String(length=255), nullable=True)
    )
    op.add_column(
        "users",
        sa.Column(
            "totp_enabled", sa.Boolean(), nullable=False, server_default=sa.text("0")
        ),
    )
    op.add_column(
        "users", sa.Column("totp_confirmed_at", sa.DateTime(timezone=True), nullable=True)
    )
    op.add_column("users", sa.Column("backup_codes", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "backup_codes")
    op.drop_column("users", "totp_confirmed_at")
    op.drop_column("users", "totp_enabled")
    op.drop_column("users", "totp_secret")
    op.drop_index(op.f("ix_system_settings_category"), table_name="system_settings")
    op.drop_index(op.f("ix_system_settings_key"), table_name="system_settings")
    op.drop_table("system_settings")
