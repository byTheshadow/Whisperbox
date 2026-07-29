import { db } from '@/core/db'
import type { WhisperCard } from '@/core/db'

/**
 * 纯随机抽取：按 weight 加权从指定库中抽取一条
 */
export async function drawRandomCard(libraryIds: string[]): Promise<WhisperCard | null> {
  let cards: WhisperCard[]
  if (libraryIds.length === 0) {
    cards = await db.whisperCards.toArray()
  } else {
    cards = await db.whisperCards.where('libraryId').anyOf(libraryIds).toArray()
  }

  if (cards.length === 0) return null

  return weightedRandom(cards)
}

/**
 * 关键词匹配抽取：扫描 user 消息，匹配 triggerWords
 * 匹配到则按 weight 加权选一条
 * 没匹配到则 fallback 到纯随机
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

  // 匹配 triggerWords
  const matched = cards.filter(card =>
    card.triggerWords.some(tw => lowerText.includes(tw.toLowerCase()))
  )

  if (matched.length > 0) {
    return weightedRandom(matched)
  }

  // fallback
  return weightedRandom(cards)
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
