import { db } from '@/core/db'
import { sendProactiveReply } from './chatService'

let proactiveTimer: number | null = null
let isRunning = false

function getCurrentHour(): number {
  return new Date().getHours()
}

function isNightTime(): boolean {
  const hour = getCurrentHour()
  return hour >= 23 || hour < 7
}

function getRecentMessageCount(messages: Array<{ timestamp: number }>, minutes = 60): number {
  const now = Date.now()
  const windowMs = minutes * 60 * 1000
  return messages.filter(msg => now - msg.timestamp <= windowMs).length
}

function shouldTriggerByConversationLength(
  totalMessages: number,
  minMessageCount: number,
  recentMessageCount: number,
  maxRecentMessages: number
): boolean {
  if (totalMessages < minMessageCount) return false
  if (recentMessageCount > maxRecentMessages) return false
  return true
}

function shouldTriggerProactive(session: {
  proactiveEnabled?: boolean
  proactiveFrequencyMinutes?: number
  proactiveSilentNight?: boolean
  proactiveRequirePersonality?: boolean
  proactiveAllowDrawing?: boolean
  proactiveMinMessageCount?: number
  proactiveMaxRecentMessages?: number
  proactiveOnlyWhenLongConversation?: boolean
  lastProactiveAt?: number | null
  mode?: 'daily' | 'roleplay'
}): boolean {
  if (!session.proactiveEnabled) return false

  const now = Date.now()
  const frequencyMinutes = session.proactiveFrequencyMinutes || 120
  const lastAt = session.lastProactiveAt || 0

  // 频率控制
  if (now - lastAt < frequencyMinutes * 60 * 1000) return false

  // 夜间静默
  if (session.proactiveSilentNight && isNightTime()) return false

  return true
}

function buildTriggerReason(params: {
  mode: 'daily' | 'roleplay'
  characterPersonality: string
  allowDrawing: boolean
}): string {
  const { mode, characterPersonality, allowDrawing } = params

  const base = mode === 'daily'
    ? '日常模式：像问候、关心、短短信'
    : 'RP 模式：像剧情推进、场景触发、角色来信'

  const drawing = allowDrawing
    ? '允许在合适的时候使用绘画/图像类表达，但不要强制。'
    : '不要主动使用绘画/图像表达，除非语境非常自然。'

  return `你必须按角色性格主动发消息。
角色性格：${characterPersonality || '未提供'}
${base}
${drawing}`
}

async function triggerSessionProactive(sessionId: string) {
  const session = await db.chatSessions.get(sessionId)
  if (!session) return
  if (!session.proactiveEnabled) return

  const character = await db.characters.get(session.characterId)
  if (!character) return

  const persona = session.personaId
    ? await db.personas.get(session.personaId)
    : null

  const messages = await db.messages
    .where('sessionId')
    .equals(sessionId)
    .sortBy('timestamp')

  const totalMessages = messages.length
  const recentMessages = messages.filter(msg => msg.role !== 'system')
  const recentMessageCount = getRecentMessageCount(recentMessages, 60)

  const minMessageCount = session.proactiveMinMessageCount || 8
  const maxRecentMessages = session.proactiveMaxRecentMessages ?? 3

  // 对话长度限制，避免太短就主动，或者刚聊完又刷屏
  if (
    session.proactiveOnlyWhenLongConversation &&
    !shouldTriggerByConversationLength(
      totalMessages,
      minMessageCount,
      recentMessageCount,
      maxRecentMessages
    )
  ) {
    return
  }

  // 必须按角色性格触发
  const triggerReason = buildTriggerReason({
    mode: session.mode || 'roleplay',
    characterPersonality: character.personality,
    allowDrawing: Boolean(session.proactiveAllowDrawing)
  })

  const replyMessages = await sendProactiveReply(
    sessionId,
    session.characterId,
    persona?.description || '',
    {
      mode: session.mode || 'roleplay',
      conversationLength: totalMessages
    }
  )

  const now = Date.now()

  await db.chatSessions.update(sessionId, {
    lastProactiveAt: now,
    lastMessageAt: now
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

  console.log('[proactive] triggered:', {
    sessionId,
    triggerReason
  })
}

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

export function startProactiveScheduler(intervalMs = 60 * 1000) {
  if (isRunning) return
  isRunning = true

  void scanProactiveSessions()

  proactiveTimer = window.setInterval(() => {
    void scanProactiveSessions()
  }, intervalMs)
}

export function stopProactiveScheduler() {
  if (proactiveTimer !== null) {
    window.clearInterval(proactiveTimer)
    proactiveTimer = null
  }

  isRunning = false
}

export async function requestProactiveNotificationPermission(): Promise<NotificationPermission | null> {
  if (!('Notification' in window)) return null
  return await Notification.requestPermission()
}
