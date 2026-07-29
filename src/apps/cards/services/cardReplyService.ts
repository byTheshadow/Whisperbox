import { db } from '@/core/db'
import type { WhisperCard } from '@/core/db'

/**
 * 纯随机抽取：按 weight 加权从指定库中抽取 N 条
 */
export async function drawRandomCards(libraryIds: string[], count: number = 1): Promise<WhisperCard[]> {
  let cards: WhisperCard[]
  if (libraryIds.length === 0) {
    cards = await db.whisperCards.toArray()
  } else {
    cards = await db.whisperCards.where('libraryId').anyOf(libraryIds).toArray()
  }

  if (cards.length === 0) return []

  const result: WhisperCard[] = []
  const pool = [...cards]

  for (let i = 0; i < count && pool.length > 0; i++) {
    const picked = weightedRandom(pool)
    result.push(picked)
    // 避免重复抽到同一张
    const idx = pool.findIndex(c => c.id === picked.id)
    if (idx !== -1) pool.splice(idx, 1)
  }

  return result
}

/**
 * 关键词匹配抽取：扫描 user 消息，匹配 triggerWords
 * 匹配到则按 weight 加权选取
 * 没匹配到则返回 null（由调用方决定是否 fallback）
 */
export async function drawByKeyword(
  userText: string,
  libraryIds: string[]
): Promise<WhisperCard | null> {
  let cards: WhisperCard[]
  if (libraryIds.length === 0) {
    cards = await db.whisperCards.toArray()
  } else {
    cards = await db.whisperCards.where('libraryId').anyOf(libraryIds).toArray()
  }

  if (cards.length === 0) return null

  const lowerText = userText.toLowerCase()

  const matched = cards.filter(card =>
    card.triggerWords.some(tw => lowerText.includes(tw.toLowerCase()))
  )

  if (matched.length > 0) {
    return weightedRandom(matched)
  }

  return null
}

/**
 * 按 weight 加权随机
 */
function weightedRandom(cards: WhisperCard[]): WhisperCard {
  const totalWeight = cards.reduce((sum, c) => sum + (c.weight || 1), 0)
  let rand = Math.random() * totalWeight
  for (const card of cards) {
    rand -= (card.weight || 1)
    if (rand <= 0) return card
  }
  return cards[cards.length - 1]
}
