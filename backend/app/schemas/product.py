from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ProductImageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    url: str
    position: int
    is_primary: bool


class ProductBase(BaseModel):
    sku: str = Field(min_length=1, max_length=64)
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    price: Decimal = Field(ge=0, decimal_places=2)
    stock: int = Field(ge=0, default=0)
    image_url: str | None = None
    category_id: int | None = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price: Decimal | None = None
    stock: int | None = None
    image_url: str | None = None
    category_id: int | None = None


class ProductRead(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    images: list[ProductImageRead] = []
    created_at: datetime
    updated_at: datetime
