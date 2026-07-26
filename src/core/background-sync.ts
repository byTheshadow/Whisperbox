/**
 * 注册 Periodic Background Sync
 * 仅在支持的浏览器中生效（Chrome/Edge 桌面端 + Android）
 * 允许 Service Worker 在页面关闭后被周期性唤醒
 */
export async function registerPeriodicSync(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false

  try {
    const registration = await navigator.serviceWorker.ready

    // 检查浏览器是否支持 periodicSync
    if (!('periodicSync' in registration)) {
      console.warn('[BackgroundSync] 当前浏览器不支持 Periodic Background Sync')
      return false
    }

    // 检查权限
    const status = await navigator.permissions.query({
      name: 'periodic-background-sync' as any
    })

    if (status.state !== 'granted') {
      console.warn('[BackgroundSync] 权限未授予，状态:', status.state)
      return false
    }

    // 注册周期性同步，最小间隔 1 小时
    await (registration as any).periodicSync.register('whisperbox-heartbeat', {
      minInterval: 60 * 60 * 1000
    })

    console.info('[BackgroundSync] 已注册 whisperbox-heartbeat')
    return true
  } catch (e) {
    console.warn('[BackgroundSync] 注册失败:', e)
    return false
  }
}

/**
 * 注销周期性同步
 */
export async function unregisterPeriodicSync(): Promise<void> {
  if (!('serviceWorker' in navigator)) return

  try {
    const registration = await navigator.serviceWorker.ready
    if ('periodicSync' in registration) {
      await (registration as any).periodicSync.unregister('whisperbox-heartbeat')
    }
  } catch (e) {
    console.warn('[BackgroundSync] 注销失败:', e)
  }
}
