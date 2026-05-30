"""Payment gateway configuration (singleton GET/PUT).

The active provider + PhonePe credentials live in one DB row. The salt key is
write-only over the API: it's accepted on PUT (encrypted at rest) but never
returned — reads only report whether one is set.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_permission
from app.schemas.payment_gateway import PaymentGatewayRead, PaymentGatewayUpdate
from app.services.payment_gateway_service import PaymentGatewayService

router = APIRouter()


@router.get(
    "",
    response_model=PaymentGatewayRead,
    dependencies=[Depends(require_permission("payments.manage"))],
)
def get_payment_gateway(db: Session = Depends(get_db)):
    return PaymentGatewayRead.from_model(PaymentGatewayService(db).get())


@router.put(
    "",
    response_model=PaymentGatewayRead,
    dependencies=[Depends(require_permission("payments.manage"))],
)
def update_payment_gateway(payload: PaymentGatewayUpdate, db: Session = Depends(get_db)):
    cfg = PaymentGatewayService(db).update(payload)
    return PaymentGatewayRead.from_model(cfg)
