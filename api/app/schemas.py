from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


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
    items: list[OrderItemIn] = Field(min_length=1)


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    product_id: int
    product_name: str
    quantity: int
    unit_price: int


class OrderOut(BaseModel):
    id: int
    status: str
    total: int
    created_at: datetime
    items: list[OrderItemOut]


class LoginIn(BaseModel):
    email: str = Field(min_length=1, max_length=254)
    password: str = Field(min_length=1, max_length=128)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    name: str
    is_admin: bool


class ProductIn(BaseModel):
    sku: str = Field(min_length=1, max_length=40, pattern=r"^[A-Za-z0-9_-]+$")
    name: str = Field(min_length=1, max_length=100)
    description: str = Field(default="", max_length=1000)
    category_id: int
    price: int = Field(ge=0, le=10_000_000)
    stock: int = Field(ge=0, le=1_000_000)
    is_active: bool = True


class AdminProductOut(ProductOut):
    is_active: bool


class AdminProductPage(BaseModel):
    items: list[AdminProductOut]
    total: int
    page: int
    page_size: int


class ImportIn(BaseModel):
    csv: str = Field(max_length=2_000_000)
    dry_run: bool = True


class ImportRowError(BaseModel):
    line: int
    sku: str
    message: str


class ImportResult(BaseModel):
    dry_run: bool
    created: int
    updated: int
    deleted: int
    errors: list[ImportRowError]


class SalesOrderOut(OrderOut):
    user_name: str
    user_email: str


class SalesOut(BaseModel):
    count: int
    total: int
    orders: list[SalesOrderOut]
    truncated: bool
