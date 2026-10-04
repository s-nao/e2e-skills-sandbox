<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { api, ApiError, yen, type Sales } from '../api'

const from = ref('')
const to = ref('')
const sales = ref<Sales | null>(null)
const error = ref('')
const message = ref('')

async function load() {
  sales.value = await api.admin.sales({ from: from.value, to: to.value })
}

async function remove(id: number) {
  if (!window.confirm(`注文番号 ${id} の売り上げを削除しますか？（在庫は戻りません）`)) return
  error.value = ''
  message.value = ''
  try {
    await api.admin.deleteSale(id)
    message.value = `注文番号 ${id} を削除しました`
    await load()
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : '削除に失敗しました'
  }
}

onMounted(load)
</script>

<template>
  <form class="row" @submit.prevent="load">
    <label>期間 <input v-model="from" type="date" data-testid="sales-from" /></label>
    <span>〜</span>
    <input v-model="to" type="date" data-testid="sales-to" />
    <button type="submit" data-testid="sales-search">表示</button>
  </form>
  <p v-if="message" class="ok" role="status" data-testid="sales-message">{{ message }}</p>
  <p v-if="error" class="error" role="alert" data-testid="sales-error">{{ error }}</p>
  <template v-if="sales">
    <p class="price">
      売り上げ合計 <span data-testid="sales-total">{{ yen(sales.total) }}</span>
      （<span data-testid="sales-count">{{ sales.count }}</span> 件）
    </p>
    <p v-if="sales.truncated" class="warn" data-testid="sales-truncated">件数が多いため、新しい 200 件だけ表示しています。期間を絞ってください</p>
    <p v-if="sales.orders.length === 0" data-testid="sales-empty">該当する注文はありません</p>
    <table v-else class="table" data-testid="sales-table">
      <thead>
        <tr><th>注文番号</th><th>日時</th><th>購入者</th><th>商品</th><th class="right">金額</th><th>状態</th><th></th></tr>
      </thead>
      <tbody>
        <tr v-for="o in sales.orders" :key="o.id" data-testid="sales-row" :data-order-id="o.id">
          <td>{{ o.id }}</td>
          <td>{{ new Date(o.created_at).toLocaleString('ja-JP') }}</td>
          <td>{{ o.user_name }}<br /><span class="muted">{{ o.user_email }}</span></td>
          <td><div v-for="i in o.items" :key="i.product_id">{{ i.product_name }} × {{ i.quantity }}</div></td>
          <td class="right" data-testid="sales-row-total">{{ yen(o.total) }}</td>
          <td>{{ o.status === 'placed' ? '注文済み' : 'キャンセル' }}</td>
          <td><button class="link-button danger" data-testid="sales-delete" @click="remove(o.id)">削除</button></td>
        </tr>
      </tbody>
    </table>
  </template>
</template>
