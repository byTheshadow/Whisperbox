// src/apps/divination/services/aiInterpretService.ts

import { db } from '@/core/db'
import type { DivinationReading, Deck, Spread } from '../types'

/** 构建 AI 解读的 prompt */
export function buildInterpretPrompt(
  reading: DivinationReading,
  deck: Deck,
  spread: Spread
): string {
  const cardsDescription = reading.drawnCards
    .map(drawn => {
      const orientation = drawn.isReversed ? '逆位' : '正位'
      const keywords = drawn.isReversed 
        ? drawn.card.reversedKeywords 
        : drawn.card.uprightKeywords
      const keywordStr = keywords.length > 0 ? `（${keywords.join('、')}）` : ''
      
      return `- 【${drawn.position.name}】${drawn.card.name}（${orientation}）${keywordStr}
  位置含义：${drawn.position.description}`
    })
    .join('\n')

  return `牌组：${deck.name}
牌阵：${spread.name} - ${spread.description}
问题：${reading.question || '无具体问题，请给出整体指引'}

抽到的牌：
${cardsDescription}

请给出：
1. 每张牌在其位置的具体含义解读
2. 牌与牌之间的关联和整体故事线
3. 针对问题的具体建议和启发

语气要温和、启发性，避免绝对化的预言。字数控制在 400-600 字。`
}

/** 请求 AI 解读 */
export async function requestAiInterpretation(
  reading: DivinationReading,
  deck: Deck,
  spread: Spread
): Promise<string> {
  const settings = await db.appSettings.get('global')

  if (!settings) {
    throw new Error('未找到应用设置')
  }
  if (!settings.apiBaseUrl || !settings.apiKey) {
    throw new Error('请先在「设置」中配置 API 地址和密钥')
  }
  if (!settings.selectedModel) {
    throw new Error('请先在「设置」中选择模型')
  }

  const prompt = buildInterpretPrompt(reading, deck, spread)
  const url = settings.apiBaseUrl.replace(/\/+$/, '') + '/chat/completions'

  const systemPrompt =
    '你是一位温和、克制、富有洞察力的塔罗与神秘学解读师。你从不使用绝对化的预言语言，' +
    '而是以启发性的方式帮助提问者理解自己内心与当下处境。你的解读兼顾理性与神性，简洁而深刻。'

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        model: settings.selectedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.85
      })
    })
  } catch (err) {
    throw new Error(`网络请求失败：${(err as Error).message}`)
  }

  if (!response.ok) {
    let detail = ''
    try {
      const errBody = await response.text()
      detail = errBody.slice(0, 200)
    } catch {
      // ignore
    }
    throw new Error(`API 请求失败 (${response.status})${detail ? '：' + detail : ''}`)
  }

  const data = await response.json().catch(() => null) as any
  const content: string | undefined = data?.choices?.[0]?.message?.content

  if (!content || !content.trim()) {
    throw new Error('AI 返回的内容为空')
  }

  return content.trim()
}
