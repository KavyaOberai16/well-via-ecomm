"""Loyalty endpoints.

Three audiences:
  - User (signed in):  GET /loyalty/me, GET /loyalty/tiers, POST /loyalty/redeem
  - Admin:             GET /loyalty/admin/users/{id}, POST /.../adjust,
                       full tier CRUD
"""
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from fastapi import Request

from app.api.deps import get_current_user, get_db, require_permission
from app.core.config import settings
from app.core.exceptions import NotFoundError
from app.core.rate_limit import get_client_ip
from app.models.referral import ReferralStatus
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.loyalty import (
    AdminAdjustRequest,
    AdminUserLoyaltyRead,
    EarnRuleRead,
    EarnRuleUpdate,
    LoyaltySummary,
    PointsTransactionRead,
    RedeemRequest,
    RedeemResponse,
    RedemptionTierCreate,
    RedemptionTierRead,
    RedemptionTierUpdate,
    TierProgress,
    TransactionListPage,
    VipTierCreate,
    VipTierRead,
    VipTierUpdate,
)
from app.schemas.referral import (
    AdminReferralListPage,
    AdminReferralRow,
    ExpirySummary,
    MyReferralOverview,
    ReferralBrief,
    ReferralListPage,
)
from app.services import loyalty_config
from app.services.audit_service import AuditService
from app.services.loyalty_service import LoyaltyService
from app.services.referral_service import ReferralService


def _obfuscate_email(email: str | None) -> str:
    if not email:
        return "—"
    local, _, domain = email.partition("@")
    if len(local) <= 2:
        return f"{local[:1]}***@{domain}"
    return f"{local[:2]}***@{domain}"

router = APIRouter()


# ---- User-facing ----


@router.get("/me", response_model=LoyaltySummary)
def my_loyalty(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    svc = LoyaltyService(db)
    tiers = svc.list_tiers(active_only=True)
    recent, _ = svc.list_transactions(user.id, offset=0, limit=10)

    # Tier progress. If the user has never crossed the lowest threshold the
    # current tier is null. If they're already in the top tier the next is null.
    lifetime = user.lifetime_points or 0
    current = svc.vip_repo.find_for_points(lifetime)
    nxt = (
        svc.vip_repo.find_next(current.threshold_lifetime_points)
        if current
        else svc.vip_repo.find_for_points(0)
    )
    progress = TierProgress(
        current=VipTierRead.model_validate(current) if current else None,
        next=VipTierRead.model_validate(nxt) if nxt else None,
    )
    if nxt:
        floor = current.threshold_lifetime_points if current else 0
        span = nxt.threshold_lifetime_points - floor
        progress.points_to_next = max(0, nxt.threshold_lifetime_points - lifetime)
        progress.progress_pct = (
            min(100, int(((lifetime - floor) / span) * 100)) if span > 0 else 100
        )

    return LoyaltySummary(
        balance=user.points_balance or 0,
        lifetime=lifetime,
        tiers=[RedemptionTierRead.model_validate(t) for t in tiers],
        recent=[PointsTransactionRead.model_validate(t) for t in recent],
        tier_progress=progress,
    )


@router.get("/me/transactions", response_model=TransactionListPage)
def my_transactions(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    offset = (page - 1) * page_size
    items, total = LoyaltyService(db).list_transactions(
        user.id, offset=offset, limit=page_size
    )
    return TransactionListPage(
        items=[PointsTransactionRead.model_validate(t) for t in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/tiers", response_model=list[RedemptionTierRead])
def list_active_tiers(db: Session = Depends(get_db)):
    """Public — used by the storefront's rewards page."""
    return LoyaltyService(db).list_tiers(active_only=True)


@router.post("/redeem", response_model=RedeemResponse, status_code=status.HTTP_201_CREATED)
def redeem(
    payload: RedeemRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    coupon = LoyaltyService(db).redeem(user, payload.tier_id)
    # Re-fetch the user inside the same transaction so the response reflects
    # the new balance after the debit.
    fresh = UserRepository(db).get(user.id)
    return RedeemResponse(
        coupon_code=coupon.code,
        discount_type=coupon.discount_type.value if hasattr(coupon.discount_type, "value") else str(coupon.discount_type),
        discount_value=coupon.discount_value,
        expires_at=coupon.expires_at,
        new_balance=(fresh.points_balance if fresh else 0),
    )


# ---- Admin ----


@router.get(
    "/admin/users/{user_id}",
    response_model=AdminUserLoyaltyRead,
    dependencies=[Depends(require_permission("loyalty.view"))],
)
def admin_user_loyalty(user_id: int, db: Session = Depends(get_db)):
    target = UserRepository(db).get(user_id)
    if not target:
        raise NotFoundError("User not found")
    items, _total = LoyaltyService(db).list_transactions(user_id, offset=0, limit=100)
    return AdminUserLoyaltyRead(
        user_id=target.id,
        email=target.email,
        full_name=target.full_name,
        balance=target.points_balance or 0,
        lifetime=target.lifetime_points or 0,
        transactions=[PointsTransactionRead.model_validate(t) for t in items],
    )


@router.post(
    "/admin/users/{user_id}/adjust",
    response_model=AdminUserLoyaltyRead,
)
def admin_adjust(
    user_id: int,
    payload: AdminAdjustRequest,
    request: Request,
    admin: User = Depends(require_permission("loyalty.adjust")),
    db: Session = Depends(get_db),
):
    target = UserRepository(db).get(user_id)
    if not target:
        raise NotFoundError("User not found")

    LoyaltyService(db).admin_adjust(admin, user_id, payload.delta, payload.description)
    AuditService(db).record(
        actor=admin,
        actor_ip=get_client_ip(request),
        action="loyalty.adjust",
        target_type="user",
        target_id=user_id,
        target_label=target.email,
        summary=(
            f"{'Credited' if payload.delta > 0 else 'Debited'} "
            f"{abs(payload.delta)} pts for {target.email}: {payload.description}"
        ),
        extra={"delta": payload.delta, "reason": payload.description},
    )
    db.commit()
    return admin_user_loyalty(user_id, db)


@router.get(
    "/admin/tiers",
    response_model=list[RedemptionTierRead],
    dependencies=[Depends(require_permission("loyalty.configure"))],
)
def admin_list_tiers(db: Session = Depends(get_db)):
    return LoyaltyService(db).list_tiers(active_only=False)


@router.post(
    "/admin/tiers",
    response_model=RedemptionTierRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("loyalty.configure"))],
)
def admin_create_tier(payload: RedemptionTierCreate, db: Session = Depends(get_db)):
    from app.models.loyalty import RedemptionTier
    tier = RedemptionTier(**payload.model_dump())
    db.add(tier)
    db.commit()
    db.refresh(tier)
    return tier


@router.patch(
    "/admin/tiers/{tier_id}",
    response_model=RedemptionTierRead,
    dependencies=[Depends(require_permission("loyalty.configure"))],
)
def admin_update_tier(
    tier_id: int, payload: RedemptionTierUpdate, db: Session = Depends(get_db)
):
    from app.repositories.loyalty_repository import RedemptionTierRepository

    repo = RedemptionTierRepository(db)
    tier = repo.get(tier_id)
    if not tier:
        raise NotFoundError("Tier not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(tier, k, v)
    db.commit()
    db.refresh(tier)
    return tier


@router.delete(
    "/admin/tiers/{tier_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_permission("loyalty.configure"))],
)
def admin_delete_tier(tier_id: int, db: Session = Depends(get_db)):
    from app.repositories.loyalty_repository import RedemptionTierRepository

    repo = RedemptionTierRepository(db)
    tier = repo.get(tier_id)
    if not tier:
        raise NotFoundError("Tier not found")
    repo.delete(tier)
    db.commit()


# ---- Earn rules (admin) ----


@router.get(
    "/admin/earn-rules",
    response_model=list[EarnRuleRead],
    dependencies=[Depends(require_permission("loyalty.configure"))],
)
def admin_list_earn_rules(db: Session = Depends(get_db)):
    from app.repositories.earn_rule_repository import EarnRuleRepository

    return EarnRuleRepository(db).list_all()


@router.patch(
    "/admin/earn-rules/{rule_id}",
    response_model=EarnRuleRead,
    dependencies=[Depends(require_permission("loyalty.configure"))],
)
def admin_update_earn_rule(
    rule_id: int, payload: EarnRuleUpdate, db: Session = Depends(get_db)
):
    from app.repositories.earn_rule_repository import EarnRuleRepository

    repo = EarnRuleRepository(db)
    rule = repo.get(rule_id)
    if not rule:
        raise NotFoundError("Earn rule not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(rule, k, v)
    db.commit()
    db.refresh(rule)
    return rule


# ---- VIP tiers (admin) ----


@router.get(
    "/admin/vip-tiers",
    response_model=list[VipTierRead],
    dependencies=[Depends(require_permission("loyalty.configure"))],
)
def admin_list_vip_tiers(db: Session = Depends(get_db)):
    from app.repositories.vip_tier_repository import VipTierRepository

    return VipTierRepository(db).list_all()


@router.post(
    "/admin/vip-tiers",
    response_model=VipTierRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("loyalty.configure"))],
)
def admin_create_vip_tier(payload: VipTierCreate, db: Session = Depends(get_db)):
    from app.models.loyalty import VipTier

    tier = VipTier(**payload.model_dump())
    db.add(tier)
    db.commit()
    db.refresh(tier)
    return tier


@router.patch(
    "/admin/vip-tiers/{tier_id}",
    response_model=VipTierRead,
    dependencies=[Depends(require_permission("loyalty.configure"))],
)
def admin_update_vip_tier(
    tier_id: int, payload: VipTierUpdate, db: Session = Depends(get_db)
):
    from app.repositories.vip_tier_repository import VipTierRepository

    repo = VipTierRepository(db)
    tier = repo.get(tier_id)
    if not tier:
        raise NotFoundError("VIP tier not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(tier, k, v)
    db.commit()
    db.refresh(tier)
    return tier


@router.delete(
    "/admin/vip-tiers/{tier_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_permission("loyalty.configure"))],
)
def admin_delete_vip_tier(tier_id: int, db: Session = Depends(get_db)):
    from app.repositories.vip_tier_repository import VipTierRepository

    repo = VipTierRepository(db)
    tier = repo.get(tier_id)
    if not tier:
        raise NotFoundError("VIP tier not found")
    repo.delete(tier)
    db.commit()


# ---- Referrals (user-facing) ----


@router.get("/me/referral", response_model=MyReferralOverview)
def my_referral_overview(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Their code, share URL, and aggregate stats."""
    svc = ReferralService(db)
    code = svc.get_or_create_code(user)
    db.commit()
    total, completed = svc.stats_for_referrer(user.id)
    share_url = f"{settings.FRONTEND_URL}/?ref={code}"
    return MyReferralOverview(
        code=code,
        share_url=share_url,
        total=total,
        completed=completed,
        pending=total - completed,
        referrer_reward_amount=float(loyalty_config.REFERRER_REWARD_DISCOUNT_AMOUNT),
        friend_welcome_amount=float(loyalty_config.FRIEND_WELCOME_DISCOUNT_AMOUNT),
        referrer_reward_min_order=float(loyalty_config.REFERRER_REWARD_MIN_ORDER),
        friend_welcome_min_order=float(loyalty_config.FRIEND_WELCOME_MIN_ORDER),
    )


@router.get("/me/referrals", response_model=ReferralListPage)
def my_referrals(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    offset = (page - 1) * page_size
    items, total = ReferralService(db).list_for_referrer(
        user.id, offset=offset, limit=page_size
    )
    return ReferralListPage(
        items=[
            ReferralBrief(
                id=r.id,
                status=r.status,
                referred_display=_obfuscate_email(
                    r.referred.email if r.referred else None
                ),
                created_at=r.created_at,
                completed_at=r.completed_at,
            )
            for r in items
        ],
        total=total,
        page=page,
        page_size=page_size,
    )


# ---- Referrals (admin) ----


@router.get(
    "/admin/referrals",
    response_model=AdminReferralListPage,
    dependencies=[Depends(require_permission("referrals.view"))],
)
def admin_list_referrals(
    status_filter: ReferralStatus | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    offset = (page - 1) * page_size
    items, total = ReferralService(db).list_admin(
        status=status_filter, offset=offset, limit=page_size
    )
    return AdminReferralListPage(
        items=[
            AdminReferralRow(
                id=r.id,
                referrer_email=r.referrer.email if r.referrer else "—",
                referred_email=r.referred.email if r.referred else "—",
                code=r.code,
                status=r.status,
                completed_order_id=r.completed_order_id,
                created_at=r.created_at,
                completed_at=r.completed_at,
            )
            for r in items
        ],
        total=total,
        page=page,
        page_size=page_size,
    )


# ---- Expiry ----


@router.post(
    "/admin/expire-points",
    response_model=ExpirySummary,
    dependencies=[Depends(require_permission("loyalty.configure"))],
)
def admin_expire_points(db: Session = Depends(get_db)):
    """Run the FIFO expiry sweep. Safe to invoke any time — only earn rows
    past their expires_at and not yet fully consumed produce EXPIRY entries.
    """
    result = LoyaltyService(db).expire_points()
    return ExpirySummary(
        users_processed=result["users_processed"],
        rows_expired=result["rows_expired"],
        points_expired=result["points_expired"],
    )
