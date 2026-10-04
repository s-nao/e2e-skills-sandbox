from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from . import admin, auth
from .auth import CurrentUser
from .db import get_session
from .models import Category, Order, OrderItem, Product
from .schemas import (
    CategoryOut,
    OrderIn,
    OrderItemOut,
    OrderOut,
    ProductOut,
    ProductPage,
    ProductSort,
)

app = FastAPI(title="Sample Shop API")
app.include_router(auth.router)
app.include_router(admin.router)

SessionDep = Annotated[Session, Depends(get_session)]

SORT_COLUMNS = {
    "newest": (Product.created_at.desc(), Product.id.desc()),
    "price_asc": (Product.price.asc(), Product.id.asc()),
    "price_desc": (Product.price.desc(), Product.id.asc()),
    "name": (Product.name.asc(), Product.id.asc()),
}


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/categories", response_model=list[CategoryOut])
def list_categories(session: SessionDep):
    return session.scalars(select(Category).order_by(Category.id)).all()


@app.get("/api/products", response_model=ProductPage)
def list_products(
    session: SessionDep,
    q: str | None = None,
    category_id: int | None = None,
    in_stock: bool = False,
    sort: ProductSort = "newest",
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 12,
):
    conditions = [Product.is_active.is_(True)]
    if q:
        conditions.append(Product.name.ilike(f"%{q}%"))
    if category_id is not None:
        conditions.append(Product.category_id == category_id)
    if in_stock:
        conditions.append(Product.stock > 0)

    total = session.scalar(select(func.count()).select_from(Product).where(*conditions))
    items = session.scalars(
        select(Product)
        .where(*conditions)
        .order_by(*SORT_COLUMNS[sort])
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return ProductPage(items=items, total=total, page=page, page_size=page_size)


@app.get("/api/products/{product_id}", response_model=ProductOut)
def get_product(product_id: int, session: SessionDep):
    product = session.get(Product, product_id)
    if product is None or not product.is_active:
        raise HTTPException(status_code=404, detail="商品が見つかりません")
    return product


def to_order_out(order: Order) -> OrderOut:
    return OrderOut(
        id=order.id,
        status=order.status,
        total=order.total,
        created_at=order.created_at,
        items=[
            OrderItemOut(
                product_id=item.product_id,
                product_name=item.product.name,
                quantity=item.quantity,
                unit_price=item.unit_price,
            )
            for item in order.items
        ],
    )


@app.post("/api/orders", response_model=OrderOut, status_code=201)
def create_order(payload: OrderIn, user: CurrentUser, session: SessionDep):
    product_ids = [item.product_id for item in payload.items]
    # 在庫を同時に減らされないよう、対象商品の行をロックしてから確認する
    products = {
        p.id: p
        for p in session.scalars(
            select(Product).where(Product.id.in_(product_ids)).with_for_update(of=Product)
        )
    }

    order = Order(user_id=user.id, total=0)
    for line in payload.items:
        product = products.get(line.product_id)
        if product is None or not product.is_active:
            raise HTTPException(status_code=400, detail=f"商品 {line.product_id} は購入できません")
        if product.stock < line.quantity:
            raise HTTPException(
                status_code=409,
                detail=f"「{product.name}」の在庫が不足しています（残り {product.stock} 点）",
            )
        product.stock -= line.quantity
        order.items.append(
            OrderItem(product=product, quantity=line.quantity, unit_price=product.price)
        )
        order.total += product.price * line.quantity

    session.add(order)
    session.commit()
    return to_order_out(order)


@app.get("/api/orders", response_model=list[OrderOut])
def list_orders(user: CurrentUser, session: SessionDep):
    orders = session.scalars(
        select(Order)
        .where(Order.user_id == user.id)
        .order_by(Order.created_at.desc(), Order.id.desc())
    ).all()
    return [to_order_out(o) for o in orders]
