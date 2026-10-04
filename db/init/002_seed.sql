-- 開発用の基本データ（E2E テストはこれに依存せず、E2E- で始まる専用データを使う）
INSERT INTO categories (name) VALUES ('文房具'), ('キッチン'), ('アウトドア');

INSERT INTO products (sku, name, description, category_id, price, stock) VALUES
  ('ST-001', 'ボールペン 黒',       '0.5mm の油性ボールペン',   1,  150, 120),
  ('ST-002', 'ボールペン 赤',       '0.5mm の油性ボールペン',   1,  150,  80),
  ('ST-003', 'A5 ノート',           '方眼 80 枚',               1,  320,  40),
  ('ST-004', 'ホッチキス',          '中型・針 50 本付き',       1,  880,   0),
  ('KT-001', 'ステンレス片手鍋',    '18cm IH 対応',             2, 3980,  12),
  ('KT-002', 'まな板',              '抗菌タイプ',               2, 1280,  25),
  ('KT-003', '計量カップ',          '500ml',                    2,  550,   3),
  ('OD-001', 'キャンプチェア',      '折りたたみ・耐荷重 100kg', 3, 4980,   7),
  ('OD-002', 'LED ランタン',        'USB 充電式',               3, 2980,  15),
  ('OD-003', '保冷バッグ',          '20L',                      3, 1980,   0);

INSERT INTO products (sku, name, description, category_id, price, stock, is_active) VALUES
  ('OD-999', '旧型テント',          '販売終了品',               3, 9800,   5, FALSE);

-- 開発用ユーザー（パスワードはどちらも password123）
INSERT INTO users (email, password_hash, name, is_active) VALUES
  ('customer@example.com', crypt('password123', gen_salt('bf')), '山田 花子', TRUE),
  ('inactive@example.com', crypt('password123', gen_salt('bf')), '停止 済子', FALSE);
