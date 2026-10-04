import csv
import io
from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import ValidationError
from sqlalchemy import Date, cast, delete, func, or_, select
from sqlalchemy.orm import Session

from .auth import CurrentUser
from .db import get_session
from .models import Category, Order, OrderItem, Product, User
from .schemas import (
    AdminProductOut,
    AdminProductPage,
    ImportIn,
    ImportResult,
    ImportRowError,
    OrderItemOut,
    ProductIn,
    SalesOrderOut,
    SalesOut,
)


def require_admin(user: CurrentUser) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="管理者のみ利用できます")
    return user


router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(require_admin)])

SessionDep = Annotated[Session, Depends(get_session)]

SALES_LIMIT = 200
IMPORT_MAX_ROWS = 1000
REQUIRED_COLUMNS = ["sku", "name", "category", "price", "stock"]
OPTIONAL_COLUMNS = ["description", "is_active", "action"]
FIELD_LABELS = {
    "sku": "sku",
    "name": "name",
    "description": "description",
    "price": "price",
    "stock": "stock",
    "is_active": "is_active",
}


def _has_orders(session: Session, product_id: int) -> bool:
    return session.scalar(select(func.count()).select_from(OrderItem).where(OrderItem.product_id == product_id)) > 0


# --- 商品 -------------------------------------------------------------------


@router.get("/products", response_model=AdminProductPage)
def list_products(
    session: SessionDep,
    q: str | None = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
):
    conditions = []
    if q:
        conditions.append(or_(Product.name.ilike(f"%{q}%"), Product.sku.ilike(f"%{q}%")))
    total = session.scalar(select(func.count()).select_from(Product).where(*conditions))
    items = session.scalars(
        select(Product).where(*conditions).order_by(Product.id.desc()).offset((page - 1) * page_size).limit(page_size)
    ).all()
    return AdminProductPage(items=items, total=total, page=page, page_size=page_size)


@router.get("/products/{product_id}", response_model=AdminProductOut)
def get_product(product_id: int, session: SessionDep):
    product = session.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="商品が見つかりません")
    return product


def _check_category(session: Session, category_id: int) -> None:
    if session.get(Category, category_id) is None:
        raise HTTPException(status_code=400, detail="カテゴリが存在しません")


def _sku_taken(session: Session, sku: str, except_id: int | None = None) -> bool:
    stmt = select(Product.id).where(Product.sku == sku)
    if except_id is not None:
        stmt = stmt.where(Product.id != except_id)
    return session.scalar(stmt) is not None


@router.post("/products", response_model=AdminProductOut, status_code=201)
def create_product(payload: ProductIn, session: SessionDep):
    _check_category(session, payload.category_id)
    if _sku_taken(session, payload.sku):
        raise HTTPException(status_code=409, detail=f"SKU「{payload.sku}」はすでに使われています")
    product = Product(**payload.model_dump())
    session.add(product)
    session.commit()
    session.refresh(product)
    return product


@router.put("/products/{product_id}", response_model=AdminProductOut)
def update_product(product_id: int, payload: ProductIn, session: SessionDep):
    product = session.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="商品が見つかりません")
    _check_category(session, payload.category_id)
    if _sku_taken(session, payload.sku, except_id=product_id):
        raise HTTPException(status_code=409, detail=f"SKU「{payload.sku}」はすでに使われています")
    for key, value in payload.model_dump().items():
        setattr(product, key, value)
    session.commit()
    session.refresh(product)
    return product


@router.delete("/products/{product_id}", status_code=204)
def delete_product(product_id: int, session: SessionDep):
    product = session.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="商品が見つかりません")
    # 注文履歴に載っている商品を消すと、過去の注文の表示と売り上げが壊れる。販売停止にしてもらう
    if _has_orders(session, product_id):
        raise HTTPException(
            status_code=409,
            detail="注文履歴のある商品は削除できません。販売停止にしてください",
        )
    session.delete(product)
    session.commit()


# --- CSV 一括登録・変更・削除 -------------------------------------------------


@router.post("/products/import", response_model=ImportResult)
def import_products(payload: ImportIn, session: SessionDep):
    """sku をキーに、無ければ登録・あれば変更。action 列が delete の行は削除。
    1 行でもエラーがあれば全体を反映しない（dry_run=true のときは検証だけ）。"""
    reader = csv.DictReader(io.StringIO(payload.csv.lstrip("﻿")))
    header = [h.strip() for h in (reader.fieldnames or [])]
    missing = [c for c in REQUIRED_COLUMNS if c not in header]
    if missing:
        return ImportResult(
            dry_run=payload.dry_run,
            created=0,
            updated=0,
            deleted=0,
            errors=[ImportRowError(line=1, sku="", message=f"列 {', '.join(missing)} がありません")],
        )
    reader.fieldnames = header

    categories = {c.name: c.id for c in session.scalars(select(Category))}
    errors: list[ImportRowError] = []
    seen: set[str] = set()
    creates: list[ProductIn] = []
    updates: list[tuple[Product, ProductIn]] = []
    deletes: list[Product] = []

    rows = list(reader)
    if len(rows) > IMPORT_MAX_ROWS:
        raise HTTPException(status_code=400, detail=f"一度に取り込めるのは {IMPORT_MAX_ROWS} 行までです")

    for index, raw in enumerate(rows):
        line = index + 2
        row = {k: (v or "").strip() for k, v in raw.items() if k}
        sku = row.get("sku", "")

        def fail(message: str) -> None:
            errors.append(ImportRowError(line=line, sku=sku, message=message))

        if not sku:
            fail("sku が空です")
            continue
        if sku in seen:
            fail("同じ sku が CSV の中に複数あります")
            continue
        seen.add(sku)

        action = row.get("action", "").lower()
        if action not in ("", "delete"):
            fail("action は空欄または delete にしてください")
            continue
        existing = session.scalar(select(Product).where(Product.sku == sku))

        if action == "delete":
            if existing is None:
                fail("削除しようとした sku が存在しません")
            elif _has_orders(session, existing.id):
                fail("注文履歴のある商品は削除できません（is_active を false にして販売停止にしてください）")
            else:
                deletes.append(existing)
            continue

        category_id = categories.get(row.get("category", ""))
        if category_id is None:
            fail(f"category「{row.get('category', '')}」が存在しません")
            continue
        fields = {
            "sku": sku,
            "name": row.get("name", ""),
            "category_id": category_id,
            "price": row.get("price", ""),
            "stock": row.get("stock", ""),
        }
        if "description" in row:
            fields["description"] = row["description"]
        elif existing:
            fields["description"] = existing.description
        if row.get("is_active"):
            fields["is_active"] = row["is_active"]
        elif existing:
            fields["is_active"] = existing.is_active
        try:
            product_in = ProductIn(**fields)
        except ValidationError as e:
            bad = sorted({FIELD_LABELS.get(str(err["loc"][0]), str(err["loc"][0])) for err in e.errors()})
            fail(f"{', '.join(bad)} の値が正しくありません")
            continue
        if existing:
            updates.append((existing, product_in))
        else:
            creates.append(product_in)

    result = ImportResult(
        dry_run=payload.dry_run,
        created=len(creates),
        updated=len(updates),
        deleted=len(deletes),
        errors=errors,
    )
    if errors or payload.dry_run:
        return result

    for product_in in creates:
        session.add(Product(**product_in.model_dump()))
    for product, product_in in updates:
        for key, value in product_in.model_dump().items():
            setattr(product, key, value)
    for product in deletes:
        session.delete(product)
    session.commit()
    return result


# --- 売り上げ ---------------------------------------------------------------


def _sales_order_out(order: Order) -> SalesOrderOut:
    user = order.user
    return SalesOrderOut(
        id=order.id,
        status=order.status,
        total=order.total,
        created_at=order.created_at,
        user_name=user.name,
        user_email=user.email,
        items=[
            OrderItemOut(
                product_id=i.product_id,
                product_name=i.product.name,
                quantity=i.quantity,
                unit_price=i.unit_price,
            )
            for i in order.items
        ],
    )


@router.get("/sales", response_model=SalesOut)
def list_sales(
    session: SessionDep,
    from_date: Annotated[date | None, Query(alias="from")] = None,
    to_date: Annotated[date | None, Query(alias="to")] = None,
):
    """期間（日本時間の日付、両端を含む）の注文。件数と合計は status が placed のものだけ数える。"""
    order_date = cast(func.timezone("Asia/Tokyo", Order.created_at), Date)
    conditions = []
    if from_date:
        conditions.append(order_date >= from_date)
    if to_date:
        conditions.append(order_date <= to_date)

    count, total = session.execute(
        select(func.count(), func.coalesce(func.sum(Order.total), 0)).where(*conditions, Order.status == "placed")
    ).one()
    orders = session.scalars(
        select(Order).where(*conditions).order_by(Order.created_at.desc(), Order.id.desc()).limit(SALES_LIMIT + 1)
    ).all()
    return SalesOut(
        count=count,
        total=total,
        orders=[_sales_order_out(o) for o in orders[:SALES_LIMIT]],
        truncated=len(orders) > SALES_LIMIT,
    )


@router.delete("/sales/{order_id}", status_code=204)
def delete_sale(order_id: int, session: SessionDep):
    """注文の記録を消す。在庫は戻さない（記録の訂正であり、返品処理ではないため）。"""
    deleted = session.execute(delete(Order).where(Order.id == order_id)).rowcount
    if not deleted:
        raise HTTPException(status_code=404, detail="注文が見つかりません")
    session.commit()
