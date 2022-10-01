import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/settings',
    name: 'settings',
    component: () => import('../views/SettingsView.vue')
  },
  {
    path: '/setup',
    name: 'setup',
    component: () => import('../views/SetupView.vue')
  },
  {
    path: '/generate',
    name: 'generate',
    component: () => import('../views/GenerateView.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
