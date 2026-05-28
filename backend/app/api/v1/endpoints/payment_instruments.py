"""GET /payments/instruments — the picker config.

Public + rate-limited. Returns the canonical instrument list with each
one's enabled flag + discount percent + whether it's the suggested chip.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.rate_limit import RateLimiter, get_client_ip
from app.schemas.payment_instruments import PaymentInstrumentsResponse
from app.services.payment_methods_service import PaymentMethodsService

router = APIRouter()


@router.get("/instruments", response_model=PaymentInstrumentsResponse)
def list_instruments(
    request: Request,
    db: Session = Depends(get_db),
):
    RateLimiter().enforce(
        scope="payments.instruments",
        identifier=get_client_ip(request),
        limit=120,
        window_sec=60,
    )
    items = PaymentMethodsService(db).list_instruments()
    return PaymentInstrumentsResponse(items=items)
