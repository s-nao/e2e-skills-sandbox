CREATE TABLE categories (
    id   SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE products (
    id          SERIAL PRIMARY KEY,
    sku         TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category_id INTEGER NOT NULL REFERENCES categories(id),
    price       INTEGER NOT NULL CHECK (price >= 0),          -- 税込・円
    stock       INTEGER NOT NULL CHECK (stock >= 0),
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,                 -- FALSE は一覧に出さない（販売停止）
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX products_category_idx ON products (category_id);
CREATE INDEX products_name_idx ON products (name);

CREATE TABLE orders (
    id             SERIAL PRIMARY KEY,
    customer_email TEXT NOT NULL,
    status         TEXT NOT NULL DEFAULT 'placed' CHECK (status IN ('placed', 'cancelled')),
    total          INTEGER NOT NULL CHECK (total >= 0),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX orders_customer_email_idx ON orders (customer_email);

CREATE TABLE order_items (
    id         SERIAL PRIMARY KEY,
    order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity   INTEGER NOT NULL CHECK (quantity > 0),
    unit_price INTEGER NOT NULL CHECK (unit_price >= 0)
);
