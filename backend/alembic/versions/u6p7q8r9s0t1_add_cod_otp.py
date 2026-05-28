"""require OTP for COD orders (toggle)

Phase 12 — cuts a class of RTO fraud by making the customer prove
they own the phone before a COD order is placed. The actual OTP
plumbing lives in CodOtpService + Redis; this migration just adds
the admin toggle.

Revision ID: u6p7q8r9s0t1
Revises: t5o6p7q8r9s0
Create Date: 2026-05-28 19:00:00.000000
"""
from typing import Sequence, Union

from alembic import op


revision: str = "u6p7q8r9s0t1"
down_revision: Union[str, None] = "t5o6p7q8r9s0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "INSERT INTO system_settings (`key`, value, category, description, is_secret) "
        "VALUES ("
        "'cod.require_otp', 'true', 'cod', "
        "'Require SMS OTP verification before a COD order can be placed', 0)"
    )


def downgrade() -> None:
    op.execute("DELETE FROM system_settings WHERE `key` = 'cod.require_otp'")
