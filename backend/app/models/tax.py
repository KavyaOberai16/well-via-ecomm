from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Column, ForeignKey, Integer, Numeric, String, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, IDMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.product import Product


product_taxes = Table(
    "product_taxes",
    Base.metadata,
    Column("product_id", Integer, ForeignKey("products.id", ondelete="CASCADE"), primary_key=True),
    Column("tax_id", Integer, ForeignKey("taxes.id", ondelete="CASCADE"), primary_key=True),
)


class Tax(Base, IDMixin, TimestampMixin):
    __tablename__ = "taxes"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    # Percentage. 18.000 == 18%. Multiple taxes on one product are summed.
    rate: Mapped[Decimal] = mapped_column(Numeric(6, 3), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)

    products: Mapped[list["Product"]] = relationship(
        secondary=product_taxes, back_populates="taxes"
    )
