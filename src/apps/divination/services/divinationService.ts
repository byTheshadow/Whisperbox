// src/apps/divination/services/divinationService.ts

import type {
  Deck,
  Spread,
  DivinationCard,
  DrawnCard,
  DivinationReading,
  DeckType
} from '../types'
import { ALL_DECKS, ALL_SPREADS } from '../data'

/** 获取所有可用牌组 */
export function getAvailableDecks(): Deck[] {
  return ALL_DECKS
}

/** 获取所有可用牌阵 */
export function getAvailableSpreads(): Spread[] {
  return ALL_SPREADS
}

/** 根据牌组类型筛选适用的牌阵 */
export function getSpreadsForDeckType(deckType: DeckType): Spread[] {
  return ALL_SPREADS.filter(spread => {
    if (!spread.supportedDeckTypes || spread.supportedDeckTypes.length === 0) {
      return true
    }
    return spread.supportedDeckTypes.includes(deckType)
  })
}

/** 根据 ID 获取牌组 */
export function getDeckById(deckId: string): Deck | null {
  return ALL_DECKS.find(d => d.id === deckId) ?? null
}

/** 根据 ID 获取牌阵 */
export function getSpreadById(spreadId: string): Spread | null {
  return ALL_SPREADS.find(s => s.id === spreadId) ?? null
}

/** 洗牌 */
export function shuffleDeck(cards: DivinationCard[]): DivinationCard[] {
  const shuffled = [...cards]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * 抽牌
 * - 如果位置未指定 categoryFilter，按顺序从 shuffledCards 抽取
 * - 如果位置指定了 categoryFilter，仅从匹配该 category 的牌中抽取
 * 已抽出的牌不会重复出现
 */
export function drawCards(
  deck: Deck,
  spread: Spread,
  shuffledCards: DivinationCard[]
): DrawnCard[] {
  const result: DrawnCard[] = []
  const used = new Set<string>()

  for (const position of spread.positions) {
    let card: DivinationCard | undefined

    if (position.categoryFilter) {
      card = shuffledCards.find(
        c => c.category === position.categoryFilter && !used.has(c.id)
      )
    } else {
      card = shuffledCards.find(c => !used.has(c.id))
    }

    if (!card) continue

    used.add(card.id)
    const isReversed = deck.allowReversed ? Math.random() > 0.5 : false
    result.push({ card, position, isReversed })
  }

  return result
}

/** 创建占卜记录 */
export function createReading(
  deckId: string,
  spreadId: string,
  question: string,
  drawnCards: DrawnCard[]
): DivinationReading {
  return {
    id: crypto.randomUUID(),
    deckId,
    spreadId,
    question,
    drawnCards,
    aiInterpretation: null,
    createdAt: Date.now()
  }
}
