<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { api, yen, type Order } from '../api'

const orders = ref<Order[] | null>(null)
const error = ref('')

onMounted(async () => {
  try {
    orders.value = await api.orders()
  } catch {
    error.value = '注文履歴の取得に失敗しました'
  }
})
</script>

<template>
  <h1>注文履歴</h1>
  <p v-if="error" class="error" role="alert">{{ error }}</p>
  <p v-else-if="orders && orders.length === 0" data-testid="history-empty">注文はありません</p>
  <ul v-else-if="orders" class="orders" data-testid="order-list">
    <li v-for="o in orders" :key="o.id" class="card" data-testid="order-item" :data-order-id="o.id">
      <p><strong>注文番号 {{ o.id }}</strong> <span class="muted">{{ new Date(o.created_at).toLocaleString('ja-JP') }}</span></p>
      <ul>
        <li v-for="i in o.items" :key="i.product_id">{{ i.product_name }} × {{ i.quantity }}</li>
      </ul>
      <p class="price" data-testid="order-total">{{ yen(o.total) }}</p>
    </li>
  </ul>
  <p v-else>読み込み中…</p>
</template>
