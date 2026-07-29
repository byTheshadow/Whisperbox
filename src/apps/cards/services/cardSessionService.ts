import { db } from '@/core/db'
import type { CardCharacter, CardSession, CardMessage } from '@/core/db'

function genId(): string {
  return crypto.randomUUID()
}

// ========== 字卡角色 ==========

export async function createCardCharacter(data: {
  name: string
  avatar: string
  personality: string
  statusTexts?: string[]
}): Promise<CardCharacter> {
  const character: CardCharacter = {
    id: genId(),
    name: data.name,
    avatar: data.avatar,
    personality: data.personality,
    statusTexts: data.statusTexts || ['在线', '离开', '发呆中', '思考中', '沉默'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
  await db.cardCharacters.put(character)
  return character
}

export async function updateCardCharacter(
  id: string,
  data: Partial<Pick<CardCharacter, 'name' | 'avatar' | 'personality' | 'statusTexts'>>
): Promise<void> {
  await db.cardCharacters.update(id, { ...data, updatedAt: Date.now() })
}

export async function deleteCardCharacter(id: string): Promise<void> {
  const sessions = await db.cardSessions.where('cardCharacterId').equals(id).toArray()
  for (const s of sessions) {
    await db.cardMessages.where('sessionId').equals(s.id).delete()
  }
  await db.cardSessions.where('cardCharacterId').equals(id).delete()
  await db.cardCharacters.delete(id)
}

export async function getAllCardCharacters(): Promise<CardCharacter[]> {
  return db.cardCharacters.orderBy('createdAt').reverse().toArray()
}

export async function getCardCharacter(id: string): Promise<CardCharacter | undefined> {
  return db.cardCharacters.get(id)
}

// ========== 字卡会话 ==========

export async function createCardSession(data: {
  cardCharacterId: string
  personaId: string
  title: string
  replyMode?: 'random' | 'keyword'
  replyDelayMin?: number
  replyDelayMax?: number
  libraryIds?: string[]
  typingIndicatorText?: string
}): Promise<CardSession> {
  const session: CardSession = {
    id: genId(),
    cardCharacterId: data.cardCharacterId,
    personaId: data.personaId,
    title: data.title,
    wallpaper: '',
    bubbleStyle: 'classic',
    bubbleCustomCss: '',
    replyMode: data.replyMode || 'random',
    replyDelayMin: data.replyDelayMin ?? 0,
    replyDelayMax: data.replyDelayMax ?? 20,
    libraryIds: [...(data.libraryIds || [])], // 关键：转成普通数组
    typingIndicatorText: data.typingIndicatorText || '正在输入...',
    lastMessageAt: Date.now(),
    createdAt: Date.now()
  }

  await db.cardSessions.put(session)
  return session
}


export async function updateCardSession(
  id: string,
  data: Partial<Omit<CardSession, 'id' | 'createdAt'>>
): Promise<void> {
  await db.cardSessions.update(id, data)
}

export async function deleteCardSession(id: string): Promise<void> {
  await db.cardMessages.where('sessionId').equals(id).delete()
  await db.cardSessions.delete(id)
}

export async function getAllCardSessions(): Promise<CardSession[]> {
  return db.cardSessions.orderBy('lastMessageAt').reverse().toArray()
}

export async function getCardSession(id: string): Promise<CardSession | undefined> {
  return db.cardSessions.get(id)
}

// ========== 字卡消息 ==========

export async function getMessages(sessionId: string): Promise<CardMessage[]> {
  return db.cardMessages.where('sessionId').equals(sessionId).sortBy('timestamp')
}

export async function sendUserMessage(sessionId: string, data: {
  content: string
  media?: CardMessage['media']
}): Promise<CardMessage> {
  const msg: CardMessage = {
    id: genId(),
    sessionId,
    role: 'user',
    content: data.content,
    media: data.media,
    timestamp: Date.now()
  }
  await db.cardMessages.put(msg)
  await db.cardSessions.update(sessionId, { lastMessageAt: msg.timestamp })
  return msg
}

export async function sendCardReply(sessionId: string, content: string, sourceCardIds: string[]): Promise<CardMessage> {
  const msg: CardMessage = {
    id: genId(),
    sessionId,
    role: 'card',
    content,
    sourceCardIds,
    timestamp: Date.now()
  }
  await db.cardMessages.put(msg)
  await db.cardSessions.update(sessionId, { lastMessageAt: msg.timestamp })
  return msg
}

export async function deleteMessage(id: string): Promise<void> {
  await db.cardMessages.delete(id)
}

export async function clearSessionMessages(sessionId: string): Promise<void> {
  await db.cardMessages.where('sessionId').equals(sessionId).delete()
}
