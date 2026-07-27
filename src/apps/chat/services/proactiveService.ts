import { db } from '@/core/db'
import { sendProactiveReply } from './chatService'

let proactiveTimer: number | null = null
let isRunning = false

/**
 * 计算下次是否该触发主动消息
 */
function shouldTriggerProactive(session: {
  proactiveEnabled?: boolean
  proactiveFrequencyMinutes?: number
  lastProactiveAt?: number | null
}): boolean {
  if (!session.proactiveEnabled) return false

  const frequencyMinutes = session.proactiveFrequencyMinutes || 120
  const lastAt = session.lastProactiveAt || 0
  const now = Date.now()

  return now - lastAt >= frequencyMinutes * 60 * 1000
}

/**
 * 向当前会话触发主动消息
 */
async function triggerSessionProactive(sessionId: string) {
  const session = await db.chatSessions.get(sessionId)
  if (!session) return
  if (!session.proactiveEnabled) return

  const character = await db.characters.get(session.characterId)
  if (!character) return

  const persona = session.personaId
    ? await db.personas.get(session.personaId)
    : null

  const replyMessages = await sendProactiveReply(
    sessionId,
    session.characterId,
    persona?.description || ''
  )

  await db.chatSessions.update(sessionId, {
    lastProactiveAt: Date.now(),
    lastMessageAt: Date.now()
  })

  // 通知
  if (
    session.proactiveNotify &&
    'Notification' in window &&
    Notification.permission === 'granted'
  ) {
    new Notification(character.name || 'Whisperbox', {
      body: replyMessages[0]?.content || '你收到了一条主动消息'
    })
  }
}

/**
 * 扫描所有会话，必要时触发主动消息
 */
async function scanProactiveSessions() {
  const sessions = await db.chatSessions.toArray()

  for (const session of sessions) {
    if (!shouldTriggerProactive(session)) continue

    try {
      await triggerSessionProactive(session.id)
    } catch (error) {
      console.error('[proactive] trigger failed:', session.id, error)
    }
  }
}

/**
 * 启动主动消息轮询
 * 页面打开后调用一次即可
 */
export function startProactiveScheduler(intervalMs = 60 * 1000) {
  if (isRunning) return
  isRunning = true

  // 先立即扫一次
  void scanProactiveSessions()

  proactiveTimer = window.setInterval(() => {
    void scanProactiveSessions()
  }, intervalMs)
}

/**
 * 停止主动消息轮询
 */
export function stopProactiveScheduler() {
  if (proactiveTimer !== null) {
    window.clearInterval(proactiveTimer)
    proactiveTimer = null
  }

  isRunning = false
}

/**
 * 允许页面手动请求通知权限
 */
export async function requestProactiveNotificationPermission(): Promise<NotificationPermission | null> {
  if (!('Notification' in window)) return null
  return await Notification.requestPermission()
}
