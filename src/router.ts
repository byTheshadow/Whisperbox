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
      component: () => import('@/apps/chat/ChatListView.vue')
    },
    {
      path: '/chat/:sessionId',
      name: 'chat-session',
      component: () => import('@/apps/chat/ChatSessionView.vue')
    },
    {
      path: '/cards',
      name: 'cards',
      component: () => import('@/apps/cards/CardsHomeView.vue')
    },
    {
      path: '/cards/library',
      name: 'cards-library',
      component: () => import('@/apps/cards/CardsLibraryView.vue')
    },
    {
  path: '/cards/characters',
  name: 'cards-characters',
  component: () => import('@/apps/cards/CardsCharactersView.vue')
},
    {
      path: '/cards/session/:sessionId',
      name: 'cards-session',
      component: () => import('@/apps/cards/CardsSessionView.vue')
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

