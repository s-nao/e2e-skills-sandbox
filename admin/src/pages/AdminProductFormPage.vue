<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { api, ApiError, type Category } from '../api'

const props = defineProps<{ id?: string }>()
const router = useRouter()

const categories = ref<Category[]>([])
const form = reactive({ sku: '', name: '', description: '', category_id: 0, price: 0, stock: 0, is_active: true })
const submitting = ref(false)
const error = ref('')
const notFound = ref(false)
const loaded = ref(false)

onMounted(async () => {
  categories.value = await api.categories()
  if (props.id) {
    try {
      const { category, ...p } = await api.admin.product(Number(props.id))
      Object.assign(form, p, { category_id: category.id })
    } catch {
      notFound.value = true
    }
  } else {
    form.category_id = categories.value[0]?.id ?? 0
  }
  loaded.value = true
})

async function submit() {
  submitting.value = true
  error.value = ''
  try {
    if (props.id) await api.admin.updateProduct(Number(props.id), form)
    else await api.admin.createProduct(form)
    router.push('/products')
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : '保存に失敗しました'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <h2>{{ id ? '商品を編集' : '商品を登録' }}</h2>
  <p v-if="notFound" class="error" role="alert" data-testid="admin-form-notfound">商品が見つかりません</p>
  <form v-else-if="loaded" class="form" data-testid="admin-product-form" @submit.prevent="submit">
    <label>SKU <input v-model="form.sku" required maxlength="40" pattern="[A-Za-z0-9_\-]+" data-testid="form-sku" /></label>
    <label>商品名 <input v-model="form.name" required maxlength="100" data-testid="form-name" /></label>
    <label>説明 <textarea v-model="form.description" maxlength="1000" data-testid="form-description" /></label>
    <label>
      カテゴリ
      <select v-model="form.category_id" data-testid="form-category">
        <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
    </label>
    <label>価格（税込・円） <input v-model.number="form.price" type="number" min="0" required data-testid="form-price" /></label>
    <label>在庫 <input v-model.number="form.stock" type="number" min="0" required data-testid="form-stock" /></label>
    <label class="inline"><input v-model="form.is_active" type="checkbox" data-testid="form-active" /> 販売中</label>
    <div class="row">
      <button type="submit" :disabled="submitting" data-testid="form-submit">保存</button>
      <RouterLink to="/products">キャンセル</RouterLink>
    </div>
    <p v-if="error" class="error" role="alert" data-testid="form-error">{{ error }}</p>
  </form>
</template>
