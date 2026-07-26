import { db } from './db'

export interface ChatCompletionMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ModelInfo {
  id: string
  object: string
  owned_by: string
}

/**
 * 获取 API 配置
 */
async function getApiConfig() {
  const settings = await db.appSettings.get('global')
  if (!settings || !settings.apiBaseUrl || !settings.apiKey) {
    throw new Error('API 未配置。请在设置中填写 Base URL 和 API Key。')
  }
  return {
    baseUrl: settings.apiBaseUrl.replace(/\/$/, ''),
    apiKey: settings.apiKey,
    model: settings.selectedModel
  }
}

/**
 * 获取可用模型列表
 */
export async function fetchModels(): Promise<ModelInfo[]> {
  const config = await getApiConfig()
  const response = await fetch(`${config.baseUrl}/v1/models`, {
    headers: { Authorization: `Bearer ${config.apiKey}` }
  })

  if (!response.ok) {
    throw new Error(`获取模型列表失败: ${response.status}`)
  }

  const data = await response.json()
  return data.data ?? []
}

/**
 * 发送聊天请求（流式）
 */
export async function chatCompletion(
  messages: ChatCompletionMessage[],
  onChunk: (text: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const config = await getApiConfig()

  const response = await fetch(`${config.baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      stream: true
    }),
    signal
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`AI 请求失败 (${response.status}): ${errorText}`)
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error('无法读取响应流')

  const decoder = new TextDecoder()
  let fullText = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split('\n').filter(line => line.startsWith('data: '))

    for (const line of lines) {
      const data = line.slice(6)
      if (data === '[DONE]') break

      try {
        const parsed = JSON.parse(data)
        const content = parsed.choices?.[0]?.delta?.content ?? ''
        if (content) {
          fullText += content
          onChunk(content)
        }
      } catch {
        // 解析失败跳过
      }
    }
  }

  return fullText
}
