"""move PhonePe gateway config from system_settings into its own table

Replaces the 5 flat `payments.*` rows in `system_settings` with a dedicated,
strongly-typed `payment_gateway_config` table (one row, named columns). The
salt key column holds Fernet ciphertext; it starts blank (the key was never
set in system_settings, so nothing is lost — the admin re-enters it once in
the new Payment Gateway screen, where it's encrypted on save).

Revision ID: w8r9s0t1u2v3
Revises: v7q8r9s0t1u2
Create Date: 2026-05-30 00:30:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "w8r9s0t1u2v3"
down_revision: Union[str, None] = "v7q8r9s0t1u2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# The 5 keys this migration absorbs out of system_settings.
_OLD_KEYS = [
    "payments.provider",
    "payments.phonepe.merchant_id",
    "payments.phonepe.salt_key",
    "payments.phonepe.salt_index",
    "payments.phonepe.environment",
]


def upgrade() -> None:
    op.create_table(
        "payment_gateway_config",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("provider", sa.String(length=16), nullable=False, server_default="mock"),
        sa.Column("phonepe_merchant_id", sa.String(length=64), nullable=False, server_default=""),
        sa.Column(
            "phonepe_salt_key_encrypted",
            sa.String(length=500),
            nullable=False,
            server_default="",
        ),
        sa.Column("phonepe_salt_index", sa.Integer(), nullable=False, server_default="1"),
        sa.Column(
            "phonepe_environment", sa.String(length=16), nullable=False, server_default="sandbox"
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    # Carry the current values over. The salt key was blank in system_settings,
    # so the encrypted column stays "" (unset).
    bind = op.get_bind()
    rows = bind.execute(
        sa.text(
            "SELECT `key`, value FROM system_settings WHERE `key` IN :keys"
        ).bindparams(sa.bindparam("keys", expanding=True)),
        {"keys": _OLD_KEYS},
    ).fetchall()
    current = {k: (v or "") for k, v in rows}

    def _int(val: str, default: int) -> int:
        try:
            return int(val)
        except (TypeError, ValueError):
            return default

    bind.execute(
        sa.text(
            "INSERT INTO payment_gateway_config "
            "(provider, phonepe_merchant_id, phonepe_salt_key_encrypted, "
            " phonepe_salt_index, phonepe_environment) "
            "VALUES (:provider, :merchant_id, '', :salt_index, :environment)"
        ),
        {
            "provider": current.get("payments.provider") or "mock",
            "merchant_id": current.get("payments.phonepe.merchant_id") or "",
            "salt_index": _int(current.get("payments.phonepe.salt_index"), 1),
            "environment": current.get("payments.phonepe.environment") or "sandbox",
        },
    )

    keys_sql = ", ".join(repr(k) for k in _OLD_KEYS)
    op.execute(f"DELETE FROM system_settings WHERE `key` IN ({keys_sql})")


def downgrade() -> None:
    # Restore the 5 system_settings rows from the table's single row, then drop
    # the table. The salt key returns blank (the encrypted form isn't reversible
    # into the old plaintext column, and it was blank originally anyway).
    bind = op.get_bind()
    row = bind.execute(
        sa.text(
            "SELECT provider, phonepe_merchant_id, phonepe_salt_index, phonepe_environment "
            "FROM payment_gateway_config ORDER BY id LIMIT 1"
        )
    ).fetchone()
    provider, merchant_id, salt_index, environment = row or ("mock", "", 1, "sandbox")

    seed = [
        ("payments.provider", provider or "mock",
         "Payment gateway: 'mock' (test) or 'phonepe' (live)", 0),
        ("payments.phonepe.merchant_id", merchant_id or "",
         "PhonePe merchant ID (from the PhonePe dashboard)", 0),
        ("payments.phonepe.salt_key", "",
         "PhonePe salt key — the signing secret for X-VERIFY", 1),
        ("payments.phonepe.salt_index", str(salt_index or 1),
         "PhonePe salt index (usually 1, sometimes 2)", 0),
        ("payments.phonepe.environment", environment or "sandbox",
         "PhonePe environment: 'sandbox' (pre-prod) or 'production'", 0),
    ]
    for key, value, description, is_secret in seed:
        bind.execute(
            sa.text(
                "INSERT INTO system_settings (`key`, value, category, description, is_secret) "
                "VALUES (:k, :v, 'payments', :d, :s)"
            ),
            {"k": key, "v": value, "d": description, "s": is_secret},
        )

    op.drop_table("payment_gateway_config")
