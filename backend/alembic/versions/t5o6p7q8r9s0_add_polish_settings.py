"""add free-shipping threshold + login trust badges

Phase 11 polish.

  - `shipping.free_threshold`: when set > 0, prepaid/split_cod orders with
    subtotal ≥ this number ship free regardless of the carrier rate. 0
    disables the feature.

  - `login.trust_badge_N_label` / `login.trust_badge_N_icon` for N in 1..4:
    up to four configurable trust badges on the login page. Empty label
    hides that slot. Icon is one of star/shield/truck/clock/package/badge —
    frontend maps the key to a Lucide icon.

Revision ID: t5o6p7q8r9s0
Revises: s4n5o6p7q8r9
Create Date: 2026-05-28 18:00:00.000000
"""
from typing import Sequence, Union

from alembic import op


revision: str = "t5o6p7q8r9s0"
down_revision: Union[str, None] = "s4n5o6p7q8r9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


_POLISH_SETTINGS = [
    # Free shipping threshold (category: shipping). 0 = disabled.
    ("shipping.free_threshold", "999", "shipping",
     "Free shipping when cart subtotal ≥ this amount (₹). 0 disables.", 0),
    # Login trust badges (category: login). Empty label hides the slot.
    ("login.trust_badge_1_label", "5★ Rating from our customers", "login",
     "Trust badge 1 — label (leave blank to hide)", 0),
    ("login.trust_badge_1_icon", "star", "login",
     "Trust badge 1 — icon (star/shield/truck/clock/package/badge)", 0),
    ("login.trust_badge_2_label", "Secure payment gateway", "login",
     "Trust badge 2 — label (leave blank to hide)", 0),
    ("login.trust_badge_2_icon", "shield", "login",
     "Trust badge 2 — icon", 0),
    ("login.trust_badge_3_label", "Pan-India delivery", "login",
     "Trust badge 3 — label (leave blank to hide)", 0),
    ("login.trust_badge_3_icon", "truck", "login",
     "Trust badge 3 — icon", 0),
    ("login.trust_badge_4_label", "On-time delivery", "login",
     "Trust badge 4 — label (leave blank to hide)", 0),
    ("login.trust_badge_4_icon", "clock", "login",
     "Trust badge 4 — icon", 0),
]


def upgrade() -> None:
    for key, value, category, description, is_secret in _POLISH_SETTINGS:
        op.execute(
            "INSERT INTO system_settings (`key`, value, category, description, is_secret) "
            f"VALUES (:k, :v, :c, :d, {int(is_secret)})"
            .replace(":k", repr(key))
            .replace(":v", repr(value))
            .replace(":c", repr(category))
            .replace(":d", repr(description))
        )


def downgrade() -> None:
    op.execute(
        "DELETE FROM system_settings WHERE `key` IN ("
        "'shipping.free_threshold',"
        "'login.trust_badge_1_label','login.trust_badge_1_icon',"
        "'login.trust_badge_2_label','login.trust_badge_2_icon',"
        "'login.trust_badge_3_label','login.trust_badge_3_icon',"
        "'login.trust_badge_4_label','login.trust_badge_4_icon'"
        ")"
    )
