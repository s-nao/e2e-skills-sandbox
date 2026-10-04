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

export type User = { id: number; email: string; name: string; is_admin: boolean }

export type Order = {
  id: number
  status: string
  total: number
  created_at: string
  items: { product_id: number; product_name: string; quantity: number; unit_price: number }[]
}

export type AdminProduct = Product & { is_active: boolean }
export type AdminProductPage = { items: AdminProduct[]; total: number; page: number; page_size: number }
export type ProductInput = {
  sku: string
  name: string
  description: string
  category_id: number
  price: number
  stock: number
  is_active: boolean
}
export type ImportResult = {
  dry_run: boolean
  created: number
  updated: number
  deleted: number
  errors: { line: number; sku: string; message: string }[]
}
export type SalesOrder = Order & { user_name: string; user_email: string }
export type Sales = { count: number; total: number; orders: SalesOrder[]; truncated: boolean }

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
  return res.status === 204 ? (undefined as T) : res.json()
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
  login: (email: string, password: string) =>
    request<User>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => fetch('/api/auth/logout', { method: 'POST' }),
  me: () => request<User>('/api/auth/me'),
  admin: {
    products: (query: { q?: string; page?: number }) =>
      request<AdminProductPage>(`/api/admin/products?${toSearchParams(query)}`),
    product: (id: number) => request<AdminProduct>(`/api/admin/products/${id}`),
    createProduct: (input: ProductInput) =>
      request<AdminProduct>('/api/admin/products', { method: 'POST', body: JSON.stringify(input) }),
    updateProduct: (id: number, input: ProductInput) =>
      request<AdminProduct>(`/api/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
    deleteProduct: (id: number) => request<void>(`/api/admin/products/${id}`, { method: 'DELETE' }),
    importProducts: (csv: string, dryRun: boolean) =>
      request<ImportResult>('/api/admin/products/import', {
        method: 'POST',
        body: JSON.stringify({ csv, dry_run: dryRun }),
      }),
    sales: (query: { from?: string; to?: string }) => request<Sales>(`/api/admin/sales?${toSearchParams(query)}`),
    deleteSale: (id: number) => request<void>(`/api/admin/sales/${id}`, { method: 'DELETE' }),
  },
}

export const yen = (n: number) => `¥${n.toLocaleString('ja-JP')}`
