import { db, type Character } from '@/core/db'

/**
 * 快速创建角色卡
 */
export async function createCharacter(data: {
  name: string
  avatar?: string
  personality: string
  scenario?: string
  additionalSettings?: string
  firstMes?: string
}): Promise<Character> {
  const now = Date.now()

  const character: Character = {
    id: crypto.randomUUID(),
    name: data.name,
    avatar: data.avatar || '',
    description: data.additionalSettings || '',
    personality: data.personality,
    scenario: data.scenario || '',
    firstMes: data.firstMes || '',
    mesExample: '',
    creatorNotes: '',
    systemPrompt: '',
    postHistoryUser: '',
    worldBookId: '',
    cardLibraryIds: [],
    tags: [],
    createdAt: now,
    updatedAt: now
  }

  await db.characters.add(character)
  return character
}

/**
 * 获取所有角色卡
 */
export async function getAllCharacters(): Promise<Character[]> {
  return await db.characters.orderBy('createdAt').reverse().toArray()
}

/**
 * 导入 SillyTavern V2 JSON 角色卡
 */
export async function importCharacterFromJson(jsonString: string): Promise<Character> {
  const raw = JSON.parse(jsonString)

  // 兼容 SillyTavern V2 格式
  const data = raw.data || raw

  const now = Date.now()

  const character: Character = {
    id: crypto.randomUUID(),
    name: data.name || '未知角色',
    avatar: data.avatar || '',
    description: data.description || '',
    personality: data.personality || '',
    scenario: data.scenario || '',
    firstMes: data.first_mes || data.firstMes || '',
    mesExample: data.mes_example || data.mesExample || '',
    creatorNotes: data.creator_notes || data.creatorNotes || '',
    systemPrompt: data.system_prompt || data.systemPrompt || '',
    postHistoryUser: data.post_history_instructions || data.postHistoryUser || '',
    worldBookId: '',
    cardLibraryIds: [],
    tags: Array.isArray(data.tags) ? data.tags : [],
    createdAt: now,
    updatedAt: now
  }

  await db.characters.add(character)
  return character
}

/**
 * 删除角色卡
 */
export async function deleteCharacter(id: string): Promise<void> {
  await db.characters.delete(id)
}
