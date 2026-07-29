import { db } from '@/core/db'
import type { DailyRitual, WhisperCard } from '@/core/db'
import { drawRandomCard } from './cardReplyService'

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

/**
 * 生成今日仪式
 * tarotData 暂时用占位，等你给塔罗数据后替换
 */
export async function generateDailyRitual(): Promise<DailyRitual> {
  // 塔罗牌占位（后续替换为真实数据）
  const tarotIndex = Math.floor(Math.random() * 78)
  const tarotInterpretation = `塔罗牌 #${tarotIndex} 的今日解读（占位，等待数据接入）`

  // 随机抽取一条字卡
  const card = await drawRandomCard([])
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
