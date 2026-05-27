"""Hardcoded loyalty rules. v3 will move these to a database table so admins
can tune values from the UI. For now the defaults live here and are read at
call time so a code change takes effect on the next request without a data
migration."""
from decimal import Decimal


# One-time bonus for new account registration.
SIGNUP_BONUS = 400

# Points awarded per currency unit of the order subtotal (pre-tax, post-discount
# — i.e. the `subtotal - discount_amount` slice on the Order). Round down.
POINTS_PER_CURRENCY_UNIT = Decimal("1")

# Points for posting a product review. Photo/video bonuses are v3 territory.
REVIEW_POINTS = 100

# Earn rows older than this become candidates for the expiry job.
POINTS_EXPIRY_DAYS = 365

# Referral program — both sides receive a coupon. Friend gets theirs on signup;
# referrer gets theirs when the friend's first order moves to PAID.
FRIEND_WELCOME_DISCOUNT_AMOUNT = Decimal("100")  # ₹100 off
FRIEND_WELCOME_MIN_ORDER = Decimal("500")
FRIEND_WELCOME_COUPON_PREFIX = "WELCOME"
FRIEND_WELCOME_VALID_DAYS = 60

REFERRER_REWARD_DISCOUNT_AMOUNT = Decimal("100")  # ₹100 off
REFERRER_REWARD_MIN_ORDER = Decimal("500")
REFERRER_REWARD_COUPON_PREFIX = "REF"
REFERRER_REWARD_VALID_DAYS = 60
