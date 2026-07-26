/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope

// Workbox 预缓存（vite-plugin-pwa injectManifest 自动注入资源清单）
precacheAndRoute(self.__WB_MANIFEST)

// ========== 周期性后台同步 ==========
self.addEventListener('periodicsync', (event: any) => {
  if (event.tag === 'whisperbox-heartbeat') {
    event.waitUntil(handleBackgroundCheck())
  }
})

async function handleBackgroundCheck() {
  // 打开 IndexedDB 读取设置，判断是否开启了主动推送
  try {
    const db = await openWhisperboxDB()
    const settings = await getSettings(db)

    if (!settings || !settings.proactivePushEnabled) return

    // 检查是否有到期的 Todo
    const now = Date.now()
    const dueTodos = await getDueTodos(db, now)

    if (dueTodos.length > 0) {
      await self.registration.showNotification('Whisperbox', {
        body: `你有 ${dueTodos.length} 项待办已到期。`,
        icon: '/Whisperbox/icon-192.png',
        badge: '/Whisperbox/icon-192.png',
        tag: 'whisperbox-todo-reminder',
        renotify: true
      })
    } else {
      // 没有紧急事项时，可以触发角色主动传讯通知
      await self.registration.showNotification('Whisperbox', {
        body: '有人在低语，点击查看。',
        icon: '/Whisperbox/icon-192.png',
        badge: '/Whisperbox/icon-192.png',
        tag: 'whisperbox-proactive',
        renotify: true
      })
    }

    db.close()
  } catch (e) {
    console.warn('[SW] 后台检查失败:', e)
  }
}

// ========== 通知点击处理 ==========
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // 如果已有窗口，聚焦
      for (const client of clients) {
        if ('focus' in client) return client.focus()
      }
      // 否则打开新窗口
      return self.clients.openWindow('/Whisperbox/')
    })
  )
})

// ========== IndexedDB 直接读取工具函数 ==========
// Service Worker 中无法使用 Dexie，需要原生 IndexedDB API

function openWhisperboxDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('whisperbox')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function getSettings(db: IDBDatabase): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction('appSettings', 'readonly')
      const store = tx.objectStore('appSettings')
      const request = store.get('global')
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    } catch {
      resolve(null)
    }
  })
}

function getDueTodos(db: IDBDatabase, now: number): Promise<any[]> {
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction('todoItems', 'readonly')
      const store = tx.objectStore('todoItems')
      const index = store.index('remindAt')
      const range = IDBKeyRange.upperBound(now)
      const request = index.getAll(range)
      request.onsuccess = () => {
        // 过滤掉已完成的
        const results = (request.result || []).filter(
          (item: any) => !item.completed && item.remindAt && item.remindAt <= now
        )
        resolve(results)
      }
      request.onerror = () => reject(request.error)
    } catch {
      resolve([])
    }
  })
}
