import { db, type Message, type ChatSession, type Character, type MemoryEntry } from '@/core/db'
import {
  getPromptMemoriesForSession,
  getTriggeredWorldbookEntries
} from './memoryService'

const REAL_USER_DIARY_EVERY_N_MESSAGES = 30

/**
 * 创建新会话
 */
export async function createSession(
  characterId: string,
  personaId: string,
  mode: 'roleplay' | 'daily' = 'roleplay'
): Promise<ChatSession> {
  const character = await db.characters.get(characterId)
  const now = Date.now()

  const session: ChatSession = {
    id: crypto.randomUUID(),
    characterId,
    personaId,
    mode,
    title: character?.name || '新对话',
    wallpaper: '',
    bubbleStyle: 'classic',
    memorySummarizeEveryN: 20,
    memoryEnabled: true,
    proactiveEnabled: false,
    proactiveFrequencyMinutes: 120,
    proactiveNotify: false,
    lastProactiveAt: null,
    lastMessageAt: now,

    // 新增：主动消息高级设置的默认值
    proactiveSilentNight: true,
    proactiveRequirePersonality: true,
    proactiveAllowDrawing: false,
    proactiveMinMessageCount: 8,
    proactiveMaxRecentMessages: 3,
    proactiveOnlyWhenLongConversation: true,
    createdAt: now
  }

  await db.chatSessions.add(session)

  // 如果角色有 firstMes，自动插入第一条消息
  if (character?.firstMes) {
    await addMessage(session.id, 'assistant', character.firstMes)
  }

  return session
}

/**
 * 添加消息到会话
 */
export async function addMessage(
  sessionId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  media?: Message['media']
): Promise<Message> {
  const now = Date.now()

  const message: Message = {
    id: crypto.randomUUID(),
    sessionId,
    role,
    content,
    media,
    isEdited: false,
    timestamp: now
  }

  await db.messages.add(message)
  await db.chatSessions.update(sessionId, { lastMessageAt: now })

  return message
}

/**
 * 删除（撤回）消息
 */
export async function deleteMessage(messageId: string): Promise<void> {
  await db.messages.delete(messageId)
}

/**
 * 获取会话所有消息
 */
export async function getSessionMessages(sessionId: string): Promise<Message[]> {
  return await db.messages
    .where('sessionId')
    .equals(sessionId)
    .sortBy('timestamp')
}

/**
 * 获取所有会话（按最后消息时间排序）
 */
export async function getAllSessions(): Promise<(ChatSession & { character?: Character })[]> {
  const sessions = await db.chatSessions
    .orderBy('lastMessageAt')
    .reverse()
    .toArray()

  const result = []
  for (const session of sessions) {
    const character = await db.characters.get(session.characterId)
    result.push({ ...session, character })
  }

  return result
}

/**
 * 删除会话及其所有消息
 */
export async function deleteSession(sessionId: string): Promise<void> {
  await db.messages.where('sessionId').equals(sessionId).delete()
  await db.chatSessions.delete(sessionId)
}

/**
 * 构建现实时间上下文
 */
function buildRealTimeContext(): string {
  const now = new Date()

  const dateText = now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })

  const timeText = now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })

  const hour = now.getHours()

  let period = '白天'
  if (hour >= 5 && hour < 9) period = '清晨'
  else if (hour >= 9 && hour < 12) period = '上午'
  else if (hour >= 12 && hour < 14) period = '中午'
  else if (hour >= 14 && hour < 18) period = '下午'
  else if (hour >= 18 && hour < 23) period = '夜晚'
  else period = '深夜'

  return `[现实时间]
当前日期：${dateText}
当前时间：${timeText}
当前时段：${period}

你可以自然地感知当前现实时间，例如早安、晚安、深夜关心、日期相关提醒等。
不要每条消息都机械地提及时间，只有在语境自然或有帮助时使用。`
}

function buildProactiveContext(params: {
  mode: 'daily' | 'roleplay'
  characterName: string
  characterPersonality: string
  conversationLength: number
}): string {
  const { mode, characterName, characterPersonality, conversationLength } = params

  const modeRule =
    mode === 'daily'
      ? `日常模式下，你主动发消息时应像：
- 简短问候
- 关心近况
- 轻微提醒
- 像短信一样自然、克制、不过度戏剧化`
      : `RP 模式下，你主动发消息时应像：
- 剧情推进
- 场景触发
- 角色来信
- 事件开端或转折
- 更具叙事感，但不要冗长空泛`

  return `[主动消息约束]
角色：${characterName}
角色性格：${characterPersonality || '未提供'}
当前对话长度：${conversationLength}

你必须按角色性格主动发消息，不能违背人设。
${modeRule}

额外要求：
- 如果当前对话太短，不要硬主动
- 如果最近消息非常密集，不要连续刷屏
- 主动消息要像“角色真的想联系对方”
- 不要提到系统、规则、触发器
- 可以非常自然地使用表情包、语音、图片或文字，但不要滥用`
}

/**
 * 构建发送给 API 的消息数组
 * 支持：
 * - 根据会话模式区别 prompt
 * - 用户人设注入
 * - 全局提示词、会话摘要、永久记忆、自定义记忆、真实 user 日记、世界书注入
 * - sticker / image / voice 特殊消息
 */
export async function buildApiMessages(
  sessionId: string,
  character: Character | undefined,
  personaDescription: string,
  currentUserInput = ''
): Promise<Array<{ role: string; content: string }>> {
  const session = await db.chatSessions.get(sessionId)
  const messages = await getSessionMessages(sessionId)

  if (!session) {
    throw new Error(`Session not found: ${sessionId}`)
  }

  // 使用当前用户输入和最近 10 条非 system 消息触发世界书。
  // sticker 仅使用名称、含义和描述参与触发，不把其格式化文本当作普通历史文本。
  const recentTriggerText = messages
    .filter(msg => msg.role !== 'system')
    .slice(-10)
    .map(msg => {
      if (msg.media?.type === 'sticker') {
        return [
          msg.content,
          msg.media.name,
          msg.media.meaning,
          msg.media.description
        ].filter(Boolean).join(' ')
      }

      if (msg.media) {
        return [
          msg.content,
          msg.media.description
        ].filter(Boolean).join(' ')
      }

      return msg.content
    })
    .join('\n')

  const worldbookTriggerText = [
    currentUserInput,
    recentTriggerText
  ].filter(Boolean).join('\n')

  const memoryBundle = await getPromptMemoriesForSession(session)

  const worldbookBundle = await getTriggeredWorldbookEntries({
    session,
    triggerText: worldbookTriggerText,
    maxEntries: 6
  })

  const apiMessages: Array<{ role: string; content: string }> = []

  let systemPrompt = ''

  // 1. system 基础设定：角色人设与场景
  if (character) {
    systemPrompt += character.systemPrompt
      ? character.systemPrompt
      : `你是${character.name}。${character.personality}\n${character.description}`

    if (character.scenario) {
      systemPrompt += `\n\n场景：${character.scenario}`
    }
  }

  systemPrompt += `\n\n${buildRealTimeContext()}`

  if (personaDescription) {
    if (session.mode === 'daily') {
      systemPrompt += `\n\n[用户信息：真实user]
${personaDescription}

你正在与真实用户进行日常短对话。你的回答风格应更自然、更短、更像陪伴式日常聊天。你需要记住与“真实user”相关的重要事件，并可用于后续日记/记忆。`
    } else {
      systemPrompt += `\n\n[用户信息：角色扮演user]
${personaDescription}

你正在进行角色扮演长对话。不要把对方当作现实中的真实用户来记录日记，不要生成真实user日记。`
    }
  }

  // 2. 构建记忆块
  const summaryBlock = buildMemoryBlock(
    '会话摘要',
    memoryBundle.summaries.map(item => ({
      title: item.title,
      content: item.content
    }))
  )

  const diaryBlock = buildMemoryBlock(
    '真实 user 日记',
    session.mode === 'daily'
      ? memoryBundle.diaries.map(item => ({
          title: item.title,
          content: item.content
        }))
      : []
  )

  const permanentBlock = buildMemoryBlock(
    '永久记忆',
    memoryBundle.permanent.map(item => ({
      title: item.title,
      content: item.content
    }))
  )

  const customBlock = buildMemoryBlock(
    '自定义记忆',
    memoryBundle.custom.map(item => ({
      title: item.title,
      content: item.content
    }))
  )

  const globalPromptBlock = buildMemoryBlock(
    '全局提示词',
    memoryBundle.globalPrompts.map(item => ({
      title: item.title,
      content: item.content
    }))
  )

  const worldbookBlock = buildMemoryBlock(
    worldbookBundle.matchedKeywords.length
      ? `世界书 · 触发词：${worldbookBundle.matchedKeywords.join('、')}`
      : '世界书',
    worldbookBundle.entries.map(item => ({
      title: item.title,
      content: item.content
    }))
  )

  // 3. 按指定顺序拼接记忆：
  // 全局提示词 → 会话摘要 → 永久记忆 → 自定义记忆 → 真实 user 日记 → 世界书
  const memoryPrompt = [
    globalPromptBlock,
    summaryBlock,
    permanentBlock,
    customBlock,
    diaryBlock,
    worldbookBlock
  ]
    .filter(Boolean)
    .join('\n\n')

  if (memoryPrompt) {
    systemPrompt += `\n\n${memoryPrompt}`
  }

  // 4. 消息格式说明必须位于记忆块之后
  systemPrompt += `\n\n[消息格式说明]
你可以在回复中使用以下特殊格式：
- 图片：[image: 图片描述]
- 语音：[voice: 语音描述]
- 表情包：[sticker: 表情包名称 | 表情包含义 | 表情包描述 | URL]

注意：
1. 用户也可能发送图片、语音、表情包。
2. 当用户发出表情包时，你必须理解这是表情包，不是普通文字。
3. 你可以在一条回复中混合使用普通文字和特殊格式。`

  if (systemPrompt) {
    apiMessages.push({ role: 'system', content: systemPrompt })
  }

  // 5. 历史聊天消息
  for (const msg of messages) {
    // 数据库中保存的 system 消息不作为历史对话发送给 API。
    // 主动消息触发指令通过 sendProactiveReply 直接追加至 apiMessages。
    if (msg.role === 'system') continue

    let content = msg.content || ''

    if (msg.media) {
      if (msg.media.type === 'image') {
        content = content
          ? `${content}\n[image: ${msg.media.description}]`
          : `[image: ${msg.media.description}]`
      } else if (msg.media.type === 'voice') {
        content = content
          ? `${content}\n[voice: ${msg.media.description}]`
          : `[voice: ${msg.media.description}]`
      } else if (msg.media.type === 'sticker') {
        const name = msg.media.name || '表情包'
        const meaning = msg.media.meaning || msg.media.description || ''
        const description = msg.media.description || ''
        const url = msg.media.url || ''

        content = content
          ? `${content}\n[sticker: ${name} | ${meaning} | ${description} | ${url}]`
          : `[sticker: ${name} | ${meaning} | ${description} | ${url}]`
      }
    }

    apiMessages.push({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content
    })
  }

  return apiMessages
}

function buildMemoryBlock(title: string, items: Array<{ title: string; content: string }>): string {
  if (!items.length) return ''

  return [
    `【${title}】`,
    ...items.map((item, index) => {
      const itemTitle = item.title?.trim() || `${title}${index + 1}`
      return `- ${itemTitle}：${item.content.trim()}`
    })
  ].join('\n')
}

/**
 * 格式化消息，供会话摘要 AI 使用
 */
function formatMessageForSummary(message: Message): string {
  const roleLabel =
    message.role === 'assistant'
      ? '角色'
      : message.role === 'user'
        ? 'user'
        : 'system'

  if (message.media) {
    if (message.media.type === 'sticker') {
      return `${roleLabel}：发送了表情包「${message.media.name || '表情包'}」`
    }

    if (message.media.type === 'image') {
      return `${roleLabel}：发送了图片，描述：${message.media.description || '无'}`
    }

    if (message.media.type === 'voice') {
      return `${roleLabel}：发送了语音，描述：${message.media.description || '无'}`
    }
  }

  return `${roleLabel}：${message.content || ''}`
}

/**
 * 构建主动消息触发文本
 *
 * 用于主动消息场景下触发世界书。
 * 注意：
 * - sticker 不当普通文本处理，而是使用名称、含义、描述参与触发
 * - image / voice 使用描述参与触发
 * - daily / roleplay 使用不同主动语境
 */
function buildProactiveTriggerText(params: {
  session: ChatSession
  character?: Character
  recentMessages: Message[]
}): string {
  const recentText = params.recentMessages
    .filter(msg => msg.role !== 'system')
    .slice(-10)
    .map(msg => {
      if (msg.media?.type === 'sticker') {
        return [
          msg.content,
          `表情包：${msg.media.name || ''}`,
          `含义：${msg.media.meaning || ''}`,
          `描述：${msg.media.description || ''}`
        ].filter(Boolean).join(' ')
      }

      if (msg.media?.type === 'image') {
        return [
          msg.content,
          `图片描述：${msg.media.description || ''}`
        ].filter(Boolean).join(' ')
      }

      if (msg.media?.type === 'voice') {
        return [
          msg.content,
          `语音描述：${msg.media.description || ''}`
        ].filter(Boolean).join(' ')
      }

      return msg.content || ''
    })
    .join('\n')

  const modeHint = params.session.mode === 'daily'
    ? '这是 daily 日常陪伴模式，主动消息应像短短信、问候、关心或自然想起 user。'
    : '这是 roleplay RP 模式，主动消息应像剧情推进、场景触发、角色来信或氛围延续。'

  return [
    modeHint,
    params.character?.name ? `当前角色：${params.character.name}` : '',
    recentText
  ].filter(Boolean).join('\n')
}


/**
 * 格式化消息，供真实 user 日记草稿 AI 使用
 */
function formatMessageForDiary(message: Message): string {
  const roleLabel = message.role === 'assistant'
    ? '角色'
    : message.role === 'user'
      ? 'user'
      : 'system'

  if (message.media) {
    if (message.media.type === 'sticker') {
      return `${roleLabel}：发送了表情包「${message.media.name || '表情包'}」，含义：${message.media.meaning || message.media.description || '无'}`
    }

    if (message.media.type === 'image') {
      return `${roleLabel}：发送了图片，描述：${message.media.description || '无'}`
    }

    if (message.media.type === 'voice') {
      return `${roleLabel}：发送了语音，描述：${message.media.description || '无'}`
    }
  }

  return `${roleLabel}：${message.content || ''}`
}

/**
 * 创建 AI 生成的会话摘要记忆
 */
async function createAiSessionSummaryEntry(params: {
  session: ChatSession
  content: string
  checkpoint: number
}): Promise<MemoryEntry> {
  const now = Date.now()

  const entry: MemoryEntry = {
    id: crypto.randomUUID(),
    characterId: params.session.characterId,
    sessionId: params.session.id,
    type: 'summary',
    title: `会话摘要 · 第 ${params.checkpoint} 条`,
    content: params.content,
    scope: params.session.mode,
    isRealUserRelated: params.session.mode === 'daily',
    isPermanent: false,
    enabled: true,
    importance: 70,
    tags: [
      'summary',
      'ai-generated',
      `checkpoint:${params.checkpoint}`
    ],
    keywords: [],
    priority: 0,
    status: 'saved',
    source: 'ai',
    createdAt: now,
    updatedAt: now
  }

  await db.memoryEntries.add(entry)

  return entry
}

/**
 * 创建 AI 生成的真实 user 日记草稿
 */
async function createAiDiaryDraftEntry(params: {
  session: ChatSession
  content: string
  checkpoint: number
}): Promise<MemoryEntry> {
  const now = Date.now()

  const entry: MemoryEntry = {
    id: crypto.randomUUID(),
    characterId: params.session.characterId,
    sessionId: params.session.id,
    type: 'diary',
    title: `AI 日记草稿 · 第 ${params.checkpoint} 条`,
    content: params.content,
    scope: 'daily',
    isRealUserRelated: true,
    isPermanent: false,
    enabled: true,
    importance: 60,
    tags: [
      'real-user',
      'diary',
      'ai-generated',
      `checkpoint:${params.checkpoint}`
    ],
    keywords: [],
    priority: 0,
    status: 'draft',
    source: 'ai',
    createdAt: now,
    updatedAt: now
  }

  await db.memoryEntries.add(entry)

  return entry
}

/**
 * 每 memorySummarizeEveryN 条非 system 消息，尝试生成一条新的会话摘要
 */
async function maybeGenerateSessionSummary(sessionId: string): Promise<void> {
  const session = await db.chatSessions.get(sessionId)

  if (!session) return

  // 会话记忆关闭时不生成摘要
  if (!session.memoryEnabled) return

  const threshold = session.memorySummarizeEveryN || 20

  // 小于等于 0 表示不触发自动摘要
  if (threshold <= 0) return

  const messages = await getSessionMessages(sessionId)

  // 只统计真实对话消息，不统计 system
  const conversationMessages = messages.filter(msg => msg.role !== 'system')

  const messageCount = conversationMessages.length

  // 不到阈值不触发
  if (messageCount < threshold) return

  // 只在 threshold、2 * threshold、3 * threshold... 这些节点触发
  if (messageCount % threshold !== 0) return

  const checkpoint = messageCount

  // 防止同一个节点重复生成
  const existing = await db.memoryEntries
    .where('sessionId')
    .equals(sessionId)
    .and(entry =>
      entry.type === 'summary' &&
      entry.source === 'ai' &&
      entry.tags?.includes(`checkpoint:${checkpoint}`)
    )
    .first()

  if (existing) return

  const character = await db.characters.get(session.characterId)
  const persona = await db.personas.get(session.personaId)

  const recentMessages = conversationMessages
    .slice(-threshold)
    .map(formatMessageForSummary)
    .join('\n')

  const summaryPrompt = [
    {
      role: 'system',
      content: `你正在为 Whisperbox 的聊天会话撰写摘要。

重要规则：
1. 摘要用于记忆系统，不是角色回复。
2. 只保留有助于后续对话的关键信息。
3. 简洁、准确、克制。
4. 不要写无关寒暄。
5. 不要编造没发生的内容。
6. 如果这段对话没有值得记录的内容，请输出空字符串。
7. 输出只需要摘要正文，不要加标题，不要加解释。`
    },
    {
      role: 'user',
      content: `会话信息：
模式：${session.mode}
角色：${character?.name || '未知角色'}
用户人设：${persona?.description || persona?.name || '未知'}

最近 ${threshold} 条消息：
${recentMessages}

请基于以上内容生成一条会话摘要。`
    }
  ]

  const summaryContent = (await callApi(summaryPrompt)).trim()

  // AI 判断没有值得记录的内容时，不保存
  if (!summaryContent) return

  await createAiSessionSummaryEntry({
    session,
    content: summaryContent,
    checkpoint
  })
}

/**
 * 每 30 条非 system 消息，尝试为真实 user 生成一条日记草稿
 */
async function maybeGenerateRealUserDiaryDraft(sessionId: string): Promise<void> {
  const session = await db.chatSessions.get(sessionId)

  if (!session) return

  // 只在 daily 模式生成真实 user 日记
  if (session.mode !== 'daily') return

  // 会话记忆关闭时不生成
  if (!session.memoryEnabled) return

  const persona = await db.personas.get(session.personaId)

  // 必须是真实 user，人设不能写死
  if (!persona?.isRealUser) return

  const messages = await getSessionMessages(sessionId)

  // 只统计真实对话消息，不统计 system
  const conversationMessages = messages.filter(msg => msg.role !== 'system')

  const messageCount = conversationMessages.length

  // 不到 30 条不触发
  if (messageCount < REAL_USER_DIARY_EVERY_N_MESSAGES) return

  // 只在 30、60、90... 这些节点触发
  if (messageCount % REAL_USER_DIARY_EVERY_N_MESSAGES !== 0) return

  const checkpoint = messageCount

  // 防止同一个节点重复生成
  const existing = await db.memoryEntries
    .where('sessionId')
    .equals(sessionId)
    .and(entry =>
      entry.type === 'diary' &&
      entry.source === 'ai' &&
      entry.tags?.includes(`checkpoint:${checkpoint}`)
    )
    .first()

  if (existing) return

  const character = await db.characters.get(session.characterId)

  const recentMessages = conversationMessages
    .slice(-REAL_USER_DIARY_EVERY_N_MESSAGES)
    .map(formatMessageForDiary)
    .join('\n')

  const diaryPrompt = [
    {
      role: 'system',
      content: `你正在为 Whisperbox 的 daily 日常陪伴对话撰写“真实 user 日记草稿”。

重要规则：
1. 这是给用户之后查看和编辑的日记草稿，不是角色回复。
2. 只记录真实 user 相关的现实情绪、事件、状态、偏好、关系变化。
3. 不要编造用户没有说过的现实信息。
4. 不要写 RP 设定，不要把角色扮演内容当成真实 user 日记。
5. 语言要像温柔、克制的私人日记记录。
6. 输出只需要日记正文，不要加标题，不要加解释。
7. 如果这 30 条对话没有值得记录的真实 user 内容，请输出空字符串。`
    },
    {
      role: 'user',
      content: `当前会话信息：
模式：${session.mode}
角色：${character?.name || '未知角色'}
真实 user 人设：${persona.description || persona.name}

最近 ${REAL_USER_DIARY_EVERY_N_MESSAGES} 条对话：
${recentMessages}

请基于以上内容，为真实 user 写一条新的日记草稿。`
    }
  ]

  const diaryContent = (await callApi(diaryPrompt)).trim()

  // AI 判断没有值得记录的内容时，不保存
  if (!diaryContent) return

  await createAiDiaryDraftEntry({
    session,
    content: diaryContent,
    checkpoint
  })
}

/**
 * 解析 AI 回复中的特殊消息标记
 * 返回一个或多个消息片段
 */
export interface ParsedSegment {
  type: 'text' | 'image' | 'voice' | 'sticker'
  content: string
  name?: string
  meaning?: string
  url?: string
}

export function parseAiReply(raw: string): ParsedSegment[] {
  const segments: ParsedSegment[] = []
  const regex = /\[(image|voice|sticker):\s*([^\]]+)\]/g

  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(raw)) !== null) {
    // 前面的文字
    const before = raw.substring(lastIndex, match.index).trim()
    if (before) {
      segments.push({ type: 'text', content: before })
    }

    const type = match[1] as ParsedSegment['type']
    const body = match[2].trim()

    if (type === 'sticker') {
      const parts = body.split('|').map(s => s.trim())
      segments.push({
        type,
        name: parts[0] || '表情包',
        meaning: parts[1] || '',
        content: parts[2] || parts[0] || '',
        url: parts[3] || ''
      })
    } else {
      segments.push({ type, content: body })
    }

    lastIndex = match.index + match[0].length
  }

  // 剩余文字
  const remaining = raw.substring(lastIndex).trim()
  if (remaining) {
    segments.push({ type: 'text', content: remaining })
  }

  // 如果没有匹配到任何特殊格式，返回原文
  if (segments.length === 0) {
    segments.push({ type: 'text', content: raw })
  }

  return segments
}

/**
 * 调用 API 获取 AI 回复
 */
export async function callApi(
  apiMessages: Array<{ role: string; content: string }>
): Promise<string> {
  const settings = await db.appSettings.get('global')

  if (!settings?.apiBaseUrl || !settings?.apiKey) {
    throw new Error('请先在设置中配置 API')
  }

  if (!settings.selectedModel) {
    throw new Error('请先在设置中选择模型')
  }

  const baseUrl = settings.apiBaseUrl.replace(/\/+$/, '')

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.apiKey}`
    },
    body: JSON.stringify({
      model: settings.selectedModel,
      messages: apiMessages
    })
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(`HTTP ${response.status}${errorText ? ': ' + errorText.substring(0, 200) : ''}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content

  if (!content) {
    throw new Error('API 返回格式异常，未获取到回复内容')
  }

  return content
}

/**
 * 发送消息并获取 AI 回复
 * 返回一组消息（因为 AI 可能发送多条含特殊格式的消息）
 */
export async function sendAndGetReply(
  sessionId: string,
  characterId: string,
  personaDescription: string
): Promise<Message[]> {
  const character = await db.characters.get(characterId)

  const latestUserMessage = [...await getSessionMessages(sessionId)]
    .filter(msg => msg.role === 'user')
    .sort((a, b) => b.timestamp - a.timestamp)[0]

  const currentUserInput = latestUserMessage
    ? formatMessageForSummary(latestUserMessage)
    : ''

  const apiMessages = await buildApiMessages(
    sessionId,
    character,
    personaDescription,
    currentUserInput
  )

  const replyContent = await callApi(apiMessages)

  const segments = parseAiReply(replyContent)
  const resultMessages: Message[] = []

  for (const segment of segments) {
    if (segment.type === 'text') {
      const msg = await addMessage(sessionId, 'assistant', segment.content)
      resultMessages.push(msg)
    } else {
      const msg = await addMessage(sessionId, 'assistant', '', {
        type: segment.type,
        description: segment.content,
        url: segment.url || '',
        name: segment.name,
        meaning: segment.meaning
      })
      resultMessages.push(msg)
    }
  }

  // AI 回复成功入库后，先尝试生成会话摘要。
  // 注意：这里失败不应该影响正常聊天。
  try {
    await maybeGenerateSessionSummary(sessionId)
  } catch (error) {
    console.warn('[memory] 自动生成会话摘要失败:', error)
  }

  // 摘要完成后，再尝试生成真实 user 日记草稿。
  // 注意：这里失败不应该影响正常聊天。
  try {
    await maybeGenerateRealUserDiaryDraft(sessionId)
  } catch (error) {
    console.warn('[memory] 自动生成真实 user 日记草稿失败:', error)
  }

  return resultMessages
}

/**
 * 主动触发角色发送消息并获取 AI 回复
 *
 * 主动触发指令直接加入 API 消息数组，而不是写入数据库 system 消息，
 * 避免被 buildApiMessages 中跳过 system 历史消息的逻辑过滤。
 */

export async function sendProactiveReply(
  sessionId: string,
  characterId: string,
  personaDescription: string,
  options?: {
    mode?: 'daily' | 'roleplay'
    conversationLength?: number
  }
): Promise<Message[]> {
  const session = await db.chatSessions.get(sessionId)

  if (!session) {
    throw new Error(`Session not found: ${sessionId}`)
  }

  const character = await db.characters.get(characterId)
  const recentMessages = await getSessionMessages(sessionId)

  const proactiveTriggerText = buildProactiveTriggerText({
    session,
    character,
    recentMessages
  })

  const apiMessages = await buildApiMessages(
    sessionId,
    character,
    personaDescription,
    proactiveTriggerText
  )

  apiMessages.push({
    role: 'system',
    content: [
      buildProactiveContext({
        mode: options?.mode || session.mode || 'roleplay',
        characterName: character?.name || '角色',
        characterPersonality: character?.personality || '',
        conversationLength: options?.conversationLength || recentMessages.filter(msg => msg.role !== 'system').length
      }),
      session.mode === 'daily'
        ? `【主动消息规则】
你现在要主动给 user 发一条 daily 日常陪伴短信。

规则：
1. 短一点，像真实聊天里的主动问候或关心。
2. 不要像公告、客服或任务提醒。
3. 可以结合记忆、日记、摘要、最近聊天状态。
4. 不要假装 user 刚刚说了没说过的话。
5. 如果使用表情包，必须使用 [sticker: 名称 | 含义 | 描述 | URL] 格式。
6. 不要刷屏，不要连续追问。`
        : `【主动消息规则】
你现在要主动给 user 发一条 RP 模式消息。

规则：
1. 像剧情推进、场景触发、角色来信或氛围延续。
2. 可以结合世界书、角色设定、会话摘要和最近剧情。
3. 不要记录真实 user 日记。
4. 不要像客服通知。
5. 如果使用表情包，必须使用 [sticker: 名称 | 含义 | 描述 | URL] 格式。
6. 不要强行打断剧情，应保持角色语气。`
    ].join('\n\n')
  })

  const replyContent = await callApi(apiMessages)
  const segments = parseAiReply(replyContent)
  const resultMessages: Message[] = []

  for (const segment of segments) {
    if (segment.type === 'text') {
      const msg = await addMessage(sessionId, 'assistant', segment.content)
      resultMessages.push(msg)
    } else {
      const msg = await addMessage(sessionId, 'assistant', '', {
        type: segment.type,
        description: segment.content,
        url: segment.url || '',
        name: segment.name,
        meaning: segment.meaning
      })
      resultMessages.push(msg)
    }
  }

  // 主动消息成功入库后，也先尝试生成会话摘要。
  // 注意：这里失败不应该影响正常聊天。
  try {
    await maybeGenerateSessionSummary(sessionId)
  } catch (error) {
    console.warn('[memory] 自动生成会话摘要失败:', error)
  }

  // 摘要完成后，再尝试生成真实 user 日记草稿。
  // 注意：这里失败不应该影响正常聊天。
  try {
    await maybeGenerateRealUserDiaryDraft(sessionId)
  } catch (error) {
    console.warn('[memory] 自动生成真实 user 日记草稿失败:', error)
  }

  return resultMessages
}


/**
 * 重新生成某条 AI 消息（删掉旧的，重新请求）
 */
export async function rerollMessage(
  messageId: string,
  sessionId: string,
  characterId: string,
  personaDescription: string
): Promise<Message[]> {
  await deleteMessage(messageId)
  return await sendAndGetReply(sessionId, characterId, personaDescription)
}
