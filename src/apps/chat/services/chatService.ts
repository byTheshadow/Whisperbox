import { db, type Message, type ChatSession, type Character } from '@/core/db'

/**
 * 创建新会话
 */
export async function createSession(characterId: string, personaId: string): Promise<ChatSession> {
  const character = await db.characters.get(characterId)
  const now = Date.now()

  const session: ChatSession = {
    id: crypto.randomUUID(),
    characterId,
    personaId,
    mode: 'roleplay',
    title: character?.name || '新对话',
    wallpaper: '',
    bubbleStyle: '',
    realUserDiary: '',
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

  // 更新会话最后消息时间
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
 */
export async function buildApiMessages(
  sessionId: string,
  character: Character | undefined,
  personaDescription: string
): Promise<Array<{ role: string; content: string }>> {
  const messages = await getSessionMessages(sessionId)

  const apiMessages: Array<{ role: string; content: string }> = []

  // 系统提示
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
    systemPrompt += `\n\n[用户信息] ${personaDescription}`
  }

  if (systemPrompt) {
    apiMessages.push({ role: 'system', content: systemPrompt })
  }

  // 对话历史
  for (const msg of messages) {
    if (msg.role === 'system') continue

    let content = msg.content

    // 如果有媒体附件，把描述拼入内容
    if (msg.media) {
      if (msg.media.type === 'image') {
        content += `\n[用户发送了一张图片：${msg.media.description}]`
      } else if (msg.media.type === 'voice') {
        content += `\n[用户发送了一条语音：${msg.media.description}]`
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
    throw new Error(`API 请求失败：HTTP ${response.status} ${errorText}`)
  }

  const data = await response.json()

  const content = data.choices?.[0]?.message?.content

  if (!content) {
    throw new Error('API 返回格式异常，未获取到回复内容')
  }

  return content
}

/**
 * 发送消息并获取 AI 回复（完整流程）
 */
export async function sendAndGetReply(
  sessionId: string,
  characterId: string,
  personaDescription: string
): Promise<Message> {
  const character = await db.characters.get(characterId)
  const apiMessages = await buildApiMessages(sessionId, character, personaDescription)
  const replyContent = await callApi(apiMessages)
  const replyMessage = await addMessage(sessionId, 'assistant', replyContent)
  return replyMessage
}

/**
 * 重新生成某条 AI 消息（删掉旧的，重新请求）
 */
export async function rerollMessage(
  messageId: string,
  sessionId: string,
  characterId: string,
  personaDescription: string
): Promise<Message> {
  // 删掉旧消息
  await deleteMessage(messageId)

  // 重新请求
  return await sendAndGetReply(sessionId, characterId, personaDescription)
}
