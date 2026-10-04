<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { api, yen, type Category, type ProductPage, type ProductQuery } from '../api'
import { useCart } from '../cart'

const route = useRoute()
const router = useRouter()
const cart = useCart()

const categories = ref<Category[]>([])
const result = ref<ProductPage | null>(null)
const loading = ref(false)
const error = ref('')

// 検索条件は URL に持たせる（リロードや共有で同じ結果を再現できるように）
const form = reactive({ q: '', category_id: '', in_stock: false, sort: 'newest' as NonNullable<ProductQuery['sort']> })

function queryFromRoute(): ProductQuery {
  const q = route.query
  return {
    q: (q.q as string) || undefined,
    category_id: q.category_id ? Number(q.category_id) : undefined,
    in_stock: q.in_stock === 'true',
    sort: (q.sort as ProductQuery['sort']) || 'newest',
    page: q.page ? Number(q.page) : 1,
  }
}

async function load() {
  const query = queryFromRoute()
  Object.assign(form, {
    q: query.q ?? '',
    category_id: query.category_id ? String(query.category_id) : '',
    in_stock: query.in_stock,
    sort: query.sort,
  })
  loading.value = true
  error.value = ''
  try {
    result.value = await api.products(query)
  } catch {
    error.value = '商品の取得に失敗しました'
  } finally {
    loading.value = false
  }
}

function search(page = 1) {
  router.push({
    query: {
      q: form.q || undefined,
      category_id: form.category_id || undefined,
      in_stock: form.in_stock ? 'true' : undefined,
      sort: form.sort === 'newest' ? undefined : form.sort,
      page: page > 1 ? String(page) : undefined,
    },
  })
}

const totalPages = () => (result.value ? Math.max(1, Math.ceil(result.value.total / result.value.page_size)) : 1)

onMounted(async () => {
  categories.value = await api.categories()
})
watch(() => route.query, load, { immediate: true })
</script>

<template>
  <h1>商品一覧</h1>

  <form class="filters" data-testid="search-form" @submit.prevent="search()">
    <input v-model="form.q" type="search" placeholder="商品名で検索" data-testid="search-input" />
    <select v-model="form.category_id" data-testid="category-select">
      <option value="">すべてのカテゴリ</option>
      <option v-for="c in categories" :key="c.id" :value="String(c.id)">{{ c.name }}</option>
    </select>
    <label><input v-model="form.in_stock" type="checkbox" data-testid="in-stock-checkbox" /> 在庫ありのみ</label>
    <select v-model="form.sort" data-testid="sort-select">
      <option value="newest">新着順</option>
      <option value="price_asc">価格の安い順</option>
      <option value="price_desc">価格の高い順</option>
      <option value="name">名前順</option>
    </select>
    <button type="submit" data-testid="search-button">検索</button>
  </form>

  <p v-if="error" class="error" role="alert">{{ error }}</p>
  <p v-else-if="loading && !result">読み込み中…</p>
  <template v-else-if="result">
    <p class="muted" data-testid="result-count">{{ result.total }} 件</p>
    <p v-if="result.total === 0" data-testid="empty-message">条件に合う商品はありません</p>

    <ul class="grid" data-testid="product-list">
      <li v-for="p in result.items" :key="p.id" class="card" data-testid="product-card" :data-sku="p.sku">
        <RouterLink :to="`/products/${p.id}`" class="card-title" data-testid="product-name">{{ p.name }}</RouterLink>
        <p class="muted">{{ p.category.name }}</p>
        <p class="price" data-testid="product-price">{{ yen(p.price) }}</p>
        <p v-if="p.stock === 0" class="soldout" data-testid="sold-out-badge">在庫切れ</p>
        <p v-else-if="p.stock <= 5" class="warn" data-testid="low-stock-badge">残りわずか（{{ p.stock }} 点）</p>
        <button :disabled="p.stock === 0" data-testid="add-to-cart" @click="cart.add(p)">カートに入れる</button>
      </li>
    </ul>

    <nav v-if="totalPages() > 1" class="pager" data-testid="pager">
      <button :disabled="result.page <= 1" data-testid="prev-page" @click="search(result.page - 1)">前へ</button>
      <span data-testid="page-indicator">{{ result.page }} / {{ totalPages() }}</span>
      <button :disabled="result.page >= totalPages()" data-testid="next-page" @click="search(result.page + 1)">次へ</button>
    </nav>
  </template>
</template>
