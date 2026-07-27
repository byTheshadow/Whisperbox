import { db, type Message, type ChatSession, type Character } from '@/core/db'

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
    bubbleStyle: '',
    realUserDiary: '',
    memorySummarizeEveryN: 20,
    memoryEnabled: true,
    lastMessageAt: now,
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
 * 构建发送给 API 的消息数组
 * 支持：
 * - 根据会话模式区别 prompt
 * - 用户人设注入
 * - sticker / image / voice 特殊消息
 * - 为后续记忆系统预留入口
 */
export async function buildApiMessages(
  sessionId: string,
  character: Character | undefined,
  personaDescription: string
): Promise<Array<{ role: string; content: string }>> {
  const session = await db.chatSessions.get(sessionId)
  const messages = await getSessionMessages(sessionId)

  const apiMessages: Array<{ role: string; content: string }> = []

  let systemPrompt = ''

  if (character) {
    systemPrompt += character.systemPrompt
      ? character.systemPrompt
      : `你是${character.name}。${character.personality}\n${character.description}`

    if (character.scenario) {
      systemPrompt += `\n\n场景：${character.scenario}`
    }
  }

  if (personaDescription) {
    if (session?.mode === 'daily') {
      systemPrompt += `\n\n[用户信息：真实user]
${personaDescription}

你正在与真实用户进行日常短对话。你的回答风格应更自然、更短、更像陪伴式日常聊天。你需要记住与“真实user”相关的重要事件，并可用于后续日记/记忆。`
    } else {
      systemPrompt += `\n\n[用户信息：角色扮演user]
${personaDescription}

你正在进行角色扮演长对话。不要把对方当作现实中的真实用户来记录日记，不要生成真实user日记。`
    }
  }

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

  for (const msg of messages) {
    if (msg.role === 'system') continue

    let content = msg.content || ''

    if (msg.media) {
      if (msg.media.type === 'image') {
        content = content ? `${content}\n[image: ${msg.media.description}]` : `[image: ${msg.media.description}]`
      } else if (msg.media.type === 'voice') {
        content = content ? `${content}\n[voice: ${msg.media.description}]` : `[voice: ${msg.media.description}]`
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
  const apiMessages = await buildApiMessages(sessionId, character, personaDescription)
  const replyContent = await callApi(apiMessages)

  // 解析 AI 回复
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
