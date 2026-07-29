// src/apps/divination/services/divinationService.ts

import type { 
  Deck, 
  Spread, 
  DivinationCard, 
  DrawnCard, 
  DivinationReading,
  DeckType
} from '../types'

/** 获取所有可用牌组 */
export function getAvailableDecks(): Deck[] {
  // TODO: 接入实际数据
  return []
}

/** 获取所有可用牌阵 */
export function getAvailableSpreads(): Spread[] {
  // TODO: 接入实际数据
  return []
}

/**
 * 根据牌组类型筛选适用的牌阵。
 * - 如果 spread.supportedDeckTypes 为空或未设置，视为通用牌阵，所有牌组都可用
 * - 否则仅当 deckType 在 supportedDeckTypes 中时返回
 */
export function getSpreadsForDeckType(deckType: DeckType): Spread[] {
  const all = getAvailableSpreads()
  return all.filter(spread => {
    if (!spread.supportedDeckTypes || spread.supportedDeckTypes.length === 0) {
      return true
    }
    return spread.supportedDeckTypes.includes(deckType)
  })
}

/** 根据 ID 获取牌组 */
export function getDeckById(deckId: string): Deck | null {
  const decks = getAvailableDecks()
  return decks.find(d => d.id === deckId) ?? null
}

/** 根据 ID 获取牌阵 */
export function getSpreadById(spreadId: string): Spread | null {
  const spreads = getAvailableSpreads()
  return spreads.find(s => s.id === spreadId) ?? null
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

/** 抽牌 */
export function drawCards(
  deck: Deck,
  spread: Spread,
  shuffledCards: DivinationCard[]
): DrawnCard[] {
  const result: DrawnCard[] = []

  for (let i = 0; i < spread.positions.length; i++) {
    const card = shuffledCards[i]
    const position = spread.positions[i]
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

