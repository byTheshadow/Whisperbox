import type { Spread, SpreadPosition } from '../types'

export const SPREADS: Spread[] = [
  // ========== 单牌占卜 ==========
  {
    id: 'single-card',
    name: '单牌占卜',
    description: '最简单直接的占卜方式，抽取一张牌获得当下的指引。适合日常提问或快速获取建议。',
    supportedDeckTypes: ['tarot', 'spirit', 'lenormand'], // 单牌非常通用
    suitableFor: ['日常指引', '简单问题', '每日一牌'],
    positions: [
      { index: 1, name: '指引', description: '这张牌代表当前情况的核心信息或建议', x: 50, y: 50, rotation: 0 }
    ]
  },

  // ========== 三牌占卜 ==========
  {
    id: 'three-card-time',
    name: '时间之流（三牌）',
    description: '经典的过去-现在-未来牌阵，帮助理解事情的发展脉络。',
    supportedDeckTypes: ['tarot'],
    suitableFor: ['事态发展', '时间线', '因果关系'],
    positions: [
      { index: 1, name: '过去', description: '影响当前情况的过去因素或根源', x: 20, y: 50, rotation: 0 },
      { index: 2, name: '现在', description: '当前的状态、挑战或需要关注的焦点', x: 50, y: 50, rotation: 0 },
      { index: 3, name: '未来', description: '如果保持现状可能的发展方向', x: 80, y: 50, rotation: 0 }
    ]
  },

  // ========== 三牌 - 情境/行动/结果 ==========
  {
    id: 'three-card-action',
    name: '行动指南（三牌）',
    description: '帮助分析当前情境并获得行动建议。',
    supportedDeckTypes: ['tarot'],
    suitableFor: ['决策', '行动建议', '问题解决'],
    positions: [
      { index: 1, name: '情境', description: '当前面临的情况或问题本质', x: 20, y: 50, rotation: 0 },
      { index: 2, name: '行动', description: '建议采取的行动或态度', x: 50, y: 50, rotation: 0 },
      { index: 3, name: '结果', description: '采取行动后可能的结果', x: 80, y: 50, rotation: 0 }
    ]
  },

  // ========== 五牌十字 ==========
  {
    id: 'five-card-cross',
    name: '简易十字（五牌）',
    description: '比三牌更详细，但不像凯尔特十字那么复杂。适合需要更多视角的问题。',
    supportedDeckTypes: ['tarot'],
    suitableFor: ['综合分析', '多角度', '中等复杂问题'],
    positions: [
      { index: 1, name: '现状', description: '当前的核心情况', x: 50, y: 50, rotation: 0 },
      { index: 2, name: '挑战', description: '面临的障碍或需要克服的问题', x: 50, y: 20, rotation: 0 },
      { index: 3, name: '过去', description: '影响现状的过去因素', x: 20, y: 50, rotation: 0 },
      { index: 4, name: '未来', description: '可能的发展方向', x: 80, y: 50, rotation: 0 },
      { index: 5, name: '建议', description: '应该关注或采取的行动', x: 50, y: 80, rotation: 0 }
    ]
  },

  // ========== 凯尔特十字（十牌） ==========
  {
    id: 'celtic-cross',
    name: '凯尔特十字（十牌）',
    description: '最经典的完整牌阵，提供全面深入的分析。适合重要决定或复杂问题。',
    supportedDeckTypes: ['tarot'],
    suitableFor: ['深度分析', '重大决定', '复杂问题', '全面解读'],
    positions: [
      { index: 1, name: '现状', description: '当前情况的核心', x: 30, y: 50, rotation: 0 },
      { index: 2, name: '挑战', description: '横亘在前的障碍或影响因素', x: 30, y: 50, rotation: 90 },
      { index: 3, name: '潜意识', description: '内心深处的想法或隐藏因素', x: 30, y: 80, rotation: 0 },
      { index: 4, name: '过去', description: '刚刚过去的影响', x: 10, y: 50, rotation: 0 },
      { index: 5, name: '显意识', description: '表面上在追求或思考的', x: 30, y: 20, rotation: 0 },
      { index: 6, name: '近未来', description: '即将发生的事情', x: 50, y: 50, rotation: 0 },
      { index: 7, name: '自我', description: '你在这件事中的角色或态度', x: 75, y: 80, rotation: 0 },
      { index: 8, name: '环境', description: '周围人或外部环境的影响', x: 75, y: 60, rotation: 0 },
      { index: 9, name: '希望/恐惧', description: '内心的期望或担忧', x: 75, y: 40, rotation: 0 },
      { index: 10, name: '结果', description: '最终可能的结果', x: 75, y: 20, rotation: 0 }
    ]
  },

  // ========== 关系牌阵（六牌） ==========
  {
    id: 'relationship-six',
    name: '关系镜像（六牌）',
    description: '专门用于分析两个人之间的关系，展示双方的视角和关系走向。',
    supportedDeckTypes: ['tarot', 'spirit'],
    suitableFor: ['感情', '关系', '人际', '双方视角'],
    positions: [
      { index: 1, name: '你的状态', description: '你在这段关系中的状态', x: 25, y: 30, rotation: 0 },
      { index: 2, name: '对方的状态', description: '对方在这段关系中的状态', x: 75, y: 30, rotation: 0 },
      { index: 3, name: '你的期望', description: '你对这段关系的期望', x: 25, y: 60, rotation: 0 },
      { index: 4, name: '对方的期望', description: '对方对这段关系的期望', x: 75, y: 60, rotation: 0 },
      { index: 5, name: '关系核心', description: '这段关系的核心主题或问题', x: 50, y: 45, rotation: 0 },
      { index: 6, name: '发展方向', description: '关系可能的发展方向', x: 50, y: 80, rotation: 0 }
    ]
  },

  // ========== 1. 七脉轮牌阵 ==========
  {
    id: 'seven-chakras',
    name: '七脉轮牌阵',
    description: '深度的身心灵疗愈牌阵，结合古印度脉轮理论，用于检测当下的能量状态、身心卡点并寻求疗愈。',
    supportedDeckTypes: ['tarot', 'spirit'],
    suitableFor: ['身心灵成长', '能量状态', '自我探索', '情绪疗愈'],
    positions: [
      { index: 1, name: '海底轮', description: '安全感、生存问题、物质基础、原生家庭', x: 50, y: 85, rotation: 0 },
      { index: 2, name: '生殖轮(脐轮)', description: '创造力、欲望、情绪流动、人际与亲密关系', x: 50, y: 73, rotation: 0 },
      { index: 3, name: '太阳神经丛', description: '自信、个人意志、行动力、自我认同感', x: 50, y: 61, rotation: 0 },
      { index: 4, name: '心轮', description: '爱、同理心、宽恕、自我接纳', x: 50, y: 49, rotation: 0 },
      { index: 5, name: '喉轮', description: '沟通表达、真实性、倾听与被倾听的能力', x: 50, y: 37, rotation: 0 },
      { index: 6, name: '眉心轮(三眼轮)', description: '直觉力、洞察力、想象力、思维清晰度', x: 50, y: 25, rotation: 0 },
      { index: 7, name: '顶轮', description: '灵性连接、智慧、信仰、与高我的连接', x: 50, y: 13, rotation: 0 }
    ]
  },

  // ========== 2. 阴影探索牌阵 ==========
  {
    id: 'shadow-work',
    name: '阴影探索牌阵',
    description: '深度心灵疗愈牌阵，帮助挖掘潜意识中被压抑、拒绝承认的部分，适合遇到反复出现的问题时寻找内在根源。',
    supportedDeckTypes: ['tarot', 'spirit'],
    suitableFor: ['心理疗愈', '潜意识探索', '打破循环', '内在成长'],
    positions: [
      { index: 1, name: '压抑的阴影', description: '你不愿面对或试图隐藏的特质/创伤', x: 50, y: 50, rotation: 0 },
      { index: 2, name: '形成根源', description: '阴影形成的源头（如童年经历、过去失败）', x: 50, y: 75, rotation: 0 },
      { index: 3, name: '目前影响', description: '这个阴影目前正在如何阻碍你的生活', x: 25, y: 50, rotation: 0 },
      { index: 4, name: '接纳与整合', description: '如何接纳并整合这个阴影的建议', x: 75, y: 50, rotation: 0 },
      { index: 5, name: '整合后能量', description: '突破关卡后将获得的灵魂成长与力量', x: 50, y: 25, rotation: 0 }
    ]
  },

  // ========== 3. 乔哈里视窗/盲点牌阵 ==========
  {
    id: 'johari-window',
    name: '乔哈里视窗/盲点牌阵',
    description: '结合心理学理论，消除关系或沟通中的"信息差"，帮助增进两人的互相理解和深度觉察。',
    supportedDeckTypes: ['tarot', 'spirit'],
    suitableFor: ['消除误会', '沟通卡点', '自我觉察', '深度关系'],
    positions: [
      { index: 1, name: '公开区', description: '你们都知道的事（达成的共识/表面状态）', x: 35, y: 35, rotation: 0 },
      { index: 2, name: '隐藏区', description: '你没告诉TA的事（你隐藏的需求/情绪）', x: 35, y: 65, rotation: 0 },
      { index: 3, name: '盲目区', description: 'TA没告诉你的事（对方隐藏的情绪/你未察觉的点）', x: 65, y: 35, rotation: 0 },
      { index: 4, name: '未知区', description: '两人的盲点（双方都没意识到或潜伏的隐患）', x: 65, y: 65, rotation: 0 }
    ]
  },

  // ========== 4. 真心话/未开口的话牌阵 ==========
  {
    id: 'unspoken-words',
    name: '真心话/未开口的话牌阵',
    description: '当对方不善言辞或言不由衷时，帮你“听”到对方灵魂深处的声音，了解交流背后的真相。',
    supportedDeckTypes: ['tarot', 'spirit'],
    suitableFor: ['了解对方', '潜台词分析', '打破防备', '感情沟通'],
    positions: [
      { index: 1, name: '表面表达', description: '对方表面表现出的态度或嘴上说的话', x: 25, y: 35, rotation: 0 },
      { index: 2, name: '真实潜台词', description: '对方心里真正在想，但没说出口的想法', x: 25, y: 65, rotation: 0 },
      { index: 3, name: '隐瞒原因', description: '对方拒绝坦诚交流/隐瞒的根本原因', x: 50, y: 50, rotation: 0 },
      { index: 4, name: '渴望的回应', description: '对方潜意识里希望你怎样回应/理解TA', x: 75, y: 65, rotation: 0 },
      { index: 5, name: '你的引导', description: '你该如何开口引导，让对方卸下防备', x: 75, y: 35, rotation: 0 }
    ]
  },

  // ========== 5. 关系之桥牌阵 ==========
  {
    id: 'relationship-bridge',
    name: '关系之桥牌阵',
    description: '专门用于两人之间出现冷战、沟通断层或存在误解时，找出沟通“鸿沟”并搭建沟通的“桥梁”。',
    supportedDeckTypes: ['tarot', 'spirit'],
    suitableFor: ['冷战化解', '误解破冰', '沟通方式', '人际关系'],
    positions: [
      { index: 1, name: '你的状态/立场', description: '你在这次沟通或矛盾中的真实想法', x: 20, y: 50, rotation: 0 },
      { index: 2, name: '对方的状态/立场', description: '对方在这次沟通或矛盾中的真实想法', x: 80, y: 50, rotation: 0 },
      { index: 3, name: '鸿沟 (The Gap)', description: '阻碍你们交流的根本原因', x: 50, y: 75, rotation: 0 },
      { index: 4, name: '桥梁 (The Bridge)', description: '打破僵局、重新连接彼此的方式/话题', x: 50, y: 40, rotation: 0 },
      { index: 5, name: '沟通结果', description: '如果按指引去交流，关系会走向的结果', x: 50, y: 15, rotation: 0 }
    ]
  },

  // ========== 6. 爱情十字/大十字牌阵 ==========
  {
    id: 'love-cross',
    name: '爱情十字牌阵',
    description: '聚焦于两个人之间的能量互动和关系现状，适合快速看清当下的感情状态及短期走向。',
    supportedDeckTypes: ['tarot'],
    suitableFor: ['恋爱现状', '感情预测', '双方态度'],
    positions: [
      { index: 1, name: '你的状态', description: '你目前在关系里的态度和心情', x: 25, y: 50, rotation: 0 },
      { index: 2, name: '对方的状态', description: '对方目前在关系里的态度和心情', x: 75, y: 50, rotation: 0 },
      { index: 3, name: '现状/环境', description: '目前这段感情的客观情况或现实环境', x: 50, y: 25, rotation: 0 },
      { index: 4, name: '阻碍/助力', description: '阻碍你们的事物，或者可以利用的优势', x: 50, y: 75, rotation: 0 },
      { index: 5, name: '未来发展', description: '这段关系接下来的发展趋势', x: 50, y: 50, rotation: 0 }
    ]
  },

  // ========== 7. 维纳斯之爱牌阵 ==========
  {
    id: 'venus-of-love',
    name: '维纳斯之爱牌阵',
    description: '为爱情量身定制的复杂牌阵（形状如金星符号♀），深度剖析恋爱或婚姻关系中的潜意识、环境与未来。',
    supportedDeckTypes: ['tarot'],
    suitableFor: ['深度感情分析', '婚姻分析', '复杂恋爱关系'],
    positions: [
      { index: 1, name: '你的真实想法', description: '你内心对这段感情/对方的真实感受', x: 50, y: 15, rotation: 0 },
      { index: 2, name: '对方的真实想法', description: '对方内心对这段感情/你的真实感受', x: 65, y: 30, rotation: 0 },
      { index: 3, name: '环境影响', description: '外界（家人/朋友/现实等）对感情的影响', x: 35, y: 30, rotation: 0 },
      { index: 4, name: '未来发展', description: '这段感情在不远的未来会如何发展', x: 50, y: 45, rotation: 0 },
      { index: 5, name: '遇到阻碍', description: '感情中可能存在的隐患、冲突或困难', x: 50, y: 65, rotation: 0 },
      { index: 6, name: '最终结果', description: '如果继续走下去，这段感情最终的结局', x: 50, y: 85, rotation: 0 },
      { index: 7, name: '你的过去经历', description: '你过去的感情经历/心结对现在的影响', x: 15, y: 45, rotation: 0 },
      { index: 8, name: '对方的过去经历', description: '对方过去的感情经历/心结对现在的影响', x: 85, y: 45, rotation: 0 }
    ]
  },

  // ========== 8. 二选一牌阵 ==========
  {
    id: 'two-options',
    name: '二选一牌阵',
    description: '面临两难抉择时（如工作、感情、生活选项），用来预测两种不同选择将各自带来的过程与结局。',
    supportedDeckTypes: ['tarot'],
    suitableFor: ['两难选择', '决策指引', '职业选择', '方向预测'],
    positions: [
      { index: 1, name: '现状', description: '你目前的处境和面临抉择的心态', x: 50, y: 80, rotation: 0 },
      { index: 2, name: '选择A过程', description: '如果选择A，在过程中会经历什么', x: 30, y: 50, rotation: 0 },
      { index: 3, name: '选择B过程', description: '如果选择B，在过程中会经历什么', x: 70, y: 50, rotation: 0 },
      { index: 4, name: '选择A结果', description: '选择A最终会带来的结局', x: 20, y: 20, rotation: 0 },
      { index: 5, name: '选择B结果', description: '选择B最终会带来的结局', x: 80, y: 20, rotation: 0 }
    ]
  },

  // ========== 9. 恋人金字塔牌阵 ==========
  {
    id: 'lovers-pyramid',
    name: '恋人金字塔牌阵',
    description: '呈现金字塔形状的经典感情牌阵，专用来分析双方看法、关系现状以及未来走向，简单直白。',
    supportedDeckTypes: ['tarot'],
    suitableFor: ['感情发展', '双方看法', '婚姻恋爱', '快速关系占卜'],
    positions: [
      { index: 1, name: '自己', description: '你在目前关系中的状态、真实想法或感受', x: 30, y: 75, rotation: 0 },
      { index: 2, name: '对方', description: '对方在目前关系中的状态、对你的看法', x: 70, y: 75, rotation: 0 },
      { index: 3, name: '关系现状', description: '目前的客观状态、互动模式或存在的问题', x: 50, y: 50, rotation: 0 },
      { index: 4, name: '未来发展', description: '这段关系在未来的发展趋势或最终结果', x: 50, y: 20, rotation: 0 }
    ]
  },

  // ========== 10. 圣三角牌阵 ==========
  {
    id: 'holy-triangle',
    name: '圣三角牌阵',
    description: '最基础也是最经典的塔罗牌阵之一。解答有明确时间线发展的问题，帮助看清事件的来龙去脉。',
    supportedDeckTypes: ['tarot'],
    suitableFor: ['简单问题', '时间线', '事态发展', '日常占卜'],
    positions: [
      { index: 1, name: '过去', description: '问题产生的原因、过去的状况或历史事件', x: 25, y: 65, rotation: 0 },
      { index: 2, name: '现在', description: '目前的状况、你当下所处的环境或心态', x: 50, y: 35, rotation: 0 },
      { index: 3, name: '未来', description: '顺其自然发展下，事情将会走向的最终结果', x: 75, y: 65, rotation: 0 }
    ]
  }
]
