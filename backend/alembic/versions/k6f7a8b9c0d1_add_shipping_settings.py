"""seed shipping.* system settings

Phase 1 of the shipping integration — no schema change yet, just the rows
that drive the admin "Shipping" tab. Subsequent phases will add the
`orders.shipping_*` columns when they need them, so the data model evolves
alongside the feature.

Revision ID: k6f7a8b9c0d1
Revises: j5e0f1a2b3c4
Create Date: 2026-05-27 12:00:00.000000
"""
from typing import Sequence, Union

from alembic import op


revision: str = "k6f7a8b9c0d1"
down_revision: Union[str, None] = "j5e0f1a2b3c4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# (key, value, description, is_secret)
_SEED = [
    # Provider selection — `none` until an admin picks one. `mock` is the
    # built-in dev backend; `delhivery` requires credentials below.
    ("shipping.provider", "none",
     "Shipping carrier: none, mock, or delhivery", 0),
    ("shipping.environment", "staging",
     "Carrier environment: staging or production", 0),

    # Delhivery credentials (secrets masked in the admin list response).
    ("shipping.delhivery.api_token", "",
     "Delhivery API token (Authorization: Token <value>)", 1),
    ("shipping.delhivery.client_name", "",
     "Delhivery client name (provided by Delhivery on onboarding)", 0),

    # Single warehouse — pickup origin. Must match the warehouse name
    # registered in your Delhivery portal exactly.
    ("shipping.warehouse.name", "",
     "Pickup warehouse name (must match Delhivery registration)", 0),
    ("shipping.warehouse.pincode", "",
     "Pickup warehouse pincode (used for rate quoting)", 0),
    ("shipping.warehouse.address", "",
     "Pickup warehouse street address (used on shipping labels)", 0),

    # Behavior toggles.
    ("shipping.auto_create_on_paid", "false",
     "Push shipment to carrier automatically when an order goes PAID", 0),
    ("shipping.serviceability_cache_minutes", "60",
     "Minutes to cache pincode serviceability lookups in Redis", 0),

    # Shared secret we expect on the carrier's webhook (as ?token=<value>).
    ("shipping.webhook_secret", "",
     "Shared secret expected on inbound tracking webhooks", 1),
]


def upgrade() -> None:
    # Insert one row at a time so we can keep is_secret accurate without
    # fragile escaping. IGNORE-style guard via a SELECT would be safer if the
    # migration is ever re-run on a partially-seeded DB; for now this matches
    # the pattern used by the notifications seed.
    for key, value, description, is_secret in _SEED:
        op.execute(
            "INSERT INTO system_settings (`key`, value, category, description, is_secret) "
            f"VALUES (:k, :v, 'shipping', :d, {int(is_secret)})"
            .replace(":k", repr(key))
            .replace(":v", repr(value))
            .replace(":d", repr(description))
        )


def downgrade() -> None:
    op.execute("DELETE FROM system_settings WHERE category = 'shipping'")
