"""COD endpoints — currently just availability check.

Auth: optional. Authenticated users get the user-specific gates (first-time,
RTO history) applied; anonymous shoppers get the cart/pincode-only check
so they can see availability on a public product page if we choose to
surface it there later.
"""
from __future__ import annotations

from decimal import Decimal

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, optional_current_user
from app.core.rate_limit import RateLimiter, get_client_ip
from app.models.user import User
from app.schemas.cod import CodCheckRequest, CodCheckResponse
from app.schemas.cod_otp import (
    CodOtpSendRequest,
    CodOtpSendResponse,
    CodOtpVerifyRequest,
    CodOtpVerifyResponse,
)
from app.services.cod_otp_service import CodOtpService
from app.services.cod_service import CodService

router = APIRouter()


@router.post("/check", response_model=CodCheckResponse)
def check_cod(
    payload: CodCheckRequest,
    request: Request,
    user: User | None = Depends(optional_current_user),
    db: Session = Depends(get_db),
):
    # Same rate-limit profile as the rate-quote endpoint — comfortably above
    # human checkout speed, low enough to block scraping.
    RateLimiter().enforce(
        scope="cod.check",
        identifier=get_client_ip(request),
        limit=60,
        window_sec=60,
    )

    svc = CodService(db)
    result = svc.check_availability(
        user=user,
        cart_items=[(i.product_id, i.quantity) for i in payload.items],
        destination_pincode=payload.destination_pincode,
    )

    # Display total = subtotal + tax + surcharge. We deliberately exclude
    # shipping + coupon here — checkout recomputes the authoritative total
    # using the user's pincode + active coupon. The picker just needs a
    # ballpark to show "Pay on delivery: ₹X".
    cod_total = (
        result.subtotal
        + result.tax_amount
        + (result.surcharge_amount if result.available else Decimal("0"))
    ).quantize(Decimal("0.01"))

    split_available, split_prepaid, split_balance = svc.split_availability(
        result, cod_total
    )

    return CodCheckResponse(
        available=result.available,
        reasons=result.reasons,
        surcharge_amount=result.surcharge_amount,
        cod_total=cod_total,
        split_available=split_available,
        split_prepaid_amount=split_prepaid,
        split_cod_amount=split_balance,
    )


# ---- OTP --------------------------------------------------------------------


@router.post("/send-otp", response_model=CodOtpSendResponse)
def send_cod_otp(
    payload: CodOtpSendRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Send an SMS OTP to the customer's phone for COD verification."""
    # IP rate limit so an attacker can't enumerate accounts via OTP traffic.
    # Per-(user, phone) rate limit lives in the service.
    RateLimiter().enforce(
        scope="cod.send_otp",
        identifier=get_client_ip(request),
        limit=20,
        window_sec=60,
    )
    result = CodOtpService(db).send(user_id=user.id, phone=payload.phone)
    return CodOtpSendResponse(**result)


@router.post("/verify-otp", response_model=CodOtpVerifyResponse)
def verify_cod_otp(
    payload: CodOtpVerifyRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Verify the SMS OTP. On success the customer can place a COD order
    against this phone for the next 15 minutes."""
    RateLimiter().enforce(
        scope="cod.verify_otp",
        identifier=get_client_ip(request),
        limit=30,
        window_sec=60,
    )
    CodOtpService(db).verify(user_id=user.id, phone=payload.phone, code=payload.code)
    return CodOtpVerifyResponse(verified=True)
