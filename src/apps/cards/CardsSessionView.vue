<template>
  <div
    class="cards-session min-h-screen flex flex-col bg-black text-white"
    :style="wallpaperStyle"
  >
    <!-- 顶部栏 -->
    <header class="px-4 py-3 border-b border-white/10 bg-black/60 backdrop-blur-md flex items-center gap-3 relative z-10">
      <button class="text-white/40 text-sm" @click="$router.push('/cards')">&larr;</button>
      <div class="w-8 h-8 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
        <img v-if="character?.avatar" :src="character.avatar" class="w-full h-full object-cover" alt="" />
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm text-white/90 truncate">{{ character?.name || session?.title }}</p>
        <p class="text-xs text-white/40">
          <span v-if="replyState === 'thinking'">{{ typingText }}</span>
          <span v-else>{{ characterStatus }}</span>
        </p>
      </div>
      <!-- 专注按钮 -->
      <button
        class="text-white/40 text-xs border border-white/10 px-2 py-1 rounded hover:bg-white/10 transition"
        @click="showFocus = true"
      >
        专注
      </button>
      <button class="text-white/40 text-xs" @click="showSettings = true">设置</button>
    </header>

    <!-- 消息列表 -->
    <div ref="msgContainer" class="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      <div
        v-for="msg in messages"
        :key="msg.id"
        class="flex"
        :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
      >
        <!-- 对方头像 -->
        <div v-if="msg.role === 'card'" class="w-7 h-7 rounded-full overflow-hidden bg-white/10 flex-shrink-0 mr-2 mt-1">
          <img v-if="character?.avatar" :src="character.avatar" class="w-full h-full object-cover" alt="" />
        </div>

        <div
          class="max-w-[75%] rounded-2xl px-3 py-2 text-sm leading-relaxed"
          :class="msg.role === 'user' ? userBubbleClass : cardBubbleClass"
          :style="msg.role === 'user' ? customBubbleCssUser : customBubbleCssCard"
        >
          <!-- 媒体消息 -->
          <div v-if="msg.media">
            <div v-if="msg.media.type === 'image'" class="rounded overflow-hidden">
              <img v-if="msg.media.url" :src="msg.media.url" class="max-w-full" alt="" />
              <div v-else class="w-48 h-32 bg-white/10 flex items-center justify-center text-xs text-white/30 rounded">
                {{ msg.media.description || '图片' }}
              </div>
            </div>
            <div v-else-if="msg.media.type === 'voice'" class="flex items-center gap-2">
              <span class="text-white/40">&#9654;</span>
              <span class="text-xs text-white/50">{{ msg.media.description || '语音消息' }}</span>
            </div>
            <div v-else-if="msg.media.type === 'sticker'">
              <img v-if="msg.media.url" :src="msg.media.url" class="w-24 h-24 object-contain" alt="" />
              <span v-else class="text-xs text-white/40">{{ msg.media.name || '表情包' }}</span>
            </div>
          </div>

          <!-- 文字内容 -->
          <p v-if="msg.content">{{ msg.content }}</p>
        </div>

        <!-- user 头像 -->
        <div v-if="msg.role === 'user'" class="w-7 h-7 rounded-full overflow-hidden bg-white/10 flex-shrink-0 ml-2 mt-1">
          <img v-if="personaAvatar" :src="personaAvatar" class="w-full h-full object-cover" alt="" />
        </div>
      </div>

      <!-- 打字指示器 -->
      <div v-if="replyState === 'thinking'" class="flex justify-start">
        <div class="w-7 h-7 rounded-full overflow-hidden bg-white/10 flex-shrink-0 mr-2 mt-1">
          <img v-if="character?.avatar" :src="character.avatar" class="w-full h-full object-cover" alt="" />
        </div>
        <div class="rounded-2xl px-3 py-2 bg-neutral-800 text-white/40 text-sm">
          <span class="typing-indicator">{{ typingText }}</span>
        </div>
      </div>
    </div>

    <!-- 底部输入区 -->
    <div class="border-t border-white/10 bg-black/60 backdrop-blur-md px-4 py-3 relative z-10">
      <!-- 媒体快捷按钮 -->
      <div class="flex items-center gap-3 mb-2">
        <button class="text-xs text-white/30 hover:text-white/60" @click="sendFakeImage">图片</button>
        <button class="text-xs text-white/30 hover:text-white/60" @click="sendFakeVoice">语音</button>
        <button class="text-xs text-white/30 hover:text-white/60" @click="showStickerPicker = !showStickerPicker">表情</button>
        <div class="flex-1" />
        <!-- 触发角色回复按钮 -->
        <button
          class="text-xs border px-3 py-1 rounded transition"
          :class="replyState === 'idle' ? 'text-white/60 border-white/20 hover:bg-white/10' : 'text-white/20 border-white/5 cursor-not-allowed'"
          :disabled="replyState !== 'idle'"
          @click="triggerReply"
        >
          {{ replyState === 'thinking' ? '选卡中...' : '触发回复' }}
        </button>
      </div>

      <!-- 文字输入 -->
      <div class="flex items-end gap-2">
        <textarea
          v-model="inputText"
          class="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 resize-none max-h-24"
          rows="1"
          placeholder="输入消息..."
          @keydown.enter.exact.prevent="sendText"
        />
        <button
          class="text-xs text-white/80 border border-white/20 px-3 py-2 rounded-lg hover:bg-white/10 transition"
          @click="sendText"
        >
          发送
        </button>
      </div>

      <!-- 表情包选择器 -->
      <div v-if="showStickerPicker" class="absolute bottom-full left-0 right-0 bg-neutral-900 border-t border-white/10 p-3 max-h-48 overflow-y-auto">
        <div class="grid grid-cols-4 gap-2">
          <div
            v-for="sticker in stickers"
            :key="sticker.id"
            class="cursor-pointer hover:bg-white/10 rounded p-1"
            @click="sendSticker(sticker)"
          >
            <img :src="sticker.url" class="w-12 h-12 object-contain mx-auto" alt="" />
          </div>
        </div>
        <p v-if="stickers.length === 0" class="text-xs text-white/20 text-center">暂无表情包</p>
      </div>
    </div>

    <!-- 设置面板 -->
    <div
      v-if="showSettings"
      class="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      @click.self="showSettings = false"
    >
      <div class="w-full max-w-sm bg-neutral-900 border border-white/10 rounded-lg p-5 space-y-4 max-h-[80vh] overflow-y-auto">
        <h2 class="text-sm text-white/80">消息框设置</h2>

        <!-- 打字指示器文字 -->
        <div class="space-y-2">
          <label class="text-xs text-white/40">打字指示器文字</label>
          <input
            :value="session?.typingIndicatorText || '正在输入...'"
            class="w-full bg-black border border-white/20 rounded px-3 py-2 text-sm text-white/80"
            placeholder="正在输入..."
            @change="updateTypingText(($event.target as HTMLInputElement).value)"
          />
          <p class="text-xs text-white/20">角色选卡时显示的文字</p>
        </div>

        <!-- 壁纸 -->
        <div class="space-y-2">
          <label class="text-xs text-white/40">壁纸</label>
          <label class="block text-xs text-white/40 border border-white/20 px-3 py-1.5 rounded cursor-pointer hover:bg-white/10 transition w-fit">
            选择图片
            <input type="file" accept="image/*" class="hidden" @change="onWallpaperChange" />
          </label>
          <button v-if="session?.wallpaper" class="text-xs text-red-400/60" @click="clearWallpaper">清除壁纸</button>
        </div>

        <!-- 气泡样式 -->
        <div class="space-y-2">
          <label class="text-xs text-white/40">气泡样式</label>
          <select
            :value="session?.bubbleStyle || 'classic'"
            class="w-full bg-black border border-white/20 rounded px-3 py-2 text-sm text-white/80"
            @change="updateBubbleStyle(($event.target as HTMLSelectElement).value)"
          >
            <option value="classic">经典</option>
            <option value="minimal">极简</option>
            <option value="glass">毛玻璃</option>
            <option value="custom">自定义 CSS</option>
          </select>
        </div>

        <!-- 自定义 CSS -->
        <div v-if="session?.bubbleStyle === 'custom'" class="space-y-2">
          <label class="text-xs text-white/40">自定义气泡 CSS</label>
          <textarea
            :value="session?.bubbleCustomCss"
            class="w-full bg-black border border-white/20 rounded px-3 py-2 text-xs text-white/80 h-24 resize-none font-mono"
            placeholder="background: rgba(255,255,255,0.1);&#10;border-radius: 12px;&#10;color: #fff;"
            @input="updateCustomCss(($event.target as HTMLTextAreaElement).value)"
          />
        </div>

        <!-- 回复模式 -->
        <div class="space-y-2">
          <label class="text-xs text-white/40">回复模式</label>
          <div class="flex gap-3">
            <label class="flex items-center gap-1.5 text-xs text-white/60 cursor-pointer">
              <input type="radio" :checked="session?.replyMode === 'random'" @change="updateReplyMode('random')" class="accent-white" />
              纯随机
            </label>
            <label class="flex items-center gap-1.5 text-xs text-white/60 cursor-pointer">
              <input type="radio" :checked="session?.replyMode === 'keyword'" @change="updateReplyMode('keyword')" class="accent-white" />
              关键词匹配
            </label>
          </div>
        </div>

        <!-- 回复延迟 -->
        <div class="space-y-2">
          <label class="text-xs text-white/40">回复延迟区间（分钟）</label>
          <p class="text-xs text-white/20">角色在此区间内随机选一个时间点回复</p>
          <div class="flex items-center gap-2">
            <input
              :value="session?.replyDelayMin ?? 0"
              type="number"
              min="0"
              class="w-16 bg-black border border-white/20 rounded px-2 py-1 text-sm text-white/80 text-center"
              @change="updateDelay('min', +($event.target as HTMLInputElement).value)"
            />
            <span class="text-white/30 text-xs">~</span>
            <input
              :value="session?.replyDelayMax ?? 20"
              type="number"
              min="0"
              class="w-16 bg-black border border-white/20 rounded px-2 py-1 text-sm text-white/80 text-center"
              @change="updateDelay('max', +($event.target as HTMLInputElement).value)"
            />
          </div>
          <p class="text-xs text-white/20">超过最大时间，系统兜底随机抽两张字卡回复</p>
        </div>

        <button
          class="w-full text-xs text-white/40 border border-white/10 px-3 py-1.5 rounded hover:bg-white/5 transition"
          @click="showSettings = false"
        >
          关闭
        </button>
      </div>
    </div>

    <!-- 专注模式 -->
    <FocusMode
      v-if="showFocus"
      :character-name="character?.name || '角色'"
      @close="showFocus = false"
      @completed="onFocusCompleted"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import type { CardSession, CardCharacter, CardMessage, StickerItem } from '@/core/db'
import { db } from '@/core/db'
import {
  getCardSession,
  getCardCharacter,
  getMessages,
  sendUserMessage,
  sendCardReply,
  updateCardSession
} from './services/cardSessionService'
import { drawRandomCards, drawByKeyword } from './services/cardReplyService'
import FocusMode from './components/FocusMode.vue'

const route = useRoute()
const sessionId = route.params.sessionId as string

const session = ref<CardSession | null>(null)
const character = ref<CardCharacter | null>(null)
const messages = ref<CardMessage[]>([])
const personaAvatar = ref('')
const characterStatus = ref('')

const inputText = ref('')
const showStickerPicker = ref(false)
const showSettings = ref(false)
const showFocus = ref(false)
const stickers = ref<StickerItem[]>([])
const msgContainer = ref<HTMLElement | null>(null)

// 回复状态
const replyState = ref<'idle' | 'thinking'>('idle')

// 打字指示器文字
const typingText = computed(() => session.value?.typingIndicatorText || '正在输入...')

let replyTimer: ReturnType<typeof setTimeout> | null = null
let deadlineTimer: ReturnType<typeof setTimeout> | null = null

// 壁纸样式
const wallpaperStyle = computed(() => {
  if (!session.value?.wallpaper) return {}
  return {
    backgroundImage: `url(${session.value.wallpaper})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  }
})

// 气泡样式
const userBubbleClass = computed(() => {
  const style = session.value?.bubbleStyle || 'classic'
  if (style === 'minimal') return 'bg-white/10 text-white/90'
  if (style === 'glass') return 'bg-white/10 backdrop-blur-md text-white/90 border border-white/10'
  if (style === 'custom') return ''
  return 'bg-blue-600/80 text-white'
})

const cardBubbleClass = computed(() => {
  const style = session.value?.bubbleStyle || 'classic'
  if (style === 'minimal') return 'bg-white/5 text-white/80'
  if (style === 'glass') return 'bg-white/5 backdrop-blur-md text-white/80 border border-white/10'
  if (style === 'custom') return ''
  return 'bg-neutral-800 text-white/90'
})

function parseCssString(css: string): Record<string, string> {
  const styles: Record<string, string> = {}
  try {
    css.split(';').forEach(rule => {
      const [key, val] = rule.split(':').map(s => s.trim())
      if (key && val) {
        const camelKey = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
        styles[camelKey] = val
      }
    })
  } catch { /* ignore */ }
  return styles
}

const customBubbleCssUser = computed(() => {
  if (session.value?.bubbleStyle !== 'custom') return {}
  return parseCssString(session.value.bubbleCustomCss || '')
})

const customBubbleCssCard = computed(() => {
  if (session.value?.bubbleStyle !== 'custom') return {}
  return parseCssString(session.value.bubbleCustomCss || '')
})

onMounted(async () => {
  session.value = (await getCardSession(sessionId)) || null
  if (session.value) {
    character.value = (await getCardCharacter(session.value.cardCharacterId)) || null
    const persona = await db.personas.get(session.value.personaId)
    personaAvatar.value = persona?.avatar || ''
  }
  if (character.value && character.value.statusTexts.length > 0) {
    const idx = Math.floor(Math.random() * character.value.statusTexts.length)
    characterStatus.value = character.value.statusTexts[idx]
  }

  messages.value = await getMessages(sessionId)

  // 加载表情包
  const packs = await db.stickerPacks.where('isEnabled').equals(1).toArray()
  if (packs.length > 0) {
    const packIds = packs.map(p => p.id)
    stickers.value = await db.stickerItems.where('packId').anyOf(packIds).toArray()
  }

  scrollToBottom()
})

onUnmounted(() => {
  clearTimers()
})

function clearTimers() {
  if (replyTimer) { clearTimeout(replyTimer); replyTimer = null }
  if (deadlineTimer) { clearTimeout(deadlineTimer); deadlineTimer = null }
}

// ========== 发送消息 ==========

async function sendText() {
  const text = inputText.value.trim()
  if (!text) return

  // 支持分段多气泡：换行分隔
  const segments = text.split('\n').filter(s => s.trim())
  for (const seg of segments) {
    await sendUserMessage(sessionId, { content: seg.trim() })
  }

  inputText.value = ''
  messages.value = await getMessages(sessionId)
  scrollToBottom()
}

async function sendFakeImage() {
  const desc = prompt('图片描述')
  if (desc === null) return
  await sendUserMessage(sessionId, {
    content: '',
    media: { type: 'image', description: desc || '图片', url: '' }
  })
  messages.value = await getMessages(sessionId)
  scrollToBottom()
}

async function sendFakeVoice() {
  const desc = prompt('语音描述')
  if (desc === null) return
  await sendUserMessage(sessionId, {
    content: '',
    media: { type: 'voice', description: desc || '语音消息', url: '' }
  })
  messages.value = await getMessages(sessionId)
  scrollToBottom()
}

async function sendSticker(sticker: StickerItem) {
  await sendUserMessage(sessionId, {
    content: '',
    media: { type: 'sticker', description: sticker.description, url: sticker.url, name: sticker.name }
  })
  showStickerPicker.value = false
  messages.value = await getMessages(sessionId)
  scrollToBottom()
}

// ========== 触发回复 ==========

function triggerReply() {
  if (replyState.value !== 'idle' || !session.value) return

  replyState.value = 'thinking'
  scrollToBottom()

  const minDelay = (session.value.replyDelayMin ?? 0) * 60 * 1000
  const maxDelay = (session.value.replyDelayMax ?? 20) * 60 * 1000

  // 角色正常回复时间点：min ~ max 之间随机
  const normalDelay = minDelay + Math.random() * (maxDelay - minDelay)

  // 正常回复计时器
  replyTimer = setTimeout(async () => {
    await doNormalReply()
  }, normalDelay)

  // 最晚兜底计时器
  deadlineTimer = setTimeout(async () => {
    if (replyState.value === 'thinking') {
      if (replyTimer) { clearTimeout(replyTimer); replyTimer = null }
      await doFallbackReply()
    }
  }, maxDelay)
}

/** 角色正常回复 */
async function doNormalReply() {
  if (replyState.value !== 'thinking' || !session.value) return

  if (deadlineTimer) { clearTimeout(deadlineTimer); deadlineTimer = null }

  const recentUserMsgs = messages.value
    .filter(m => m.role === 'user')
    .slice(-5)
    .map(m => m.content)
    .join(' ')

  let card = null
  if (session.value.replyMode === 'keyword' && recentUserMsgs.trim()) {
    card = await drawByKeyword(recentUserMsgs, session.value.libraryIds)
  }

  // 关键词没匹配到，fallback 随机抽一张
  if (!card) {
    const cards = await drawRandomCards(session.value.libraryIds, 1)
    card = cards[0] || null
  }

  if (card) {
    await sendCardReply(sessionId, card.content, [card.id])
  } else {
    await sendCardReply(sessionId, '……', [])
  }

  replyState.value = 'idle'
  messages.value = await getMessages(sessionId)
  scrollToBottom()
}

/** 兜底回复：系统直接随机抽两张 */
async function doFallbackReply() {
  if (!session.value) return

  const cards = await drawRandomCards(session.value.libraryIds, 2)

  for (const card of cards) {
    await sendCardReply(sessionId, card.content, [card.id])
  }

  if (cards.length === 0) {
    await sendCardReply(sessionId, '……', [])
  }

  replyState.value = 'idle'
  messages.value = await getMessages(sessionId)
  scrollToBottom()
}

// ========== 专注完成 ==========

async function onFocusCompleted(minutes: number, goal: string) {
  showFocus.value = false
  // 专注完成后，角色自动发一条字卡作为奖励
  const cards = await drawRandomCards(session.value?.libraryIds || [], 1)
  if (cards.length > 0) {
    await sendCardReply(sessionId, cards[0].content, [cards[0].id])
    messages.value = await getMessages(sessionId)
    scrollToBottom()
  }
}

// ========== 设置 ==========

async function updateTypingText(val: string) {
  await updateCardSession(sessionId, { typingIndicatorText: val || '正在输入...' })
  session.value = (await getCardSession(sessionId)) || null
}

async function onWallpaperChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = async () => {
    await updateCardSession(sessionId, { wallpaper: reader.result as string })
    session.value = (await getCardSession(sessionId)) || null
  }
  reader.readAsDataURL(file)
}

async function clearWallpaper() {
  await updateCardSession(sessionId, { wallpaper: '' })
  session.value = (await getCardSession(sessionId)) || null
}

async function updateBubbleStyle(val: string) {
  await updateCardSession(sessionId, { bubbleStyle: val })
  session.value = (await getCardSession(sessionId)) || null
}

async function updateCustomCss(val: string) {
  await updateCardSession(sessionId, { bubbleCustomCss: val })
  session.value = (await getCardSession(sessionId)) || null
}

async function updateReplyMode(mode: 'random' | 'keyword') {
  await updateCardSession(sessionId, { replyMode: mode })
  session.value = (await getCardSession(sessionId)) || null
}

async function updateDelay(which: 'min' | 'max', val: number) {
  if (which === 'min') {
    await updateCardSession(sessionId, { replyDelayMin: val })
  } else {
    await updateCardSession(sessionId, { replyDelayMax: val })
  }
  session.value = (await getCardSession(sessionId)) || null
}

// ========== 工具 ==========

function scrollToBottom() {
  nextTick(() => {
    if (msgContainer.value) {
      msgContainer.value.scrollTop = msgContainer.value.scrollHeight
    }
  })
}
</script>

<style scoped>
.typing-indicator {
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}
</style>
