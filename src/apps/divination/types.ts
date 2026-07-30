// src/apps/divination/types.ts

export type DeckType =
  | 'tarot'
  | 'lenormand'
  | 'spirit'
  | 'astrology-dice'
  | 'custom'

export interface DivinationCard {
  id: string
  deckType: DeckType
  name: string
  imageUrl: string
  /** 内联 SVG 字符串，优先级最高 */
  iconSvg?: string
  /** Unicode 符号（如 ☉ ♈ I），SVG 缺失时显示 */
  symbol?: string
  /** 分类标签，供 categoryFilter 使用（如占星骰子的 'planet' | 'sign' | 'house'） */
  category?: string
  uprightKeywords: string[]
  reversedKeywords: string[]
  uprightMeaning: string
  reversedMeaning: string
  order: number
}

export interface Deck {
  id: string
  type: DeckType
  name: string
  description: string
  allowReversed: boolean
  backImageUrl: string
  cards: DivinationCard[]
}

export interface SpreadPosition {
  index: number
  name: string
  description: string
  x: number
  y: number
  rotation: number
  /** 若指定，则此位置只从匹配该 category 的牌中抽取（用于占星骰子等分池抽取） */
  categoryFilter?: string
}

export interface Spread {
  id: string
  name: string
  description: string
  suitableFor: string[]
  supportedDeckTypes?: DeckType[]
  positions: SpreadPosition[]
}

export interface DrawnCard {
  card: DivinationCard
  position: SpreadPosition
  isReversed: boolean
}

export interface DivinationReading {
  id: string
  deckId: string
  spreadId: string
  question: string
  drawnCards: DrawnCard[]
  aiInterpretation: string | null
  createdAt: number
}

export type DivinationStep =
  | 'select-deck'
  | 'select-spread'
  | 'input-question'
  | 'shuffle'
  | 'draw'
  | 'reveal'
  | 'result'
