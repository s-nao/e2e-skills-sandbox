<script setup lang="ts">
import { ref } from 'vue'

import { api, ApiError, type ImportResult } from '../api'

const csv = ref('')
const fileName = ref('')
const preview = ref<ImportResult | null>(null)
const applied = ref<ImportResult | null>(null)
const busy = ref(false)
const error = ref('')

async function pick(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  preview.value = applied.value = null
  error.value = ''
  if (!file) return
  fileName.value = file.name
  csv.value = await file.text()
  await run(true)
}

async function run(dryRun: boolean) {
  busy.value = true
  error.value = ''
  try {
    const res = await api.admin.importProducts(csv.value, dryRun)
    if (dryRun) preview.value = res
    else {
      applied.value = res
      preview.value = null
    }
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : '取り込みに失敗しました'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <p>sku をキーに、無い商品は登録、ある商品は変更します。<code>action</code> 列に <code>delete</code> と書いた行は削除します。</p>
  <pre class="csv-example">sku,name,description,category,price,stock,is_active,action
NEW-001,新商品,説明,文房具,300,10,true,
ST-001,ボールペン 黒,0.5mm の油性ボールペン,文房具,160,120,true,
OLD-001,,,,,,,delete</pre>
  <p class="muted">必須の列: sku, name, category, price, stock。任意: description, is_active, action。文字コードは UTF-8。1 行でもエラーがあると、何も反映しません。</p>
  <div class="row">
    <input type="file" accept=".csv,text/csv" data-testid="import-file" @change="pick" />
  </div>
  <p v-if="error" class="error" role="alert" data-testid="import-error">{{ error }}</p>

  <section v-if="preview" class="card" data-testid="import-preview">
    <p><strong>{{ fileName }}</strong> の確認結果</p>
    <p data-testid="import-summary">登録 {{ preview.created }} 件 / 変更 {{ preview.updated }} 件 / 削除 {{ preview.deleted }} 件</p>
    <ul v-if="preview.errors.length" class="error" data-testid="import-errors">
      <li v-for="e in preview.errors" :key="e.line" data-testid="import-error-row">{{ e.line }} 行目{{ e.sku ? `（${e.sku}）` : '' }}: {{ e.message }}</li>
    </ul>
    <button :disabled="busy || preview.errors.length > 0" data-testid="import-apply" @click="run(false)">この内容で反映する</button>
  </section>

  <p v-if="applied" class="ok" role="status" data-testid="import-done">
    反映しました（登録 {{ applied.created }} 件 / 変更 {{ applied.updated }} 件 / 削除 {{ applied.deleted }} 件）
  </p>
</template>
