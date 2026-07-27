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
  realUserDiary: string
  lastMessageAt: number
  createdAt: number
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

/** 记忆条目 */
export interface MemoryEntry {
  id: string
  characterId: string
  sessionId: string
  type: 'summary' | 'event' | 'diary' | 'custom'
  content: string
  importance: number
  tags: string[]
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

  constructor() {
    super('whisperbox')

    this.version(2).stores({
      characters: 'id, name, createdAt',
      personas: 'id, name, isDefault, isRealUser',
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
