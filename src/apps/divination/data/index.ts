// src/apps/divination/data/index.ts

import type { Deck, Spread } from '../types'

import { TAROT_DECK } from './tarotCards'
import { LENORMAND_DECK } from './lenormandCards'
import { SPREADS as TAROT_SPREADS } from './spreads'
import { LENORMAND_SPREADS } from './lenormandSpreads'

/** 所有牌组 */
export const ALL_DECKS: Deck[] = [
  TAROT_DECK,
  LENORMAND_DECK
]

/** 所有牌阵 */
export const ALL_SPREADS: Spread[] = [
  ...TAROT_SPREADS,
  ...LENORMAND_SPREADS
]

