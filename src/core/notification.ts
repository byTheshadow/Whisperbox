import {
  isPermissionGranted,
  requestPermission,
  sendNotification
} from '@tauri-apps/api/notification'

/**
 * 发送系统通知（自动兼容 Tauri 和 PWA）
 */
export async function pushNotification(title: string, body: string): Promise<void> {
  // 尝试 Tauri 原生通知
  try {
    let granted = await isPermissionGranted()
    if (!granted) {
      const permission = await requestPermission()
      granted = permission === 'granted'
    }
    if (granted) {
      sendNotification({ title, body })
      return
    }
  } catch {
    // 非 Tauri 环境，降级到 Web Notification
  }

  // PWA / 浏览器 降级
  if ('Notification' in window) {
    if (Notification.permission === 'default') {
      await Notification.requestPermission()
    }
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/icon-192.png' })
    }
  }
}
