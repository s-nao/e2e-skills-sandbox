import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

import App from './App.vue'
import { useAuth } from './auth'
import CartPage from './pages/CartPage.vue'
import LoginPage from './pages/LoginPage.vue'
import OrderCompletePage from './pages/OrderCompletePage.vue'
import OrderHistoryPage from './pages/OrderHistoryPage.vue'
import ProductDetailPage from './pages/ProductDetailPage.vue'
import ProductListPage from './pages/ProductListPage.vue'
import './style.css'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: ProductListPage },
    { path: '/products/:id', component: ProductDetailPage, props: true },
    { path: '/cart', component: CartPage },
    { path: '/login', component: LoginPage, meta: { guestOnly: true } },
    { path: '/orders/complete/:id', component: OrderCompletePage, props: true, meta: { requiresAuth: true } },
    { path: '/orders', component: OrderHistoryPage, meta: { requiresAuth: true } },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuth()
  await auth.ensureLoaded()
  if (to.meta.requiresAuth && !auth.state.user) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  if (to.meta.guestOnly && auth.state.user) {
    return { path: '/' }
  }
})

createApp(App).use(router).mount('#app')
