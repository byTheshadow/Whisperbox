// src/apps/divination/types.ts

/** 牌组类型 */
export type DeckType = 'tarot' | 'lenormand' | 'spirit' | 'custom'

/** 单张牌 */
export interface DivinationCard {
  id: string
  deckType: DeckType
  name: string
  /** 牌面图片 URL，留空则用默认占位 */
  imageUrl: string
  /** 正位关键词 */
  uprightKeywords: string[]
  /** 逆位关键词（部分牌组不用逆位） */
  reversedKeywords: string[]
  /** 正位含义 */
  uprightMeaning: string
  /** 逆位含义 */
  reversedMeaning: string
  /** 牌的编号或序号 */
  order: number
}

/** 牌组 */
export interface Deck {
  id: string
  type: DeckType
  name: string
  description: string
  /** 是否支持逆位 */
  allowReversed: boolean
  /** 牌背图片 */
  backImageUrl: string
  cards: DivinationCard[]
}

/** 牌阵中的位置定义 */
export interface SpreadPosition {
  /** 位置编号，从 1 开始 */
  index: number
  /** 位置名称，如"过去"、"现在"、"未来" */
  name: string
  /** 位置含义说明 */
  description: string
  /** 显示坐标（用于布局），0-100 百分比 */
  x: number
  y: number
  /** 旋转角度 */
  rotation: number
}

/** 牌阵 */
export interface Spread {
  id: string
  name: string
  description: string
  /** 适合的问题类型 */
  suitableFor: string[]
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
  /** AI 解读内容 */
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
