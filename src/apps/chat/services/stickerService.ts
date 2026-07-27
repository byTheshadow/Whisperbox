import { db, type StickerItem, type StickerPack } from '@/core/db'

/**
 * 获取或创建默认全局表情包库。
 * 表情包是全局共享的，不属于某一个聊天窗。
 */
export async function getOrCreateDefaultStickerPack(): Promise<StickerPack> {
  const existing = await db.stickerPacks
    .where('name')
    .equals('默认表情包')
    .first()

  if (existing) return existing

  const now = Date.now()

  const pack: StickerPack = {
    id: crypto.randomUUID(),
    name: '默认表情包',
    description: 'Whisperbox 全局共用表情包库',
    isEnabled: true,
    createdAt: now,
    updatedAt: now
  }

  await db.stickerPacks.add(pack)

  return pack
}

/**
 * 获取全部启用表情包。
 */
export async function getEnabledStickers(): Promise<StickerItem[]> {
  const packs = await db.stickerPacks
    .where('isEnabled')
    .equals(1)
    .toArray()

  const packIds = new Set(packs.map(pack => pack.id))

  const all = await db.stickerItems
    .orderBy('createdAt')
    .reverse()
    .toArray()

  return all.filter(item => packIds.has(item.packId))
}

/**
 * 添加一个全局表情包。
 */
export async function addSticker(data: {
  name: string
  url: string
  description: string
  meaning: string
  triggerWords?: string[]
  packId?: string
}): Promise<StickerItem> {
  const pack = data.packId
    ? await db.stickerPacks.get(data.packId)
    : await getOrCreateDefaultStickerPack()

  if (!pack) {
    throw new Error('表情包库不存在')
  }

  const now = Date.now()

  const sticker: StickerItem = {
    id: crypto.randomUUID(),
    packId: pack.id,
    name: data.name,
    url: data.url,
    description: data.description,
    meaning: data.meaning,
    triggerWords: data.triggerWords || [],
    createdAt: now,
    updatedAt: now
  }

  await db.stickerItems.add(sticker)

  return sticker
}

/**
 * 删除全局表情包。
 * 注意：这里删除的是表情包库资源，不会删除历史消息里已经发送过的表情包快照。
 */
export async function deleteSticker(id: string): Promise<void> {
  await db.stickerItems.delete(id)
}

/**
 * 把全局表情包转换成 Message.media。
 */
export function stickerToMessageMedia(sticker: StickerItem) {
  return {
    type: 'sticker' as const,
    description: sticker.description,
    url: sticker.url,
    name: sticker.name,
    meaning: sticker.meaning,
    stickerId: sticker.id
  }
}
