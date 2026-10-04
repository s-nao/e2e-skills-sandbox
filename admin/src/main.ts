import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

import App from './App.vue'
import { useAuth } from './auth'
import AdminImportPage from './pages/AdminImportPage.vue'
import AdminLayout from './pages/AdminLayout.vue'
import AdminProductFormPage from './pages/AdminProductFormPage.vue'
import AdminProductListPage from './pages/AdminProductListPage.vue'
import AdminSalesPage from './pages/AdminSalesPage.vue'
import ForbiddenPage from './pages/ForbiddenPage.vue'
import LoginPage from './pages/LoginPage.vue'
import './style.css'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: LoginPage, meta: { guestOnly: true } },
    { path: '/forbidden', component: ForbiddenPage },
    {
      path: '/',
      component: AdminLayout,
      meta: { requiresAuth: true, requiresAdmin: true },
      children: [
        { path: '', redirect: '/products' },
        { path: 'products', component: AdminProductListPage },
        { path: 'products/new', component: AdminProductFormPage },
        { path: 'products/import', component: AdminImportPage },
        { path: 'products/:id', component: AdminProductFormPage, props: true },
        { path: 'sales', component: AdminSalesPage },
      ],
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuth()
  await auth.ensureLoaded()
  if (to.meta.requiresAuth && !auth.state.user) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  if (to.meta.requiresAdmin && !auth.state.user?.is_admin) {
    return { path: '/forbidden' }
  }
  if (to.meta.guestOnly && auth.state.user) {
    return { path: '/' }
  }
})

createApp(App).use(router).mount('#app')
