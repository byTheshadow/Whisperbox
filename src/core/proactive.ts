import { db } from './db'
import { pushNotification } from './notification'

let heartbeatTimer: ReturnType<typeof setInterval> | null = null

/**
 * 启动前台主动推送心跳
 * 页面活跃时每隔 intervalSec 秒检查一次是否需要触发主动行为
 */
export function startProactiveLoop(intervalSec: number) {
  stopProactiveLoop()
  heartbeatTimer = setInterval(() => {
    checkAndTrigger()
  }, intervalSec * 1000)
}

export function stopProactiveLoop() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
}

/**
 * 核心检查逻辑：判断是否满足主动推送条件
 */
async function checkAndTrigger() {
  try {
    const settings = await db.appSettings.get('global')
    if (!settings || !settings.proactivePushEnabled) return

    const now = Date.now()

    // 检查1：到期的 Todo
    const dueTodos = await db.todoItems
      .where('remindAt')
      .belowOrEqual(now)
      .filter(item => !item.completed)
      .toArray()

    if (dueTodos.length > 0) {
      await pushNotification(
        'Whisperbox',
        `你有 ${dueTodos.length} 项待办需要处理。`
      )
      return
    }

    // 检查2：距离上次对话是否超过设定阈值（触发角色主动传讯）
    const sessions = await db.chatSessions
      .orderBy('lastMessageAt')
      .reverse()
      .limit(1)
      .toArray()

    if (sessions.length > 0) {
      const lastChat = sessions[0]
      const silenceDuration = now - lastChat.lastMessageAt
      const threshold = settings.proactiveCheckInterval * 1000

      if (silenceDuration >= threshold) {
        await pushNotification(
          'Whisperbox',
          '有人在低语，点击查看。'
        )
      }
    }
  } catch (e) {
    console.warn('[Proactive] 检查失败:', e)
  }
}
