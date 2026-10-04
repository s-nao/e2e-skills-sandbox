<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { api, ApiError, yen, type AdminProduct } from '../api'

const q = ref('')
const page = ref(1)
const items = ref<AdminProduct[]>([])
const total = ref(0)
const pageSize = ref(20)
const loaded = ref(false)
const error = ref('')
const message = ref('')

async function load() {
  const res = await api.admin.products({ q: q.value, page: page.value })
  items.value = res.items
  total.value = res.total
  pageSize.value = res.page_size
  loaded.value = true
}

function search() {
  page.value = 1
  return load()
}

async function remove(p: AdminProduct) {
  if (!window.confirm(`「${p.name}」を削除しますか？`)) return
  error.value = ''
  message.value = ''
  try {
    await api.admin.deleteProduct(p.id)
    message.value = `「${p.name}」を削除しました`
    await load()
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : '削除に失敗しました'
  }
}

onMounted(load)
</script>

<template>
  <div class="row">
    <form class="row" @submit.prevent="search">
      <input v-model="q" placeholder="商品名・SKU" data-testid="admin-search" />
      <button type="submit" data-testid="admin-search-submit">検索</button>
    </form>
    <RouterLink to="/products/new" data-testid="admin-new-product">商品を登録</RouterLink>
  </div>
  <p v-if="message" class="ok" role="status" data-testid="admin-message">{{ message }}</p>
  <p v-if="error" class="error" role="alert" data-testid="admin-error">{{ error }}</p>
  <p v-if="loaded && items.length === 0" data-testid="admin-products-empty">該当する商品はありません</p>
  <table v-else-if="loaded" class="table" data-testid="admin-products-table">
    <thead>
      <tr><th>SKU</th><th>商品名</th><th>カテゴリ</th><th class="right">価格</th><th class="right">在庫</th><th>状態</th><th></th></tr>
    </thead>
    <tbody>
      <tr v-for="p in items" :key="p.id" data-testid="admin-product-row" :data-sku="p.sku">
        <td>{{ p.sku }}</td>
        <td>{{ p.name }}</td>
        <td>{{ p.category.name }}</td>
        <td class="right">{{ yen(p.price) }}</td>
        <td class="right">{{ p.stock }}</td>
        <td data-testid="admin-product-status">{{ p.is_active ? '販売中' : '販売停止' }}</td>
        <td>
          <RouterLink :to="`/products/${p.id}`" data-testid="admin-edit">編集</RouterLink>
          <button class="link-button danger" data-testid="admin-delete" @click="remove(p)">削除</button>
        </td>
      </tr>
    </tbody>
  </table>
  <p class="muted" data-testid="admin-products-total">全 {{ total }} 件</p>
  <div v-if="total > pageSize" class="pager">
    <button :disabled="page <= 1" data-testid="admin-prev" @click="page--, load()">前へ</button>
    <span>{{ page }} / {{ Math.ceil(total / pageSize) }}</span>
    <button :disabled="page * pageSize >= total" data-testid="admin-next" @click="page++, load()">次へ</button>
  </div>
</template>
