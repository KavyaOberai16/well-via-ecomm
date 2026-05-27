from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_permission
from app.schemas.tax import ProductTaxUpdate, TaxCreate, TaxRead, TaxUpdate
from app.services.tax_service import TaxService

router = APIRouter()


@router.get(
    "",
    response_model=list[TaxRead],
    dependencies=[Depends(require_permission("taxes.view"))],
)
def list_taxes(db: Session = Depends(get_db)):
    return TaxService(db).list_all()


@router.post(
    "",
    response_model=TaxRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("taxes.create"))],
)
def create_tax(payload: TaxCreate, db: Session = Depends(get_db)):
    return TaxService(db).create(payload)


@router.patch(
    "/{tax_id}",
    response_model=TaxRead,
    dependencies=[Depends(require_permission("taxes.update"))],
)
def update_tax(tax_id: int, payload: TaxUpdate, db: Session = Depends(get_db)):
    return TaxService(db).update(tax_id, payload)


@router.delete(
    "/{tax_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_permission("taxes.delete"))],
)
def delete_tax(tax_id: int, db: Session = Depends(get_db)):
    TaxService(db).delete(tax_id)


@router.put(
    "/products/{product_id}",
    response_model=list[TaxRead],
    dependencies=[Depends(require_permission("products.update"))],
)
def set_product_taxes(
    product_id: int, payload: ProductTaxUpdate, db: Session = Depends(get_db)
):
    product = TaxService(db).set_product_taxes(product_id, payload.tax_ids)
    return product.taxes
