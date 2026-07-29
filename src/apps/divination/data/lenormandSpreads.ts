// src/apps/divination/data/lenormandSpreads.ts

import type { Spread } from '../types'

export const LENORMAND_SPREADS: Spread[] = [
  {
    id: 'lenormand-single',
    name: '单牌指引',
    description: '每日一牌或简单提问。抽取一张牌获得当下的能量指引。',
    suitableFor: ['每日指引', '简单提问', '快速回答'],
    supportedDeckTypes: ['lenormand'],
    positions: [
      { index: 1, name: '指引', description: '当前能量或今日主题', x: 50, y: 50, rotation: 0 }
    ]
  },

  {
    id: 'lenormand-three-line',
    name: '三牌线性',
    description: '雷诺曼经典串联法：三张牌共同讲述一个完整的故事。中间为核心牌，左右为修饰或因果。',
    suitableFor: ['具体问题', '事态发展', '因果关联'],
    supportedDeckTypes: ['lenormand'],
    positions: [
      { index: 1, name: '起因/过去', description: '事件的起点或背景', x: 25, y: 50, rotation: 0 },
      { index: 2, name: '核心/现状', description: '问题的核心或当前状态', x: 50, y: 50, rotation: 0 },
      { index: 3, name: '结果/未来', description: '事情的走向或最终答案', x: 75, y: 50, rotation: 0 }
    ]
  },

  {
    id: 'lenormand-five-line',
    name: '五牌线性',
    description: '在三牌基础上扩展，提供更细致的时间脉络与故事细节。正中心永远是核心牌。',
    suitableFor: ['时间脉络', '多层因素', '深入问题'],
    supportedDeckTypes: ['lenormand'],
    positions: [
      { index: 1, name: '远因', description: '较远的过去或根本原因', x: 15, y: 50, rotation: 0 },
      { index: 2, name: '近因', description: '近期的影响因素', x: 32.5, y: 50, rotation: 0 },
      { index: 3, name: '核心', description: '问题的中心与本质', x: 50, y: 50, rotation: 0 },
      { index: 4, name: '近果', description: '即将发生的发展', x: 67.5, y: 50, rotation: 0 },
      { index: 5, name: '远果', description: '最终结果或长远影响', x: 85, y: 50, rotation: 0 }
    ]
  },

  {
    id: 'lenormand-cross-five',
    name: '十字牌阵',
    description: '从内外因素剖析问题。中心为核心，左右看时间发展，上下看意识、外部压力与内在基础。',
    suitableFor: ['事件剖析', '驱动力分析', '抉择建议'],
    supportedDeckTypes: ['lenormand'],
    positions: [
      { index: 1, name: '核心', description: '当前的状况或问题核心', x: 50, y: 50, rotation: 0 },
      { index: 2, name: '过去/起因', description: '导致现状的原因', x: 25, y: 50, rotation: 0 },
      { index: 3, name: '未来/发展', description: '自然发展下的走向', x: 75, y: 50, rotation: 0 },
      { index: 4, name: '外部/意识', description: '外部环境的压力、助力或你的显意识', x: 50, y: 20, rotation: 0 },
      { index: 5, name: '基础/潜意识', description: '隐藏的根基或你可以掌控的行动', x: 50, y: 80, rotation: 0 }
    ]
  },

  {
    id: 'lenormand-nine-square',
    name: '九宫格',
    description: '雷诺曼进阶核心牌阵。中心牌为问题灵魂，通过横行（意识/现状/基础）、竖列（过去/现在/未来）及对角线全方位解读。',
    suitableFor: ['综合分析', '多维视角', '特定项目全貌'],
    supportedDeckTypes: ['lenormand'],
    positions: [
      { index: 1, name: '过去（上）', description: '过去的意识层面或外部影响', x: 25, y: 20, rotation: 0 },
      { index: 2, name: '现在（上）', description: '当前的意识层面或表面现象', x: 50, y: 20, rotation: 0 },
      { index: 3, name: '未来（上）', description: '未来的目标或显现的结果', x: 75, y: 20, rotation: 0 },
      { index: 4, name: '过去（中）', description: '过去的实际状况', x: 25, y: 50, rotation: 0 },
      { index: 5, name: '核心', description: '问题的中心与本质', x: 50, y: 50, rotation: 0 },
      { index: 6, name: '未来（中）', description: '未来的实际发展', x: 75, y: 50, rotation: 0 },
      { index: 7, name: '过去（下）', description: '过去的隐藏基础或根源', x: 25, y: 80, rotation: 0 },
      { index: 8, name: '现在（下）', description: '当前的隐藏问题或潜意识', x: 50, y: 80, rotation: 0 },
      { index: 9, name: '未来（下）', description: '最终的深远影响', x: 75, y: 80, rotation: 0 }
    ]
  },

  {
    id: 'lenormand-relationship-h',
    name: 'H关系牌阵',
    description: '雷诺曼专用的感情/人际关系牌阵，呈 H 形排列。左右两列分别代表双方，中间代表当前关系的连接与纽带。',
    suitableFor: ['感情', '人际关系', '双方互动'],
    supportedDeckTypes: ['lenormand'],
    positions: [
      { index: 1, name: 'A的想法', description: 'A方对关系的认知与显意识', x: 20, y: 20, rotation: 0 },
      { index: 2, name: 'A的行动', description: 'A方当下的状态与行动', x: 20, y: 50, rotation: 0 },
      { index: 3, name: 'A的潜意识', description: 'A方的真实需求或隐藏态度', x: 20, y: 80, rotation: 0 },
      { index: 4, name: 'B的想法', description: 'B方对关系的认知与显意识', x: 80, y: 20, rotation: 0 },
      { index: 5, name: 'B的行动', description: 'B方当下的状态与行动', x: 80, y: 50, rotation: 0 },
      { index: 6, name: 'B的潜意识', description: 'B方的真实需求或隐藏态度', x: 80, y: 80, rotation: 0 },
      { index: 7, name: '关系核心', description: '双方当前的纽带、阻碍或交集点', x: 50, y: 50, rotation: 0 }
    ]
  },

  {
    id: 'lenormand-grand-tableau-8x4-4',
    name: '36宫大牌阵 (8x4+4)',
    description: '雷诺曼终极牌阵。使用全部 36 张牌，前4排每排8张，底部居中4张命运牌。用于人生各领域的长线全景解析。',
    suitableFor: ['年度总览', '深度解读', '全景人生占卜'],
    supportedDeckTypes: ['lenormand'],
    positions: [
      ...Array.from({ length: 32 }, (_, i) => {
        const row = Math.floor(i / 8)
        const col = i % 8
        return {
          index: i + 1,
          name: `宫位 ${i + 1}`,
          description: `大蓝图 - 第 ${row + 1} 行，第 ${col + 1} 列`,
          x: 11 + col * 11.1, // 均匀分布 11 到 88
          y: 15 + row * 20,
          rotation: 0
        }
      }),
      // 底部居中的 4 张“命运牌” (Destiny Cards)
      { index: 33, name: '命运牌 1', description: '核心影响 / 总结', x: 33.2, y: 95, rotation: 0 },
      { index: 34, name: '命运牌 2', description: '核心影响 / 总结', x: 44.3, y: 95, rotation: 0 },
      { index: 35, name: '命运牌 3', description: '核心影响 / 总结', x: 55.4, y: 95, rotation: 0 },
      { index: 36, name: '命运牌 4', description: '最终指向 / 总结', x: 66.5, y: 95, rotation: 0 }
    ]
  },

  {
    id: 'lenormand-grand-tableau-9x4',
    name: '36宫大牌阵 (9x4)',
    description: '大牌阵的另一种经典铺法，将 36 张牌铺成 4 行 9 列的完美矩阵。同样用于解读人生全貌与各宫位联系。',
    suitableFor: ['年度总览', '深度解读', '宫位制解牌'],
    supportedDeckTypes: ['lenormand'],
    positions: Array.from({ length: 36 }, (_, i) => {
      const row = Math.floor(i / 9)
      const col = i % 9
      return {
        index: i + 1,
        name: `宫位 ${i + 1}`,
        description: `大蓝图 - 第 ${row + 1} 行，第 ${col + 1} 列`,
        x: 10 + col * 10, // 均匀分布 10 到 90
        y: 15 + row * 23, // 均匀分布 15, 38, 61, 84
        rotation: 0
      }
    })
  }
]
