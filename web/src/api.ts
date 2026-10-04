export type Category = { id: number; name: string }

export type Product = {
  id: number
  sku: string
  name: string
  description: string
  price: number
  stock: number
  category: Category
}

export type ProductPage = { items: Product[]; total: number; page: number; page_size: number }

export type ProductQuery = {
  q?: string
  category_id?: number
  in_stock?: boolean
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'name'
  page?: number
}

export type User = { id: number; email: string; name: string }

export type Order = {
  id: number
  status: string
  total: number
  created_at: string
  items: { product_id: number; product_name: string; quantity: number; unit_price: number }[]
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const detail = typeof body.detail === 'string' ? body.detail : '入力内容を確認してください'
    throw new ApiError(res.status, detail)
  }
  return res.json()
}

function toSearchParams(query: Record<string, unknown>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '' && value !== false) params.set(key, String(value))
  }
  return params.toString()
}

export const api = {
  categories: () => request<Category[]>('/api/categories'),
  products: (query: ProductQuery) => request<ProductPage>(`/api/products?${toSearchParams(query)}`),
  product: (id: number) => request<Product>(`/api/products/${id}`),
  createOrder: (items: { product_id: number; quantity: number }[]) =>
    request<Order>('/api/orders', { method: 'POST', body: JSON.stringify({ items }) }),
  orders: () => request<Order[]>('/api/orders'),
  login: (email: string, password: string) =>
    request<User>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => fetch('/api/auth/logout', { method: 'POST' }),
  me: () => request<User>('/api/auth/me'),
}

export const yen = (n: number) => `¥${n.toLocaleString('ja-JP')}`
