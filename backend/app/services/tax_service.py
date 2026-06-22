from decimal import ROUND_HALF_UP, Decimal

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.models.product import Product
from app.models.tax import Tax
from app.repositories.product_repository import ProductRepository
from app.repositories.tax_repository import TaxRepository
from app.schemas.tax import TaxCreate, TaxUpdate

CENTS = Decimal("0.01")


def quantize_money(value: Decimal) -> Decimal:
    return value.quantize(CENTS, rounding=ROUND_HALF_UP)


def compute_line_tax(unit_price: Decimal, quantity: int, taxes: list[Tax]) -> Decimal:
    """Tax for a single line. Taxes on a product are summed (e.g. GST + cess)."""
    if not taxes:
        return Decimal("0.00")
    rate_sum = sum((Decimal(t.rate) for t in taxes if t.is_active), Decimal("0"))
    return quantize_money(unit_price * quantity * rate_sum / Decimal("100"))


class TaxService:
    def __init__(self, db: Session):
        self.db = db
        self.taxes = TaxRepository(db)
        self.products = ProductRepository(db)

    def list_active(self) -> list[Tax]:
        return self.taxes.list_active()

    def list_all(self) -> list[Tax]:
        return self.taxes.list_all()

    def get(self, tax_id: int) -> Tax:
        tax = self.taxes.get(tax_id)
        if not tax:
            raise NotFoundError("Tax not found")
        return tax

    def create(self, data: TaxCreate) -> Tax:
        tax = Tax(name=data.name, rate=data.rate, is_active=data.is_active)
        self.taxes.add(tax)
        self.db.commit()
        return tax

    def update(self, tax_id: int, data: TaxUpdate) -> Tax:
        tax = self.get(tax_id)
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(tax, key, value)
        self.db.commit()
        return tax

    def delete(self, tax_id: int) -> None:
        tax = self.get(tax_id)
        self.taxes.delete(tax)
        self.db.commit()

    def set_product_taxes(self, product_id: int, tax_ids: list[int]) -> Product:
        product = self.products.get(product_id)
        if not product:
            raise NotFoundError("Product not found")
        product.taxes = self.taxes.get_many(tax_ids)
        self.db.commit()
        self.db.refresh(product)
        return product
