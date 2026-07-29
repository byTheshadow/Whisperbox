import Dexie, { type Table } from 'dexie'

// ========== 数据模型定义 ==========

/** 角色卡（兼容 SillyTavern V2） */
export interface Character {
  id: string
  name: string
  avatar: string
  description: string
  personality: string
  scenario: string
  firstMes: string
  mesExample: string
  creatorNotes: string
  systemPrompt: string
  postHistoryUser: string
  worldBookId: string
  cardLibraryIds: string[]
  tags: string[]
  createdAt: number
  updatedAt: number
}

/** 用户人设 Persona */
export interface Persona {
  id: string
  name: string
  avatar: string
  description: string
  isDefault: boolean
  isRealUser: boolean // true = 真实线下身份（只能有一个），false = 角色扮演身份
  createdAt: number
}

/** 消息 */
export interface Message {
  id: string
  sessionId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  media?: {
    type: 'image' | 'voice' | 'sticker'
    description: string
    url: string
    name?: string
    meaning?: string
    stickerId?: string
  }
  isEdited: boolean
  timestamp: number
}

/** 聊天会话 */
export interface ChatSession {
  id: string
  characterId: string
  personaId: string
  mode: 'roleplay' | 'daily'
  title: string
  wallpaper: string
  bubbleStyle: string

  /** 每 N 条消息自动生成一次摘要，用户可在会话内自定义 */
  memorySummarizeEveryN: number

  /** 当前会话是否启用记忆系统 */
  memoryEnabled: boolean

  proactiveEnabled: boolean
  proactiveFrequencyMinutes: number
  proactiveNotify: boolean
  proactiveSilentNight: boolean
  proactiveRequirePersonality: boolean
  proactiveAllowDrawing: boolean
  proactiveMinMessageCount: number
  proactiveMaxRecentMessages: number
  proactiveOnlyWhenLongConversation: boolean
  lastProactiveAt: number | null
  lastMessageAt: number
  createdAt: number
}

/** 全局表情包库 */
export interface StickerPack {
  id: string
  name: string
  description: string
  isEnabled: boolean
  createdAt: number
  updatedAt: number
}

/** 全局表情包条目 */
export interface StickerItem {
  id: string
  packId: string
  name: string
  url: string
  description: string
  meaning: string
  triggerWords: string[]
  createdAt: number
  updatedAt: number
}

/** 字卡条目 */
export interface WhisperCard {
  id: string
  libraryId: string
  content: string
  triggerWords: string[]
  weight: number
  createdAt: number
}

/** 字卡库 */
export interface CardLibrary {
  id: string
  name: string
  description: string
  boundCharacterIds: string[]
  replyInterval: number
  typingText: string
  createdAt: number
}

/** 字卡角色（Cards App 专用，独立于 Chat 角色） */
export interface CardCharacter {
  id: string
  name: string
  avatar: string
  personality: string
  statusTexts: string[]
  createdAt: number
  updatedAt: number
}

/** 字卡会话（消息框） */
export interface CardSession {
  id: string
  cardCharacterId: string
  personaId: string
  title: string
  wallpaper: string
  bubbleStyle: string
  bubbleCustomCss: string
  replyMode: 'random' | 'keyword'
  replyDelayMin: number
  replyDelayMax: number
  libraryIds: string[]
  typingIndicatorText: string   // 新增：自定义打字指示器文字
  lastMessageAt: number
  createdAt: number
}

/** 字卡消息 */
export interface CardMessage {
  id: string
  sessionId: string
  role: 'user' | 'card'
  content: string
  media?: {
    type: 'image' | 'voice' | 'sticker'
    description: string
    url: string
    name?: string
  }
  sourceCardIds?: string[]
  timestamp: number
}

/** 每日仪式记录 */
export interface DailyRitual {
  id: string
  tarotCardIndex: number
  tarotInterpretation: string
  whisperCardId: string
  whisperContent: string
  completedAt: number
}

/** 记忆条目 */
export interface MemoryEntry {
  id: string

  /**
   * 关联角色。
   * Chat 会话记忆一般有 characterId。
   * 全局提示词、全局记忆可以为空字符串。
   */
  characterId: string

  /**
   * 关联会话。
   * 每个聊天框/会话都有自己的记忆系统。
   * 全局提示词、全局记忆可以为空字符串。
   */
  sessionId: string

  /**
   * 记忆类型：
   * summary = 每 N 条消息自动生成的会话摘要
   * event = 重要事件
   * diary = 真实 user 日记，多条独立保存，不覆盖
   * custom = 用户手动添加的普通记忆
   * permanent = 永久记忆
   * worldbook = 世界书条目
   * globalPrompt = 全局提示词 text 输入框内容
   */
  type:
    | 'summary'
    | 'event'
    | 'diary'
    | 'custom'
    | 'permanent'
    | 'worldbook'
    | 'globalPrompt'

  /**
   * 标题，方便 memory app 展示。
   * 例如：
   * “7月28日日记”
   * “最近聊天摘要”
   * “全局提示词”
   */
  title: string

  /** 正文内容 */
  content: string

  /**
   * daily = 日常模式相关
   * roleplay = RP 模式相关
   * global = 全局
   */
  scope: 'daily' | 'roleplay' | 'global'

  /**
   * 是否真实 user 相关。
   * 真实 user 日记必须为 true。
   */
  isRealUserRelated: boolean

  /**
   * 是否永久记忆。
   * 也可以和 type: 'permanent' 搭配使用。
   */
  isPermanent: boolean

  /**
   * 是否启用。
   * memory app 可以用它来临时禁用某条记忆。
   */
  enabled: boolean

  /**
   * 重要程度，建议 0-100。
   */
  importance: number

  /**
   * 标签。
   * 真实 user 日记建议包含：
   * ['real-user', 'diary']
   */
  tags: string[]

  /**
   * 世界书触发词。
   * 仅 type = 'worldbook' 时主要使用。
   */
  keywords: string[]

  /**
   * 世界书/全局提示词/永久记忆注入 prompt 时的优先级。
   * 数字越大越优先。
   */
  priority: number

  /**
   * AI 生成的日记可以先标记为 draft。
   * 用户确认或编辑后改为 saved。
   */
  status: 'saved' | 'draft' | 'archived'

  /**
   * 来源：
   * user = 用户手动写入
   * ai = AI 自动总结/日记
   * system = 系统生成或全局设置
   */
  source: 'user' | 'ai' | 'system'

  createdAt: number
  updatedAt: number
}

/** 世界书条目 */
export interface WorldBookEntry {
  id: string
  worldBookId: string
  key: string[]
  content: string
  isEnabled: boolean
  priority: number
  position: 'before' | 'after'
  createdAt: number
}

/** 世界书 */
export interface WorldBook {
  id: string
  name: string
  characterId: string
  description: string
  createdAt: number
}

/** Todo 任务 */
export interface TodoItem {
  id: string
  title: string
  description: string
  completed: boolean
  dueAt: number | null
  remindAt: number | null
  characterId: string
  priority: 'low' | 'medium' | 'high'
  tags: string[]
  completedAt: number | null
  createdAt: number
}

/** 备忘录 */
export interface NoteEntry {
  id: string
  owner: 'user' | string
  title: string
  content: string
  exposeToMemory: boolean
  tags: string[]
  updatedAt: number
  createdAt: number
}

/** 全局设置 */
export interface AppSettings {
  id: string
  apiBaseUrl: string
  apiKey: string
  selectedModel: string
  availableModels: string[] // 缓存的模型列表
  proactivePushEnabled: boolean
  proactiveCheckInterval: number
  summarizeEveryN: number
  theme: 'dark'
  createdAt: number
  updatedAt: number
}

// ========== Dexie 数据库实例 ==========

export class WhisperboxDB extends Dexie {
  characters!: Table<Character>
  personas!: Table<Persona>
  messages!: Table<Message>
  chatSessions!: Table<ChatSession>
  whisperCards!: Table<WhisperCard>
  cardLibraries!: Table<CardLibrary>
  memoryEntries!: Table<MemoryEntry>
  worldBookEntries!: Table<WorldBookEntry>
  worldBooks!: Table<WorldBook>
  todoItems!: Table<TodoItem>
  noteEntries!: Table<NoteEntry>
  appSettings!: Table<AppSettings>
  stickerPacks!: Table<StickerPack>
  stickerItems!: Table<StickerItem>

  cardCharacters!: Table<CardCharacter>
  cardSessions!: Table<CardSession>
  cardMessages!: Table<CardMessage>
  dailyRituals!: Table<DailyRitual>

  constructor() {
    super('whisperbox')

    this.version(4)
      .stores({
        characters: 'id, name, createdAt',
        personas: 'id, name, isDefault, isRealUser',
        messages: 'id, sessionId, timestamp, role',
        chatSessions: 'id, characterId, personaId, mode, lastMessageAt, createdAt',
        whisperCards: 'id, libraryId, *triggerWords',
        cardLibraries: 'id, name, *boundCharacterIds',
        memoryEntries:
          'id, characterId, sessionId, type, scope, importance, createdAt, updatedAt, isPermanent, enabled, status, source, *tags, *keywords',
        worldBookEntries: 'id, worldBookId, *key, isEnabled',
        worldBooks: 'id, characterId',
        todoItems: 'id, completed, dueAt, remindAt, priority, createdAt',
        noteEntries: 'id, owner, exposeToMemory, updatedAt',
        appSettings: 'id',
        stickerPacks: 'id, name, isEnabled, createdAt',
        stickerItems: 'id, packId, name, *triggerWords, createdAt'
      })
      .upgrade(async tx => {
        await tx.table('chatSessions').toCollection().modify((session: any) => {
          delete session.realUserDiary
        })

        await tx.table('memoryEntries').toCollection().modify((memory: any) => {
          memory.title ??= ''
          memory.scope ??= 'daily'
          memory.isRealUserRelated ??= memory.type === 'diary'
          memory.enabled ??= true
          memory.tags ??= []
          memory.keywords ??= []
          memory.priority ??= 0
          memory.status ??= 'saved'
          memory.source ??= 'user'
          memory.updatedAt ??= memory.createdAt ?? Date.now()
        })
      })

    this.version(5).stores({
      characters: 'id, name, createdAt',
      personas: 'id, name, isDefault, isRealUser',
      messages: 'id, sessionId, timestamp, role',
      chatSessions: 'id, characterId, personaId, mode, lastMessageAt, createdAt',
      whisperCards: 'id, libraryId, *triggerWords',
      cardLibraries: 'id, name, *boundCharacterIds',
      memoryEntries:
        'id, characterId, sessionId, type, scope, importance, createdAt, updatedAt, isPermanent, enabled, status, source, *tags, *keywords',
      worldBookEntries: 'id, worldBookId, *key, isEnabled',
      worldBooks: 'id, characterId',
      todoItems: 'id, completed, dueAt, remindAt, priority, createdAt',
      noteEntries: 'id, owner, exposeToMemory, updatedAt',
      appSettings: 'id',
      stickerPacks: 'id, name, isEnabled, createdAt',
      stickerItems: 'id, packId, name, *triggerWords, createdAt',
      // 新增
      cardCharacters: 'id, name, createdAt',
      cardSessions: 'id, cardCharacterId, personaId, lastMessageAt, createdAt',
      cardMessages: 'id, sessionId, timestamp, role',
      dailyRituals: 'id'
    })
      .upgrade(async tx => {
        await tx.table('cardSessions').toCollection().modify((session: any) => {
          session.typingIndicatorText ??= '正在输入...'
        })
      })
  }
}

export const db = new WhisperboxDB()

// 初始化默认设置
export async function initDefaultSettings(): Promise<void> {
  const existing = await db.appSettings.get('global')
  if (!existing) {
    await db.appSettings.put({
      id: 'global',
      apiBaseUrl: '',
      apiKey: '',
      selectedModel: '',
      availableModels: [],
      proactivePushEnabled: false,
      proactiveCheckInterval: 300,
      summarizeEveryN: 20,
      theme: 'dark',
      createdAt: Date.now(),
      updatedAt: Date.now()
    })
  }
}

export async function initDefaultPersona(): Promise<void> {
  const count = await db.personas.count()

  if (count > 0) return

  const now = Date.now()

  await db.personas.put({
    id: crypto.randomUUID(),
    name: 'User',
    avatar: '',
    description: '默认身份',
    isDefault: true,
    isRealUser: true,
    createdAt: now
  })
}

export async function initAppData(): Promise<void> {
  await initDefaultSettings()
  await initDefaultPersona()
}
