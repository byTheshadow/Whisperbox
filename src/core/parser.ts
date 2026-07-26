/**
 * 从 SillyTavern 角色卡 PNG 文件中提取 Character Card 元数据
 * 支持 V1 和 V2 规范
 */
export interface RawCharacterCard {
  name: string
  description: string
  personality: string
  scenario: string
  first_mes: string
  mes_example: string
  creator_notes?: string
  system_prompt?: string
  post_history_instructions?: string
  tags?: string[]
  spec?: string // 'chara_card_v2'
  spec_version?: string
  data?: Record<string, unknown> // V2 嵌套数据
}

/**
 * 解析 PNG 文件，提取 tEXt chunk 中的角色卡数据
 */
export async function parseCharacterCardPNG(file: File): Promise<RawCharacterCard> {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)

  // 验证 PNG 文件头
  const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10]
  for (let i = 0; i < 8; i++) {
    if (bytes[i] !== pngSignature[i]) {
      throw new Error('无效的 PNG 文件')
    }
  }

  // 遍历 PNG Chunks 查找 tEXt
  let offset = 8
  while (offset < bytes.length) {
    const length = readUint32(bytes, offset)
    const type = readChunkType(bytes, offset + 4)

    if (type === 'tEXt') {
      const data = bytes.slice(offset + 8, offset + 8 + length)
      const nullIndex = data.indexOf(0)
      const keyword = new TextDecoder().decode(data.slice(0, nullIndex))

      if (keyword === 'chara') {
        const base64 = new TextDecoder().decode(data.slice(nullIndex + 1))
        const json = atob(base64)
        const parsed = JSON.parse(json)

        // 兼容 V2 嵌套结构
        if (parsed.spec === 'chara_card_v2' && parsed.data) {
          return parsed.data as RawCharacterCard
        }
        return parsed as RawCharacterCard
      }
    }

    // 跳到下一个 chunk（length + type(4) + data(length) + CRC(4)）
    offset += 12 + length
  }

  throw new Error('未找到角色卡数据。请确认这是一个 SillyTavern 格式的角色卡 PNG。')
}

function readUint32(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] << 24) |
    (bytes[offset + 1] << 16) |
    (bytes[offset + 2] << 8) |
    bytes[offset + 3]
  ) >>> 0
}

function readChunkType(bytes: Uint8Array, offset: number): string {
  return String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3])
}
