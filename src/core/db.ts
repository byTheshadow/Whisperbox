import Dexie, { type Table } from 'dexie'

// ========== 数据模型定义 ==========

/** 角色卡（兼容 SillyTavern V2） */
export interface Character {
  id: string
  name: string
  avatar: string // Base64 或本地路径
  description: string
  personality: string
  scenario: string
  firstMes: string
  mesExample: string
  creatorNotes: string
  systemPrompt: string
  postHistoryUser: string
  worldBookId: string // 绑定的角色世界书 ID
  cardLibraryIds: string[] // 绑定的字卡库 ID
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
  createdAt: number
}

/** 消息 */
export interface Message {
  id: string
  sessionId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  media?: {
    type: 'image' | 'voice'
    description: string
    url: string
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
  realUserDiary: string // AI 写的关于真实 User 的日记
  lastMessageAt: number
  createdAt: number
}

/** 字卡条目 */
export interface WhisperCard {
  id: string
  libraryId: string
  content: string
  triggerWords: string[] // 匹配触发词
  weight: number // 权重，用于加权随机
  createdAt: number
}

/** 字卡库 */
export interface CardLibrary {
  id: string
  name: string
  description: string
  boundCharacterIds: string[] // 绑定的角色（空数组 = 公共库）
  replyInterval: number // 主动传讯间隔（秒），0 = 关闭
  typingText: string // 自定义打字指示文案
  createdAt: number
}

/** 记忆条目 */
export interface MemoryEntry {
  id: string
  characterId: string
  sessionId: string
  type: 'summary' | 'event' | 'diary' | 'custom'
  content: string
  importance: number // 1-5 重要度
  tags: string[]
  createdAt: number
  updatedAt: number
}

/** 世界书条目 */
export interface WorldBookEntry {
  id: string
  worldBookId: string
  key: string[] // 触发关键词组
  content: string
  isEnabled: boolean
  priority: number
  position: 'before' | 'after' // 注入 Prompt 的位置
  createdAt: number
}

/** 世界书 */
export interface WorldBook {
  id: string
  name: string
  characterId: string // 空字符串 = 全局世界书
  description: string
  createdAt: number
}

/** Todo 任务 */
export interface TodoItem {
  id: string
  title: string
  description: string
  completed: boolean
  dueAt: number | null // 截止时间戳
  remindAt: number | null // 提醒时间戳
  characterId: string // 绑定的提醒角色（空 = 系统通知）
  priority: 'low' | 'medium' | 'high'
  tags: string[]
  completedAt: number | null
  createdAt: number
}

/** 备忘录 */
export interface NoteEntry {
  id: string
  owner: 'user' | string // 'user' 或角色 ID
  title: string
  content: string
  exposeToMemory: boolean // 是否暴露给 AI 记忆库
  tags: string[]
  updatedAt: number
  createdAt: number
}

/** 全局设置 */
export interface AppSettings {
  id: string // 固定为 'global'
  apiBaseUrl: string
  apiKey: string
  selectedModel: string
  proactivePushEnabled: boolean
  proactiveCheckInterval: number // 秒
  summarizeEveryN: number // 每 N 条对话生成摘要
  theme: 'dark' // 未来可扩展
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

  constructor() {
    super('whisperbox')

    this.version(1).stores({
      characters: 'id, name, createdAt',
      personas: 'id, name, isDefault',
      messages: 'id, sessionId, timestamp, role',
      chatSessions: 'id, characterId, mode, lastMessageAt, createdAt',
      whisperCards: 'id, libraryId, *triggerWords',
      cardLibraries: 'id, name, *boundCharacterIds',
      memoryEntries: 'id, characterId, sessionId, type, importance, createdAt',
      worldBookEntries: 'id, worldBookId, *key, isEnabled',
      worldBooks: 'id, characterId',
      todoItems: 'id, completed, dueAt, remindAt, priority, createdAt',
      noteEntries: 'id, owner, exposeToMemory, updatedAt',
      appSettings: 'id'
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
      proactivePushEnabled: false,
      proactiveCheckInterval: 300,
      summarizeEveryN: 20,
      theme: 'dark',
      createdAt: Date.now(),
      updatedAt: Date.now()
    })
  }
}
