import { db } from '@/core/db'
import type { DailyRitual } from '@/core/db'
import { drawRandomCards } from './cardReplyService'

function todayId(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export async function getTodayRitual(): Promise<DailyRitual | undefined> {
  return db.dailyRituals.get(todayId())
}

export async function hasTodayRitual(): Promise<boolean> {
  const r = await db.dailyRituals.get(todayId())
  return !!r
}

export async function generateDailyRitual(): Promise<DailyRitual> {
  const tarotIndex = Math.floor(Math.random() * 78)
  const tarotInterpretation = `塔罗牌 #${tarotIndex} 的今日解读（占位，等待数据接入）`

  const cards = await drawRandomCards([], 1)
  const card = cards[0] || null
  const whisperCardId = card?.id || ''
  const whisperContent = card?.content || '今天没有新的私语'

  const ritual: DailyRitual = {
    id: todayId(),
    tarotCardIndex: tarotIndex,
    tarotInterpretation,
    whisperCardId,
    whisperContent,
    completedAt: Date.now()
  }

  await db.dailyRituals.put(ritual)
  return ritual
}
