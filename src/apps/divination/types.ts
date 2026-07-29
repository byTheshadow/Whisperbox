// src/apps/divination/types.ts
/** 牌组类型 */
export type DeckType = 'tarot' | 'lenormand' | 'spirit' | 'custom'

/** 单张牌 */
export interface DivinationCard {
  id: string
  deckType: DeckType
  name: string
  imageUrl: string
  uprightKeywords: string[]
  reversedKeywords: string[]
  uprightMeaning: string
  reversedMeaning: string
  order: number
}

/** 牌组 */
export interface Deck {
  id: string
  type: DeckType
  name: string
  description: string
  allowReversed: boolean
  backImageUrl: string
  cards: DivinationCard[]
}

/** 牌阵中的位置定义 */
export interface SpreadPosition {
  index: number
  name: string
  description: string
  x: number
  y: number
  rotation: number
}

/** 牌阵 */
export interface Spread {
  id: string
  name: string
  description: string
  suitableFor: string[]
  /**
   * 支持的牌组类型。
   * 为空数组或 undefined 表示通用牌阵，任何牌组都可以用。
   */
  supportedDeckTypes?: DeckType[]
  positions: SpreadPosition[]
}

/** 抽到的一张牌 */
export interface DrawnCard {
  card: DivinationCard
  position: SpreadPosition
  isReversed: boolean
}

/** 一次占卜记录 */
export interface DivinationReading {
  id: string
  deckId: string
  spreadId: string
  question: string
  drawnCards: DrawnCard[]
  aiInterpretation: string | null
  createdAt: number
}

/** 占卜流程状态 */
export type DivinationStep = 
  | 'select-deck'
  | 'select-spread'
  | 'input-question'
  | 'shuffle'
  | 'draw'
  | 'reveal'
  | 'result'
