// src/apps/divination/services/aiInterpretService.ts

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
      return `- ${drawn.position.name}：${drawn.card.name}（${orientation}）`
    })
    .join('\n')

  return `你是一位专业的塔罗牌解读师。请根据以下信息进行解读：

牌组：${deck.name}
牌阵：${spread.name}
问题：${reading.question || '无具体问题，请给出整体指引'}

抽到的牌：
${cardsDescription}

请给出：
1. 每张牌在其位置的含义
2. 牌与牌之间的关联
3. 整体解读与建议

请用温和、启发性的语气，避免绝对化的预言。`
}

/** 请求 AI 解读（占位，实际需要接入 API） */
export async function requestAiInterpretation(
  reading: DivinationReading,
  deck: Deck,
  spread: Spread
): Promise<string> {
  // TODO: 接入实际 AI API
  const prompt = buildInterpretPrompt(reading, deck, spread)
  console.log('[AI Interpret] Prompt:', prompt)
  
  return '（AI 解读功能待接入）'
}
