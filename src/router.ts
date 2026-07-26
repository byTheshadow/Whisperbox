import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/apps/main/MainView.vue')
    },
    {
      path: '/chat',
      name: 'chat',
      component: () => import('@/apps/chat/ChatView.vue')
    },
    {
      path: '/cards',
      name: 'cards',
      component: () => import('@/apps/cards/CardsView.vue')
    },
    {
      path: '/memory',
      name: 'memory',
      component: () => import('@/apps/memory/MemoryView.vue')
    },
    {
      path: '/todo',
      name: 'todo',
      component: () => import('@/apps/todo/TodoView.vue')
    },
    {
      path: '/notes',
      name: 'notes',
      component: () => import('@/apps/notes/NotesView.vue')
    },
    {
      path: '/divination',
      name: 'divination',
      component: () => import('@/apps/divination/DivinationView.vue')
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/apps/settings/SettingsView.vue')
    }
  ]
})

export default router
