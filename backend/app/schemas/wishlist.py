from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class WishlistItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    name: str
    price: Decimal
    image_url: str | None
    created_at: datetime


class WishlistAdd(BaseModel):
    product_id: int
