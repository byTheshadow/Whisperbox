import { db } from '@/core/db'
import type { CardSession, WhisperCard } from '@/core/db'
import { sendCardReply } from './cardSessionService'

const PROACTIVE_INTERVALS = [120, 180, 360] // 分钟

function pickRandom<T>(list: T[]): T | null {
  if (!list.length) return null
  const index = Math.floor(Math.random() * list.length)
  return list[index] ?? null
}

function getNextProactiveAt(): number {
  const minutes = pickRandom(PROACTIVE_INTERVALS) ?? 180
  return Date.now() + minutes * 60 * 1000
}

async function getRandomCardFromSessionLibraries(
  session: CardSession
): Promise<WhisperCard | null> {
  const libraryIds = Array.isArray(session.libraryIds) ? session.libraryIds : []
  if (libraryIds.length === 0) return null

  const cards = await db.whisperCards
    .where('libraryId')
    .anyOf(libraryIds)
    .toArray()

  if (cards.length === 0) return null

  return pickRandom(cards)
}

export async function ensureSessionNextProactiveAt(
  sessionId: string
): Promise<void> {
  const session = await db.cardSessions.get(sessionId)
  if (!session) return

  if (!session.proactiveEnabled) return

  if (!session.nextProactiveAt) {
    await db.cardSessions.update(sessionId, {
      nextProactiveAt: getNextProactiveAt()
    })
  }
}

export async function processSessionProactiveMessage(
  sessionId: string
): Promise<boolean> {
  const session = await db.cardSessions.get(sessionId)
  if (!session) return false

  if (!session.proactiveEnabled) return false

  const now = Date.now()

  if (session.nextProactiveAt && now < session.nextProactiveAt) {
    return false
  }

  const card = await getRandomCardFromSessionLibraries(session)
  if (!card) {
    // 没有可投递的字卡，也要重新安排下一次
    await db.cardSessions.update(sessionId, {
      lastProactiveAt: now,
      nextProactiveAt: getNextProactiveAt()
    })
    return false
  }

  await sendCardReply(sessionId, card.content, [card.id])

  await db.cardSessions.update(sessionId, {
    lastProactiveAt: now,
    nextProactiveAt: getNextProactiveAt()
  })

  return true
}

export async function processAllProactiveSessions(): Promise<number> {
  const sessions = await db.cardSessions.toArray()
  let count = 0

  for (const session of sessions) {
    const sent = await processSessionProactiveMessage(session.id)
    if (sent) count += 1
  }

  return count
}

export function getProactiveIntervals(): number[] {
  return [...PROACTIVE_INTERVALS]
}
