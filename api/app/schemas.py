from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sku: str
    name: str
    description: str
    price: int
    stock: int
    category: CategoryOut


class ProductPage(BaseModel):
    items: list[ProductOut]
    total: int
    page: int
    page_size: int


ProductSort = Literal["newest", "price_asc", "price_desc", "name"]


class OrderItemIn(BaseModel):
    product_id: int
    quantity: int = Field(gt=0, le=99)


class OrderIn(BaseModel):
    customer_email: EmailStr
    items: list[OrderItemIn] = Field(min_length=1)


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    product_id: int
    product_name: str
    quantity: int
    unit_price: int


class OrderOut(BaseModel):
    id: int
    customer_email: str
    status: str
    total: int
    created_at: datetime
    items: list[OrderItemOut]
