import type { Deck, DivinationCard } from '../types'

// 行星符号：☉ ☽ ☿ ♀ ♂ ♃ ♄ ♅ ♆ ♇ ☊ ⚷
// 星座符号：♈ ♉ ♊ ♋ ♌ ♍ ♎ ♏ ♐ ♑ ♒ ♓
// 宫位：用罗马数字 I–XII

const cards: DivinationCard[] = [
  // ============ 行星（12 面） ============
  {
    id: 'planet-sun',
    deckType: 'astrology-dice',
    name: '太阳',
    symbol: '☉',
    imageUrl: '',
    category: 'planet',
    uprightKeywords: ['自我', '生命力', '意志', '核心', '公开', '领导力'],
    reversedKeywords: [],
    uprightMeaning:
      '太阳代表核心自我、生命力、目标感、创造力与被看见的力量。当它出现，说明这件事关乎主导权、自我表达、身份认同或某个重要人物。它提醒你明确立场，以真实而自信的方式面对问题。感情中可代表关注、公开、男性角色或自尊；事业中代表曝光、领导、成就与被认可。',
    reversedMeaning: '',
    order: 1
  },
  {
    id: 'planet-moon',
    deckType: 'astrology-dice',
    name: '月亮',
    symbol: '☽',
    imageUrl: '',
    category: 'planet',
    uprightKeywords: ['情绪', '直觉', '安全感', '潜意识', '家庭', '变化'],
    reversedKeywords: [],
    uprightMeaning:
      '月亮指向情感需求、潜意识反应、安全感、记忆与家庭议题。它出现时，事情往往受情绪、习惯、过往经验影响，不一定完全理性。感情中代表想念、依赖、敏感、牵挂与情绪波动；事业中提醒关注情绪状态、工作环境和安全感；也可能涉及女性、母亲、家人或私密生活。',
    reversedMeaning: '',
    order: 2
  },
  {
    id: 'planet-mercury',
    deckType: 'astrology-dice',
    name: '水星',
    symbol: '☿',
    imageUrl: '',
    category: 'planet',
    uprightKeywords: ['沟通', '信息', '学习', '思考', '消息', '谈判'],
    reversedKeywords: [],
    uprightMeaning:
      '水星代表沟通、信息、思考、学习、表达、文件、合同与交通。当它出现，说明事情的关键在于交流、确认信息、理性分析或解决误会。感情中常代表聊天、联系、解释、暧昧信息或关系停留在沟通层面；事业中代表面试、谈判、汇报、写作、销售、学习培训与资料处理。',
    reversedMeaning: '',
    order: 3
  },
  {
    id: 'planet-venus',
    deckType: 'astrology-dice',
    name: '金星',
    symbol: '♀',
    imageUrl: '',
    category: 'planet',
    uprightKeywords: ['爱情', '吸引', '关系', '美', '金钱', '和谐'],
    reversedKeywords: [],
    uprightMeaning:
      '金星代表爱情、吸引力、关系、美感、享受、价值与金钱。它出现通常带来柔和、愉悦、和谐或被吸引的能量。感情中代表好感、喜欢、桃花、约会、和解或暧昧；事业中与设计、美容、艺术、公关、客户关系、合作有关；财运中代表收入、消费、价值交换和享受型支出。',
    reversedMeaning: '',
    order: 4
  },
  {
    id: 'planet-mars',
    deckType: 'astrology-dice',
    name: '火星',
    symbol: '♂',
    imageUrl: '',
    category: 'planet',
    uprightKeywords: ['行动', '冲突', '欲望', '竞争', '勇气', '冲动'],
    reversedKeywords: [],
    uprightMeaning:
      '火星代表行动力、欲望、竞争、冲突、勇气和身体能量。它出现时，事情需要推进、表态或直接行动，但也可能伴随争执、急躁和冲动。感情中代表强烈吸引、性张力、主动追求或争吵；事业中代表竞争、执行、项目推进、创业和压力；财务上需注意冲动消费或冒险投资。',
    reversedMeaning: '',
    order: 5
  },
  {
    id: 'planet-jupiter',
    deckType: 'astrology-dice',
    name: '木星',
    symbol: '♃',
    imageUrl: '',
    category: 'planet',
    uprightKeywords: ['好运', '扩张', '机会', '成长', '贵人', '远方'],
    reversedKeywords: [],
    uprightMeaning:
      '木星代表好运、扩张、成长、贵人、机会、信念、远方和高等知识。它出现通常意味着事情有扩大、改善或获得支持的趋势。感情中代表包容、发展空间、异地缘分或关系升级机会；事业中代表贵人、晋升、学习、海外、教育、出版、法律和扩张；财运中代表收入增长，但也提醒避免过度乐观。',
    reversedMeaning: '',
    order: 6
  },
  {
    id: 'planet-saturn',
    deckType: 'astrology-dice',
    name: '土星',
    symbol: '♄',
    imageUrl: '',
    category: 'planet',
    uprightKeywords: ['责任', '限制', '压力', '时间', '考验', '稳定'],
    reversedKeywords: [],
    uprightMeaning:
      '土星代表责任、限制、压力、时间、规则、现实考验与长期积累。它出现时，事情往往进展较慢，需要耐心、规划和承担责任。感情中可能代表冷淡、距离、现实阻碍、年龄差、责任感或长期承诺；事业中代表压力、制度、上级、长期目标和先苦后甜；财务上适合保守、节制和稳健积累。',
    reversedMeaning: '',
    order: 7
  },
  {
    id: 'planet-uranus',
    deckType: 'astrology-dice',
    name: '天王星',
    symbol: '♅',
    imageUrl: '',
    category: 'planet',
    uprightKeywords: ['突变', '自由', '独立', '创新', '意外', '网络'],
    reversedKeywords: [],
    uprightMeaning:
      '天王星代表突发变化、自由、独立、反叛、创新、科技与不稳定。它出现时，事情可能不按计划发展，会带来突然的开始、结束、转折或突破。感情中代表忽冷忽热、突然联系或断联、网恋、非传统关系和空间需求；事业中代表跳槽、互联网、科技、创新、平台变化；财务上则有突然进账或突然支出的可能。',
    reversedMeaning: '',
    order: 8
  },
  {
    id: 'planet-neptune',
    deckType: 'astrology-dice',
    name: '海王星',
    symbol: '♆',
    imageUrl: '',
    category: 'planet',
    uprightKeywords: ['幻想', '迷茫', '暧昧', '灵感', '梦境', '逃避'],
    reversedKeywords: [],
    uprightMeaning:
      '海王星代表幻想、迷茫、灵感、梦境、艺术、灵性、共情、暧昧与逃避。它出现时，事情往往不够清晰，容易带有滤镜、误会、隐瞒或理想化。感情中常代表暗恋、暧昧、不表态、牺牲、欺骗或自我幻想；事业中适合艺术、影视、音乐、疗愈、心理和公益，但需警惕被画饼；财务上要小心混乱账目和被骗风险。',
    reversedMeaning: '',
    order: 9
  },
  {
    id: 'planet-pluto',
    deckType: 'astrology-dice',
    name: '冥王星',
    symbol: '♇',
    imageUrl: '',
    category: 'planet',
    uprightKeywords: ['转化', '控制', '执念', '权力', '危机', '重生'],
    reversedKeywords: [],
    uprightMeaning:
      '冥王星代表深层转化、控制、执念、权力、危机、结束与重生。它出现时，事情通常不轻松，可能触及深层欲望、心理阴影、资源争夺或不可逆的改变。感情中代表强烈吸引、占有欲、纠缠、虐恋、难以放下或关系重组；事业中代表权力斗争、转型、危机处理和资源整合；财务上涉及投资、债务、保险、税务、遗产或高风险资金。',
    reversedMeaning: '',
    order: 10
  },
  {
    id: 'planet-north-node',
    deckType: 'astrology-dice',
    name: '北交点',
    symbol: '☊',
    imageUrl: '',
    category: 'planet',
    uprightKeywords: ['未来', '成长', '方向', '命运感', '新课题', '机会'],
    reversedKeywords: [],
    uprightMeaning:
      '北交点代表未来方向、成长课题、命运感、新机会和需要突破的道路。它出现时，说明这件事可能带你走向新的阶段，虽然未必熟悉舒适，但具有成长意义。感情中代表新的缘分、命运感、关系带来的学习；事业中代表新方向、新技能、新行业或未来发展路线；财务上代表新的赚钱模式和需要学习的新资源。',
    reversedMeaning: '',
    order: 11
  },
  {
    id: 'planet-chiron',
    deckType: 'astrology-dice',
    name: '凯龙星',
    symbol: '⚷',
    imageUrl: '',
    category: 'planet',
    uprightKeywords: ['创伤', '疗愈', '脆弱', '智慧', '修复', '伤口'],
    reversedKeywords: [],
    uprightMeaning:
      '凯龙星代表创伤、脆弱、疗愈、修复、经验带来的智慧，以及“受伤的疗愈者”主题。它出现时，说明这件事触碰到内在伤口、旧有痛点或需要被理解和修复的部分。感情中可能代表敏感、自卑、旧伤复发、互相疗愈或因伤口而吸引；事业中代表咨询、疗愈、教育、医学、心理、助人工作；个人成长中提醒你接纳脆弱，并从伤痛中获得力量。',
    reversedMeaning: '',
    order: 12
  },

  // ============ 星座（12 面） ============
  {
    id: 'sign-aries',
    deckType: 'astrology-dice',
    name: '白羊座',
    symbol: '♈',
    imageUrl: '',
    category: 'sign',
    uprightKeywords: ['开创', '直接', '冲动', '勇气', '主动', '竞争'],
    reversedKeywords: [],
    uprightMeaning:
      '白羊座代表直接、快速、主动、开创、竞争和勇气。它出现时，事情需要迅速行动，不适合长期等待。感情中代表热情、主动追求、冲动表白或争吵；事业中适合争取机会、开新项目、创业和竞争；但也提醒避免鲁莽、急躁、三分钟热度和只顾自己感受。',
    reversedMeaning: '',
    order: 13
  },
  {
    id: 'sign-taurus',
    deckType: 'astrology-dice',
    name: '金牛座',
    symbol: '♉',
    imageUrl: '',
    category: 'sign',
    uprightKeywords: ['稳定', '现实', '慢热', '物质', '安全感', '坚持'],
    reversedKeywords: [],
    uprightMeaning:
      '金牛座代表稳定、现实、慢热、物质、安全感、积累和享受。它出现时，事情发展较慢，但更看重实际结果和长期价值。感情中代表慢慢靠近、重视陪伴、身体接触和安全感；事业中适合稳定积累、财务、饮食、美容、土地和资源相关事务；也提醒不要过于固执、贪图舒适或抗拒变化。',
    reversedMeaning: '',
    order: 14
  },
  {
    id: 'sign-gemini',
    deckType: 'astrology-dice',
    name: '双子座',
    symbol: '♊',
    imageUrl: '',
    category: 'sign',
    uprightKeywords: ['沟通', '变化', '信息', '好奇', '选择', '社交'],
    reversedKeywords: [],
    uprightMeaning:
      '双子座代表沟通、信息、多变、好奇、学习、社交和多重选择。它出现时，事情会通过消息、交流、思考或信息流动展开。感情中代表聊天暧昧、轻松有趣，但可能不够稳定或有多个选择；事业中适合写作、销售、教学、传媒、互联网和信息处理；也提醒避免三心二意、话多行动少和信息混乱。',
    reversedMeaning: '',
    order: 15
  },
  {
    id: 'sign-cancer',
    deckType: 'astrology-dice',
    name: '巨蟹座',
    symbol: '♋',
    imageUrl: '',
    category: 'sign',
    uprightKeywords: ['情绪', '家庭', '安全感', '照顾', '怀旧', '保护'],
    reversedKeywords: [],
    uprightMeaning:
      '巨蟹座代表情绪、安全感、家庭、照顾、怀旧和保护。它出现时，事情会被感受、亲密关系、家庭背景或过去记忆影响。感情中代表想念、依赖、敏感、需要被照顾，也可能有退缩和防御；事业中适合家居、餐饮、照护、儿童、心理和家庭相关领域；提醒你温柔处理问题，但不要过度情绪化。',
    reversedMeaning: '',
    order: 16
  },
  {
    id: 'sign-leo',
    deckType: 'astrology-dice',
    name: '狮子座',
    symbol: '♌',
    imageUrl: '',
    category: 'sign',
    uprightKeywords: ['自信', '表现', '热情', '骄傲', '创造力', '面子'],
    reversedKeywords: [],
    uprightMeaning:
      '狮子座代表自信、热情、表现、创造力、舞台感、骄傲和被关注。它出现时，事情需要展示自我、争取认可或保持尊严。感情中代表热烈表达、浪漫、仪式感、想被重视，但也可能因自尊而不肯低头；事业中适合领导、表演、创作、管理和个人品牌；提醒避免过度戏剧化或只关注面子。',
    reversedMeaning: '',
    order: 17
  },
  {
    id: 'sign-virgo',
    deckType: 'astrology-dice',
    name: '处女座',
    symbol: '♍',
    imageUrl: '',
    category: 'sign',
    uprightKeywords: ['分析', '细节', '谨慎', '服务', '修正', '健康'],
    reversedKeywords: [],
    uprightMeaning:
      '处女座代表分析、细节、秩序、谨慎、服务、修正和健康。它出现时，事情需要理性梳理、检查问题、调整细节和提升效率。感情中代表慢慢观察、实际关心、挑剔、谨慎投入；事业中适合数据、医疗、编辑、行政、服务、技术和流程优化；提醒避免过度焦虑、完美主义和纠结细节。',
    reversedMeaning: '',
    order: 18
  },
  {
    id: 'sign-libra',
    deckType: 'astrology-dice',
    name: '天秤座',
    symbol: '♎',
    imageUrl: '',
    category: 'sign',
    uprightKeywords: ['关系', '平衡', '合作', '公平', '审美', '犹豫'],
    reversedKeywords: [],
    uprightMeaning:
      '天秤座代表关系、平衡、合作、公平、审美、社交和协调。它出现时，事情需要考虑双方立场，通过协商、沟通和体面方式解决。感情中代表暧昧、吸引、约会、和解、关系选择，但也可能犹豫不决；事业中适合合作、公关、法律、设计、咨询和客户关系；提醒不要过度讨好或逃避冲突。',
    reversedMeaning: '',
    order: 19
  },
  {
    id: 'sign-scorpio',
    deckType: 'astrology-dice',
    name: '天蝎座',
    symbol: '♏',
    imageUrl: '',
    category: 'sign',
    uprightKeywords: ['深度', '秘密', '欲望', '控制', '占有', '转化'],
    reversedKeywords: [],
    uprightMeaning:
      '天蝎座代表深度、秘密、欲望、控制、占有、洞察和转化。它出现时，事情表面之下有更强烈的情绪、动机或隐藏因素。感情中代表强烈吸引、占有欲、嫉妒、纠缠、难以放下或秘密关系；事业中适合金融、心理、调查、医疗、研究和危机处理；提醒面对真相，避免极端、控制和执念。',
    reversedMeaning: '',
    order: 20
  },
  {
    id: 'sign-sagittarius',
    deckType: 'astrology-dice',
    name: '射手座',
    symbol: '♐',
    imageUrl: '',
    category: 'sign',
    uprightKeywords: ['自由', '远方', '学习', '探索', '乐观', '扩张'],
    reversedKeywords: [],
    uprightMeaning:
      '射手座代表自由、远方、学习、探索、乐观、信念和扩张。它出现时，事情需要打开格局、走出去、学习更多或保持开放。感情中可能代表异地、自由需求、三观交流、轻松但不受束缚的关系；事业中适合教育、旅游、出版、法律、外贸和海外事务；提醒避免过度乐观、粗心和承诺不足。',
    reversedMeaning: '',
    order: 21
  },
  {
    id: 'sign-capricorn',
    deckType: 'astrology-dice',
    name: '摩羯座',
    symbol: '♑',
    imageUrl: '',
    category: 'sign',
    uprightKeywords: ['现实', '责任', '事业', '规则', '长期', '压力'],
    reversedKeywords: [],
    uprightMeaning:
      '摩羯座代表现实、责任、事业、规则、长期目标、压力和成就。它出现时，事情需要务实处理，不能只凭感觉，需要规划、耐心和承担责任。感情中代表慢热、克制、现实条件、责任压力或长期关系；事业中代表目标、制度、上级、管理、晋升和长期积累；提醒不要过度压抑、功利或冷淡。',
    reversedMeaning: '',
    order: 22
  },
  {
    id: 'sign-aquarius',
    deckType: 'astrology-dice',
    name: '水瓶座',
    symbol: '♒',
    imageUrl: '',
    category: 'sign',
    uprightKeywords: ['独立', '自由', '朋友', '社群', '创新', '理性'],
    reversedKeywords: [],
    uprightMeaning:
      '水瓶座代表独立、自由、理性、创新、朋友、社群、网络和非传统模式。它出现时，事情可能不按常规发展，需要保持距离感、尊重差异或寻找新方法。感情中代表朋友式相处、网恋、忽冷忽热、需要空间和非传统关系；事业中适合互联网、科技、社群、平台、团队和创新项目；提醒不要过度疏离或抗拒亲密。',
    reversedMeaning: '',
    order: 23
  },
  {
    id: 'sign-pisces',
    deckType: 'astrology-dice',
    name: '双鱼座',
    symbol: '♓',
    imageUrl: '',
    category: 'sign',
    uprightKeywords: ['浪漫', '幻想', '共情', '迷茫', '牺牲', '灵性'],
    reversedKeywords: [],
    uprightMeaning:
      '双鱼座代表浪漫、幻想、共情、灵性、艺术、迷茫、牺牲和逃避。它出现时，事情充满感受、想象和直觉，但也可能不够清晰。感情中代表暗恋、暧昧、心软、自我感动、理想化或看不清现实；事业中适合艺术、影视、音乐、疗愈、心理和公益；提醒建立边界，不要沉溺幻想或逃避事实。',
    reversedMeaning: '',
    order: 24
  },

  // ============ 宫位（12 面） ============
  {
    id: 'house-1',
    deckType: 'astrology-dice',
    name: '第一宫',
    symbol: 'I',
    imageUrl: '',
    category: 'house',
    uprightKeywords: ['自我形象', '外貌', '开端', '身份', '身体', '主动'],
    reversedKeywords: [],
    uprightMeaning:
      '第一宫代表自我、外貌、身体状态、个人身份、第一印象和新的开始。事件发生在“你自己”这个领域，强调你如何呈现自己、如何主动行动，以及你在这件事中的主体性。感情中代表你本人、个人吸引力和对方眼中的你；事业中代表面试表现、个人品牌、自我定位和主动争取机会。',
    reversedMeaning: '',
    order: 25
  },
  {
    id: 'house-2',
    deckType: 'astrology-dice',
    name: '第二宫',
    symbol: 'II',
    imageUrl: '',
    category: 'house',
    uprightKeywords: ['金钱', '价值', '资源', '安全感', '收入', '拥有'],
    reversedKeywords: [],
    uprightMeaning:
      '第二宫代表金钱、收入、资源、自我价值、安全感、消费和拥有。事件发生在物质与价值领域，强调你拥有什么、如何定价、如何获得稳定感。感情中代表现实条件、物质付出、价值匹配和安全感需求；事业中代表工资、收入来源、资源积累和个人能力的变现；财务问题中这是最直接的金钱宫位。',
    reversedMeaning: '',
    order: 26
  },
  {
    id: 'house-3',
    deckType: 'astrology-dice',
    name: '第三宫',
    symbol: 'III',
    imageUrl: '',
    category: 'house',
    uprightKeywords: ['沟通', '消息', '学习', '短途', '兄弟姐妹', '文件'],
    reversedKeywords: [],
    uprightMeaning:
      '第三宫代表沟通、消息、学习、文件、合同、考试、短途出行、邻里、同学和兄弟姐妹。事件发生在信息交流领域，关键在于表达、联系、确认和理解。感情中代表聊天、消息往来、解释误会、暧昧沟通；事业中代表面试、谈判、汇报、写作、传播、合同和资料处理。',
    reversedMeaning: '',
    order: 27
  },
  {
    id: 'house-4',
    deckType: 'astrology-dice',
    name: '第四宫',
    symbol: 'IV',
    imageUrl: '',
    category: 'house',
    uprightKeywords: ['家庭', '内心', '房子', '安全感', '根基', '父母'],
    reversedKeywords: [],
    uprightMeaning:
      '第四宫代表家庭、父母、房子、居住环境、内心深处、安全感、原生家庭和根基。事件发生在私人生活和情感根基领域，强调你真正的内在感受。感情中代表安全感、是否想稳定、家庭影响、内心真实需求；事业中可能涉及房产、家族事业、在家办公、工作基础或隐私空间。',
    reversedMeaning: '',
    order: 28
  },
  {
    id: 'house-5',
    deckType: 'astrology-dice',
    name: '第五宫',
    symbol: 'V',
    imageUrl: '',
    category: 'house',
    uprightKeywords: ['恋爱', '娱乐', '创作', '孩子', '桃花', '快乐'],
    reversedKeywords: [],
    uprightMeaning:
      '第五宫代表恋爱、暧昧、约会、桃花、娱乐、玩乐、创作、表演、孩子和投机。事件发生在快乐、表达和心动领域，强调轻松感、创造力和自我展现。感情中代表喜欢、心动、恋爱体验、约会机会，但不一定等同于婚姻承诺；事业中代表创意项目、内容创作、娱乐行业、儿童相关和展示才华。',
    reversedMeaning: '',
    order: 29
  },
  {
    id: 'house-6',
    deckType: 'astrology-dice',
    name: '第六宫',
    symbol: 'VI',
    imageUrl: '',
    category: 'house',
    uprightKeywords: ['工作', '健康', '日常', '服务', '同事', '习惯'],
    reversedKeywords: [],
    uprightMeaning:
      '第六宫代表日常工作、任务、同事、服务、健康、生活习惯、宠物和细节管理。事件发生在现实日常与执行层面，强调效率、责任、调整和维护。感情中代表日常相处、照顾、琐事、现实磨合；事业中代表工作任务、职场细节、同事关系、健康压力和工作效率；健康问题中这是重要宫位。',
    reversedMeaning: '',
    order: 30
  },
  {
    id: 'house-7',
    deckType: 'astrology-dice',
    name: '第七宫',
    symbol: 'VII',
    imageUrl: '',
    category: 'house',
    uprightKeywords: ['伴侣', '合作', '婚姻', '关系', '合同', '对手'],
    reversedKeywords: [],
    uprightMeaning:
      '第七宫代表伴侣、婚姻、合作、一对一关系、公开关系、合同、客户和竞争对手。事件发生在人与人的对等关系领域，重点是对方态度、关系状态和合作模式。感情中代表正式关系、伴侣、复合、婚姻倾向或关系能否公开；事业中代表合作伙伴、客户、合同、谈判和竞争关系。',
    reversedMeaning: '',
    order: 31
  },
  {
    id: 'house-8',
    deckType: 'astrology-dice',
    name: '第八宫',
    symbol: 'VIII',
    imageUrl: '',
    category: 'house',
    uprightKeywords: ['亲密', '秘密', '共享资源', '债务', '投资', '转化'],
    reversedKeywords: [],
    uprightMeaning:
      '第八宫代表亲密关系、性、共享资源、债务、投资、保险、税务、遗产、秘密、危机和深层转化。事件发生在深度连接、风险与资源交换领域。感情中代表强烈吸引、占有欲、性关系、秘密关系、控制与纠缠；事业和财务中代表投资、融资、共同财产、利益分配、危机处理和资源整合。',
    reversedMeaning: '',
    order: 32
  },
  {
    id: 'house-9',
    deckType: 'astrology-dice',
    name: '第九宫',
    symbol: 'IX',
    imageUrl: '',
    category: 'house',
    uprightKeywords: ['远方', '旅行', '高等教育', '信念', '法律', '海外'],
    reversedKeywords: [],
    uprightMeaning:
      '第九宫代表远方、旅行、出国、留学、高等教育、法律、宗教、哲学、出版、信念和人生观。事件发生在扩展视野和寻找意义的领域。感情中代表异地恋、远方的人、三观是否一致、关系是否有更大空间；事业中代表海外业务、教育培训、法律事务、出版传播、长途差旅和进修考试。',
    reversedMeaning: '',
    order: 33
  },
  {
    id: 'house-10',
    deckType: 'astrology-dice',
    name: '第十宫',
    symbol: 'X',
    imageUrl: '',
    category: 'house',
    uprightKeywords: ['事业', '名声', '地位', '目标', '上级', '成就'],
    reversedKeywords: [],
    uprightMeaning:
      '第十宫代表事业、名声、社会地位、公众形象、职业目标、上级、权威和成就。事件发生在社会角色与长期目标领域，强调结果、责任和外界评价。感情中可能代表关系是否公开、身份名分、事业压力对关系的影响；事业中代表升职、领导、职业方向、社会认可、目标实现和公众曝光。',
    reversedMeaning: '',
    order: 34
  },
  {
    id: 'house-11',
    deckType: 'astrology-dice',
    name: '第十一宫',
    symbol: 'XI',
    imageUrl: '',
    category: 'house',
    uprightKeywords: ['朋友', '社群', '人脉', '网络', '团队', '愿望'],
    reversedKeywords: [],
    uprightMeaning:
      '第十一宫代表朋友、社群、团队、人脉、网络平台、组织、粉丝、未来愿望和长期计划。事件发生在群体关系和社会网络领域。感情中代表朋友变恋人、社交软件、朋友圈影响、关系偏朋友式或需要空间；事业中代表团队合作、社群运营、平台发展、人脉机会、粉丝经济和长期愿景。',
    reversedMeaning: '',
    order: 35
  },
  {
    id: 'house-12',
    deckType: 'astrology-dice',
    name: '第十二宫',
    symbol: 'XII',
    imageUrl: '',
    category: 'house',
    uprightKeywords: ['隐藏', '潜意识', '秘密', '暗恋', '疗愈', '结束'],
    reversedKeywords: [],
    uprightMeaning:
      '第十二宫代表隐藏、秘密、潜意识、梦境、疗愈、孤独、隐退、医院、寺庙、幕后事务、结束和放下。事件发生在看不见或尚未明朗的领域，强调内在感受、隐秘状态和潜意识影响。感情中代表暗恋、地下情、逃避、放不下、隐瞒或关系不清楚；事业中代表幕后工作、心理压力、休息调整、疗愈行业和隐藏问题。',
    reversedMeaning: '',
    order: 36
  }
]

export const ASTROLOGY_DICE_DECK: Deck = {
  id: 'astrology-dice',
  type: 'astrology-dice',
  name: '占星骰子',
  description: '三骰同掷，以行星、星座、宫位的语言回应你的疑问',
  allowReversed: false, // 骰子没有正逆位
  backImageUrl: '',
  cards
}
