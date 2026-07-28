import { db, type MemoryEntry, type ChatSession } from '@/core/db'

function sortByRecent<T extends { createdAt: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.createdAt - a.createdAt)
}

function takeRecent<T extends { createdAt: number }>(items: T[], limit: number): T[] {
  return sortByRecent(items).slice(0, limit).reverse()
}

function takeByImportance<T extends { createdAt: number; importance: number }>(items: T[], limit: number): T[] {
  return [...items]
    .sort((a, b) => {
      if (b.importance !== a.importance) return b.importance - a.importance
      return b.createdAt - a.createdAt
    })
    .slice(0, limit)
    .reverse()
}


export type CreateMemoryEntryInput = {
  characterId?: string
  sessionId?: string
  type: MemoryEntry['type']
  title: string
  content: string
  scope: MemoryEntry['scope']
  isRealUserRelated?: boolean
  isPermanent?: boolean
  enabled?: boolean
  importance?: number
  tags?: string[]
  keywords?: string[]
  priority?: number
  status?: MemoryEntry['status']
  source?: MemoryEntry['source']
}

/**
 * 创建记忆条目
 */
export async function createMemoryEntry(input: CreateMemoryEntryInput): Promise<MemoryEntry> {
  const now = Date.now()

  const entry: MemoryEntry = {
    id: crypto.randomUUID(),
    characterId: input.characterId ?? '',
    sessionId: input.sessionId ?? '',
    type: input.type,
    title: input.title,
    content: input.content,
    scope: input.scope,
    isRealUserRelated: input.isRealUserRelated ?? false,
    isPermanent: input.isPermanent ?? false,
    enabled: input.enabled ?? true,
    importance: input.importance ?? 50,
    tags: input.tags ?? [],
    keywords: input.keywords ?? [],
    priority: input.priority ?? 0,
    status: input.status ?? 'saved',
    source: input.source ?? 'user',
    createdAt: now,
    updatedAt: now
  }

  await db.memoryEntries.add(entry)
  return entry
}

/**
 * 获取某个会话的全部记忆
 */
export async function getSessionMemories(sessionId: string): Promise<MemoryEntry[]> {
  return await db.memoryEntries
    .where('sessionId')
    .equals(sessionId)
    .and(entry => entry.enabled !== false)
    .sortBy('createdAt')
}

/**
 * 获取某个会话的真实 user 日记
 * 注意：日记是多条，不覆盖旧条目。
 */
export async function getSessionDiaries(sessionId: string): Promise<MemoryEntry[]> {
  return await db.memoryEntries
    .where('sessionId')
    .equals(sessionId)
    .and(entry => entry.type === 'diary')
    .sortBy('createdAt')
}

/**
 * 新增一条真实 user 日记。
 * 每次都是新增，不覆盖。
 */
export async function createRealUserDiaryEntry(params: {
  session: ChatSession
  content: string
  title?: string
  source?: 'user' | 'ai' | 'system'
  status?: 'saved' | 'draft' | 'archived'
}): Promise<MemoryEntry> {
  return await createMemoryEntry({
    characterId: params.session.characterId,
    sessionId: params.session.id,
    type: 'diary',
    title: params.title || '真实 user 日记',
    content: params.content,
    scope: 'daily',
    isRealUserRelated: true,
    isPermanent: false,
    enabled: true,
    importance: 60,
    tags: [
      'real-user',
      'diary',
      params.source === 'ai' ? 'ai-generated' : 'user-written'
    ],
    keywords: [],
    priority: 0,
    status: params.status ?? 'saved',
    source: params.source ?? 'user'
  })
}

/**
 * 更新记忆条目
 */
export async function updateMemoryEntry(
  id: string,
  patch: Partial<Omit<MemoryEntry, 'id' | 'createdAt'>>
): Promise<void> {
  await db.memoryEntries.update(id, {
    ...patch,
    updatedAt: Date.now()
  })
}

/**
 * 删除记忆条目
 */
export async function deleteMemoryEntry(id: string): Promise<void> {
  await db.memoryEntries.delete(id)
}

/**
 * 获取某个会话的摘要记忆
 */
export async function getSessionSummaries(sessionId: string): Promise<MemoryEntry[]> {
  return await db.memoryEntries
    .where('sessionId')
    .equals(sessionId)
    .and(entry => entry.type === 'summary' && entry.enabled !== false)
    .sortBy('createdAt')
}

/**
 * 新增一条会话摘要。
 * 每 N 条消息触发时使用。
 */
export async function createSessionSummaryEntry(params: {
  session: ChatSession
  content: string
  title?: string
}): Promise<MemoryEntry> {
  return await createMemoryEntry({
    characterId: params.session.characterId,
    sessionId: params.session.id,
    type: 'summary',
    title: params.title || '会话摘要',
    content: params.content,
    scope: params.session.mode,
    isRealUserRelated: false,
    isPermanent: false,
    enabled: true,
    importance: 40,
    tags: ['summary'],
    keywords: [],
    priority: 0,
    status: 'saved',
    source: 'ai'
  })
}

/**
 * 获取启用中的全局提示词
 */
export async function getEnabledGlobalPrompts(): Promise<MemoryEntry[]> {
  return await db.memoryEntries
    .where('type')
    .equals('globalPrompt')
    .and(entry => entry.enabled !== false && entry.status !== 'archived')
    .sortBy('priority')
}

/**
 * 保存全局提示词。
 * 目前先用固定 id，保证全局只有一个主提示词输入框。
 */
export async function saveGlobalPrompt(content: string): Promise<void> {
  const now = Date.now()
  const existing = await db.memoryEntries.get('global-chat-prompt')

  await db.memoryEntries.put({
    id: 'global-chat-prompt',
    characterId: '',
    sessionId: '',
    type: 'globalPrompt',
    title: '全局提示词',
    content,
    scope: 'global',
    isRealUserRelated: false,
    isPermanent: true,
    enabled: true,
    importance: 100,
    tags: ['global-prompt'],
    keywords: [],
    priority: 100,
    status: 'saved',
    source: 'system',
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  })
}

/**
 * 获取当前会话可注入 prompt 的记忆。
 * 后面 chatService.ts 调 API 前会用到。
 */
export async function getPromptMemoriesForSession(session: ChatSession): Promise<{
  summaries: MemoryEntry[]
  diaries: MemoryEntry[]
  permanent: MemoryEntry[]
  custom: MemoryEntry[]
  globalPrompts: MemoryEntry[]
}> {
  if (!session.memoryEnabled) {
    return {
      summaries: [],
      diaries: [],
      permanent: [],
      custom: [],
      globalPrompts: []
    }
  }

  const sessionEntries = await db.memoryEntries
    .where('sessionId')
    .equals(session.id)
    .and(entry => entry.enabled !== false && entry.status !== 'archived')
    .toArray()

  const globalPrompts = await getEnabledGlobalPrompts()

  const summaries = takeRecent(
    sessionEntries.filter(entry => entry.type === 'summary'),
    3
  )

  const diaries = session.mode === 'daily'
    ? takeRecent(
        sessionEntries.filter(entry => entry.type === 'diary' && entry.isRealUserRelated),
        5
      )
    : []

  const permanent = takeByImportance(
    sessionEntries.filter(entry => entry.type === 'permanent' || entry.isPermanent),
    5
  )

  const custom = takeByImportance(
    sessionEntries.filter(entry => entry.type === 'custom'),
    5
  )

  const globalPromptTop = globalPrompts.length > 0 ? [globalPrompts[0]] : []

  return {
    summaries,
    diaries,
    permanent,
    custom,
    globalPrompts: globalPromptTop
  }
}


  const sessionEntries = await db.memoryEntries
    .where('sessionId')
    .equals(session.id)
    .and(entry => entry.enabled !== false && entry.status !== 'archived')
    .toArray()

  const globalPrompts = await getEnabledGlobalPrompts()

  return {
    summaries: sessionEntries
      .filter(entry => entry.type === 'summary')
      .sort((a, b) => a.createdAt - b.createdAt),

    diaries: session.mode === 'daily'
      ? sessionEntries
          .filter(entry => entry.type === 'diary' && entry.isRealUserRelated)
          .sort((a, b) => a.createdAt - b.createdAt)
      : [],

    permanent: sessionEntries
      .filter(entry => entry.type === 'permanent' || entry.isPermanent)
      .sort((a, b) => b.importance - a.importance),

    custom: sessionEntries
      .filter(entry => entry.type === 'custom')
      .sort((a, b) => b.importance - a.importance),

    globalPrompts: globalPrompts.sort((a, b) => b.priority - a.priority)
  }
}
