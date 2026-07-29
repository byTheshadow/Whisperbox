import { db } from '@/core/db'
import type { WhisperCard, CardLibrary } from '@/core/db'

function genId(): string {
  return crypto.randomUUID()
}

// ========== 字卡库 ==========

export async function createLibrary(data: {
  name: string
  description?: string
}): Promise<CardLibrary> {
  const lib: CardLibrary = {
    id: genId(),
    name: data.name,
    description: data.description || '',
    boundCharacterIds: [],
    replyInterval: 0,
    typingText: '',
    createdAt: Date.now()
  }
  await db.cardLibraries.put(lib)
  return lib
}

export async function updateLibrary(id: string, data: Partial<Omit<CardLibrary, 'id' | 'createdAt'>>): Promise<void> {
  await db.cardLibraries.update(id, data)
}

export async function deleteLibrary(id: string): Promise<void> {
  await db.whisperCards.where('libraryId').equals(id).delete()
  await db.cardLibraries.delete(id)
}

export async function getAllLibraries(): Promise<CardLibrary[]> {
  return db.cardLibraries.orderBy('createdAt').reverse().toArray()
}

export async function getLibrary(id: string): Promise<CardLibrary | undefined> {
  return db.cardLibraries.get(id)
}

// ========== 字卡 ==========

export async function createCard(data: {
  libraryId: string
  content: string
  triggerWords?: string[]
  weight?: number
}): Promise<WhisperCard> {
  const card: WhisperCard = {
    id: genId(),
    libraryId: data.libraryId,
    content: data.content,
    triggerWords: data.triggerWords || [],
    weight: data.weight ?? 1,
    createdAt: Date.now()
  }
  await db.whisperCards.put(card)
  return card
}

export async function updateCard(id: string, data: Partial<Omit<WhisperCard, 'id' | 'createdAt'>>): Promise<void> {
  await db.whisperCards.update(id, data)
}

export async function deleteCard(id: string): Promise<void> {
  await db.whisperCards.delete(id)
}

export async function getCardsByLibrary(libraryId: string): Promise<WhisperCard[]> {
  return db.whisperCards.where('libraryId').equals(libraryId).toArray()
}

export async function getAllCards(): Promise<WhisperCard[]> {
  return db.whisperCards.toArray()
}

/**
 * 导入字卡：一行一条纯文本
 */
export async function importCardsFromText(libraryId: string, text: string): Promise<number> {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  const cards: WhisperCard[] = lines.map(line => ({
    id: genId(),
    libraryId,
    content: line,
    triggerWords: [],
    weight: 1,
    createdAt: Date.now()
  }))
  await db.whisperCards.bulkPut(cards)
  return cards.length
}
