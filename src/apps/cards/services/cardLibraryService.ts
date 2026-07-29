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
  const now = Date.now()

  const lib: CardLibrary = {
    id: genId(),
    name: data.name,
    description: data.description || '',
    boundCharacterIds: [],
    replyInterval: 0,
    typingText: '',
    createdAt: now
  }

  await db.cardLibraries.put({
    ...lib,
    boundCharacterIds: [...lib.boundCharacterIds]
  })

  return lib
}

export async function updateLibrary(
  id: string,
  data: Partial<Omit<CardLibrary, 'id' | 'createdAt'>>
): Promise<void> {
  await db.cardLibraries.update(id, {
    ...data,
    boundCharacterIds: data.boundCharacterIds
      ? [...data.boundCharacterIds]
      : data.boundCharacterIds
  })
}

export async function deleteLibrary(id: string): Promise<void> {
  await db.whisperCards.where('libraryId').equals(id).delete()
  await db.cardLibraries.delete(id)
}

export async function getAllLibraries(): Promise<CardLibrary[]> {
  const all = await db.cardLibraries.toArray()
  return all.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
}

export async function getLibrary(id: string): Promise<CardLibrary | undefined> {
  return db.cardLibraries.get(id)
}

// ========== 字卡 ==========

export async function getLibrariesByCharacterId(
  characterId: string
): Promise<CardLibrary[]> {
  const libraries = await db.cardLibraries.toArray()

  return libraries
    .filter(library => Array.isArray(library.boundCharacterIds))
    .filter(library => library.boundCharacterIds.includes(characterId))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
}

export async function setCharacterLibraries(
  characterId: string,
  libraryIds: string[]
): Promise<void> {
  const selectedIds = new Set(libraryIds)
  const libraries = await db.cardLibraries.toArray()

  await db.transaction('rw', db.cardLibraries, async () => {
    for (const library of libraries) {
      const currentIds = Array.isArray(library.boundCharacterIds)
        ? library.boundCharacterIds
        : []

      const hasCharacter = currentIds.includes(characterId)
      const shouldBind = selectedIds.has(library.id)

      if (shouldBind && !hasCharacter) {
        await db.cardLibraries.update(library.id, {
          boundCharacterIds: [...currentIds, characterId]
        })
      }

      if (!shouldBind && hasCharacter) {
        await db.cardLibraries.update(library.id, {
          boundCharacterIds: currentIds.filter(id => id !== characterId)
        })
      }
    }
  })
}


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
    triggerWords: [...(data.triggerWords || [])],
    weight: data.weight ?? 1,
    createdAt: Date.now()
  }

  await db.whisperCards.put(card)
  return card
}

export async function updateCard(
  id: string,
  data: Partial<Omit<WhisperCard, 'id' | 'createdAt'>>
): Promise<void> {
  await db.whisperCards.update(id, {
    ...data,
    triggerWords: data.triggerWords
      ? [...data.triggerWords]
      : data.triggerWords
  })
}

export async function deleteCard(id: string): Promise<void> {
  await db.whisperCards.delete(id)
}

export async function getCardsByLibrary(libraryId: string): Promise<WhisperCard[]> {
  const cards = await db.whisperCards.where('libraryId').equals(libraryId).toArray()
  return cards.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
}

export async function getAllCards(): Promise<WhisperCard[]> {
  const all = await db.whisperCards.toArray()
  return all.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
}

/**
 * 导入字卡：一行一条纯文本
 */
export async function importCardsFromText(libraryId: string, text: string): Promise<number> {
  const lines = text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)

  const now = Date.now()

  const cards: WhisperCard[] = lines.map(line => ({
    id: genId(),
    libraryId,
    content: line,
    triggerWords: [],
    weight: 1,
    createdAt: now
  }))

  await db.whisperCards.bulkPut(cards)
  return cards.length
}
