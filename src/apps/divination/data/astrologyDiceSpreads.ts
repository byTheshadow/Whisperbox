import type { Spread } from '../types'

export const ASTROLOGY_DICE_SPREADS: Spread[] = [
  {
    id: 'astro-dice-classic',
    name: '三骰同掷',
    description: '三颗骰子同时落下，分别提供能量本源、运动型态和世俗载体的三维视角解构。',
    suitableFor: ['即时局势分析', '核心能量指引', '日常行事建议'],
    supportedDeckTypes: ['astrology-dice'],
    positions: [
      {
        index: 0,
        name: '行星骰 (能量)',
        description: '「什么能量在起作用」——代表整件事背后的驱动力量、原型本源或主体状态。',
        x: 22,
        y: 45,
        rotation: -4,
        categoryFilter: 'planet'
      },
      {
        index: 1,
        name: '星座骰 (方式)',
        description: '「这股能量如何表现」——代表能量在运作时的面貌、色彩、态度、以及推进的节奏方式。',
        x: 50,
        y: 50,
        rotation: 0,
        categoryFilter: 'sign'
      },
      {
        index: 2,
        name: '宫位骰 (领域)',
        description: '「在生活的哪个舞台落地」——代表这股能量碰撞后，最终在具体的哪个现实场景、关系或人生领域产生影响。',
        x: 78,
        y: 55,
        rotation: 6,
        categoryFilter: 'house'
      }
    ]
  }
]
