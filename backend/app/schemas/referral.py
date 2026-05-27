from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.referral import ReferralStatus


class ReferralBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: ReferralStatus
    # Friend's display (email obfuscated for the referrer's view, full for admin).
    referred_display: str
    created_at: datetime
    completed_at: datetime | None


class MyReferralOverview(BaseModel):
    """Payload for /loyalty/me/referral — everything the rewards page needs."""

    code: str
    share_url: str
    total: int
    completed: int
    pending: int
    referrer_reward_amount: float
    friend_welcome_amount: float
    referrer_reward_min_order: float
    friend_welcome_min_order: float


class ReferralListPage(BaseModel):
    items: list[ReferralBrief]
    total: int
    page: int
    page_size: int


class AdminReferralRow(BaseModel):
    """Admin sees both sides in full (no obfuscation)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    referrer_email: str
    referred_email: str
    code: str
    status: ReferralStatus
    completed_order_id: int | None
    created_at: datetime
    completed_at: datetime | None


class AdminReferralListPage(BaseModel):
    items: list[AdminReferralRow]
    total: int
    page: int
    page_size: int


class ExpirySummary(BaseModel):
    users_processed: int
    rows_expired: int
    points_expired: int
