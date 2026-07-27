<template>
  <div class="chat-session-container">
    <!-- 顶部栏（固定） -->
    <header class="chat-header">
      <button class="header-btn" type="button" @click="$router.push('/chat')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M19 12H5M12 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <div class="header-center">
        <div class="header-avatar">
          <img v-if="character?.avatar" :src="character.avatar" alt="" />
          <span v-else class="avatar-letter">{{ (character?.name || '?').charAt(0) }}</span>
        </div>
        <span class="header-name">{{ character?.name || '对话' }}</span>
      </div>

      <button class="header-btn" type="button" @click="showSessionMenu = !showSessionMenu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
        </svg>
      </button>

      <Transition name="fade">
        <div v-if="showSessionMenu" class="session-menu">
          <button class="menu-item danger" @click="handleDeleteSession">删除对话</button>
        </div>
      </Transition>
    </header>

    <!-- 消息列表（滚动区域） -->
    <div ref="messageListRef" class="message-list">
      <div
        v-for="msg in messages"
        :key="msg.id"
        :class="['message-row', msg.role]"
      >
        <!-- 角色头像 -->
        <div v-if="msg.role === 'assistant'" class="msg-avatar">
          <img v-if="character?.avatar" :src="character.avatar" alt="" />
          <span v-else class="avatar-letter-small">{{ (character?.name || '?').charAt(0) }}</span>
        </div>

        <div class="msg-body">
          <!-- 引用 -->
          <div v-if="msg.quotedContent" class="msg-quote">
            <span class="quote-text">{{ msg.quotedContent }}</span>
          </div>

          <!-- 消息气泡 -->
          <div
            :class="['msg-bubble', msg.role, { 'media-bubble': msg.media }]"
            @contextmenu.prevent="openContextMenu($event, msg)"
            @click.long="openContextMenu($event, msg)"
          >
            <!-- 表情包 -->
            <div v-if="msg.media?.type === 'sticker'" class="media-sticker">
              <img
                v-if="msg.media?.url"
                :src="msg.media.url"
                alt=""
                class="sticker-image"
              />
              <div v-else class="sticker-fallback">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  opacity="0.6"
                >
                  <path
                    d="M14 2H6a2 2 0 0 0-2 2v16l4-4h10a2 2 0 0 0 2-2V8z"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </div>
            </div>

            <!-- 假图片 -->
            <div v-else-if="msg.media?.type === 'image'" class="media-image" @click="toggleMediaReveal(msg.id)">
              <svg v-if="!revealedMedia.has(msg.id)" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.6">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <p v-if="revealedMedia.has(msg.id)" class="media-description">{{ msg.media?.description }}</p>
              <p v-else class="media-tap-hint">点击查看</p>
            </div>

            <!-- 假语音 -->
            <div v-else-if="msg.media?.type === 'voice'" class="media-voice" @click="toggleMediaReveal(msg.id)">
              <div v-if="!revealedMedia.has(msg.id)" class="voice-bar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                <div class="voice-wave">
                  <span></span><span></span><span></span><span></span><span></span>
                </div>
              </div>
              <p v-else class="media-description">{{ msg.media?.description }}</p>
            </div>

            <!-- 普通文字 -->
            <p v-else class="msg-text">{{ msg.content }}</p>
          </div>

          <!-- 时间 -->
          <span class="msg-time">{{ formatMsgTime(msg.timestamp) }}</span>
        </div>
      </div>

      <!-- 打字指示器 -->
      <div v-if="aiLoading" class="message-row assistant">
        <div class="msg-avatar">
          <img v-if="character?.avatar" :src="character.avatar" alt="" />
          <span v-else class="avatar-letter-small">{{ (character?.name || '?').charAt(0) }}</span>
        </div>
        <div class="msg-body">
          <div class="msg-bubble assistant typing">
            <span class="typing-text">{{ typingIndicatorText }}</span>
            <span class="typing-dots">
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 引用预览条 -->
    <div v-if="quotedMessage" class="quote-bar">
      <div class="quote-bar-content">
        <span class="quote-bar-label">引用</span>
        <span class="quote-bar-text">{{ quotedMessage.content?.substring(0, 50) || '[媒体消息]' }}</span>
      </div>
      <button class="quote-bar-close" type="button" @click="quotedMessage = null">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <line x1="18" y1="6" x2="6" y2="18" stroke-linecap="round"/>
          <line x1="6" y1="6" x2="18" y2="18" stroke-linecap="round"/>
        </svg>
      </button>
    </div>

    <!-- 输入区（固定） -->
    <div class="input-area">
      <div class="input-tools">
        <button class="tool-btn" type="button" title="发送图片" @click="showImageInput = true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </button>
        <button class="tool-btn" type="button" title="发送语音" @click="showVoiceInput = true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
          </svg>
        </button>
      </div>

      <div class="input-row">
        <textarea
          ref="textareaRef"
          v-model="inputText"
          class="msg-input"
          placeholder="输入消息…"
          rows="1"
          @keydown.enter.exact.prevent="sendBubble"
          @input="autoResize"
        ></textarea>

        <div class="send-buttons">
          <button
            class="send-btn bubble-btn"
            type="button"
            title="发送气泡（不触发 AI）"
            :disabled="!inputText.trim()"
            @click="sendBubble"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <line x1="22" y1="2" x2="11" y2="13" stroke-linecap="round" stroke-linejoin="round"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>

          <button
            class="send-btn ai-btn"
            type="button"
            title="发送给 AI 获取回复"
            :disabled="aiLoading"
            @click="sendToAi"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 17l10 5 10-5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 12l10 5 10-5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 假图片输入弹窗 -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showImageInput" class="modal-overlay" @click.self="showImageInput = false">
          <div class="mini-modal">
            <h4 class="mini-modal-title">描述这张图片</h4>
            <textarea
              v-model="mediaDescription"
              class="form-input form-textarea"
              placeholder="描述你想发送的图片内容…"
              rows="3"
            ></textarea>
            <div class="mini-modal-actions">
              <button class="modal-btn secondary" type="button" @click="showImageInput = false">取消</button>
              <button class="modal-btn primary" type="button" :disabled="!mediaDescription.trim()" @click="sendImage">发送</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 假语音输入弹窗 -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showVoiceInput" class="modal-overlay" @click.self="showVoiceInput = false">
          <div class="mini-modal">
            <h4 class="mini-modal-title">描述这条语音</h4>
            <textarea
              v-model="mediaDescription"
              class="form-input form-textarea"
              placeholder="描述语音内容…"
              rows="3"
            ></textarea>
            <div class="mini-modal-actions">
              <button class="modal-btn secondary" type="button" @click="showVoiceInput = false">取消</button>
              <button class="modal-btn primary" type="button" :disabled="!mediaDescription.trim()" @click="sendVoice">发送</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 右键 / 长按菜单 -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="contextMenu.visible"
          class="context-menu"
          :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
        >
          <button class="ctx-item" @click="handleQuote">引用</button>
          <button class="ctx-item" @click="handleWithdraw">撤回</button>
          <button v-if="contextMenu.message?.role === 'assistant'" class="ctx-item" @click="handleReroll">重新生成</button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db, type Message, type Character } from '@/core/db'
import {
  addMessage,
  deleteMessage,
  getSessionMessages,
  sendAndGetReply,
  rerollMessage
} from './services/chatService'

interface DisplayMessage extends Message {
  quotedContent?: string
}

const route = useRoute()
const router = useRouter()

const sessionId = route.params.sessionId as string
const character = ref<Character | undefined>()
const messages = ref<DisplayMessage[]>([])
const inputText = ref('')
const aiLoading = ref(false)
const showSessionMenu = ref(false)
const showImageInput = ref(false)
const showVoiceInput = ref(false)
const mediaDescription = ref('')
const quotedMessage = ref<Message | null>(null)
const revealedMedia = reactive(new Set<string>())
const messageListRef = ref<HTMLElement | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

const contextMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  message: null as Message | null
})

// 打字指示器文案（可自定义）
const typingIndicatorText = computed(() => {
  if (character.value?.name) {
    return `${character.value.name}正在输入`
  }
  return '对方正在输入'
})

onMounted(async () => {
  const session = await db.chatSessions.get(sessionId)

  if (!session) {
    router.push('/chat')
    return
  }

  character.value = await db.characters.get(session.characterId)
  await loadMessages()
  scrollToBottom()
})

async function loadMessages() {
  const raw = await getSessionMessages(sessionId)
  messages.value = raw.map(msg => ({ ...msg }))
}

function scrollToBottom() {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight
    }
  })
}

function autoResize() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
}

// 发送气泡（不触发 AI）
async function sendBubble() {
  const text = inputText.value.trim()
  if (!text) return

  const msg = await addMessage(sessionId, 'user', text)
  const display: DisplayMessage = { ...msg }

  if (quotedMessage.value) {
    display.quotedContent = quotedMessage.value.content
      ? quotedMessage.value.content.substring(0, 80)
      : '[媒体消息]'
    quotedMessage.value = null
  }

  messages.value.push(display)
  inputText.value = ''
  resetTextarea()
  scrollToBottom()
}

// 发送给 AI
async function sendToAi() {
  if (inputText.value.trim()) {
    await sendBubble()
  }

  if (messages.value.length === 0) return

  aiLoading.value = true
  scrollToBottom()

  try {
    const session = await db.chatSessions.get(sessionId)
    const persona = session?.personaId
      ? await db.personas.get(session.personaId)
      : null

    const replyMessages = await sendAndGetReply(
      sessionId,
      session?.characterId || '',
      persona?.description || ''
    )

    for (const msg of replyMessages) {
      messages.value.push({ ...msg })
    }

    scrollToBottom()
  } catch (err: any) {
    // 安抚性提示 + 具体错误
    const comfortText = getErrorComfort()
    const errorContent = `${comfortText}\n\n[具体错误] ${err.message}`
    const errorMsg = await addMessage(sessionId, 'system', errorContent)
    messages.value.push({ ...errorMsg })
    scrollToBottom()
  } finally {
    aiLoading.value = false
  }
}

// 安抚性错误提示
function getErrorComfort(): string {
  const comforts = [
    '连接似乎出了点问题，不要担心，让我再试试…',
    '通信暂时中断了，稍后重新尝试即可。',
    '信号不太好的样子，请检查网络或 API 配置。',
    '传输过程遇到了阻碍，也许只是暂时的。',
  ]
  return comforts[Math.floor(Math.random() * comforts.length)]
}

// 假图片
async function sendImage() {
  const desc = mediaDescription.value.trim()
  if (!desc) return

  const msg = await addMessage(sessionId, 'user', '', {
    type: 'image',
    description: desc,
    url: ''
  })

  messages.value.push({ ...msg })
  mediaDescription.value = ''
  showImageInput.value = false
  scrollToBottom()
}

// 假语音
async function sendVoice() {
  const desc = mediaDescription.value.trim()
  if (!desc) return

  const msg = await addMessage(sessionId, 'user', '', {
    type: 'voice',
    description: desc,
    url: ''
  })

  messages.value.push({ ...msg })
  mediaDescription.value = ''
  showVoiceInput.value = false
  scrollToBottom()
}

function toggleMediaReveal(msgId: string) {
  if (revealedMedia.has(msgId)) {
    revealedMedia.delete(msgId)
  } else {
    revealedMedia.add(msgId)
  }
}

// 右键菜单 — 对所有消息生效（user + assistant）
function openContextMenu(e: MouseEvent | TouchEvent, msg: Message) {
  // 不对 system 消息弹菜单
  if (msg.role === 'system') return

  const clientX = 'touches' in e ? e.touches[0]?.clientX || 0 : e.clientX
  const clientY = 'touches' in e ? e.touches[0]?.clientY || 0 : e.clientY

  contextMenu.visible = true
  contextMenu.x = Math.min(clientX, window.innerWidth - 140)
  contextMenu.y = Math.min(clientY, window.innerHeight - 120)
  contextMenu.message = msg
}

function closeContextMenu() {
  contextMenu.visible = false
  contextMenu.message = null
}

// 引用 — user 和 assistant 消息都可以引用
function handleQuote() {
  if (contextMenu.message) {
    quotedMessage.value = contextMenu.message
  }
  closeContextMenu()
}

// 撤回
async function handleWithdraw() {
  if (!contextMenu.message) return

  const msgId = contextMenu.message.id
  await deleteMessage(msgId)
  messages.value = messages.value.filter(m => m.id !== msgId)
  closeContextMenu()
}

// 重新生成
async function handleReroll() {
  if (!contextMenu.message) return

  const msgId = contextMenu.message.id
  closeContextMenu()

  aiLoading.value = true

  try {
    messages.value = messages.value.filter(m => m.id !== msgId)

    const session = await db.chatSessions.get(sessionId)
    const persona = session?.personaId
      ? await db.personas.get(session.personaId)
      : null

    const newMessages = await rerollMessage(
      msgId,
      sessionId,
      session?.characterId || '',
      persona?.description || ''
    )

    for (const msg of newMessages) {
      messages.value.push({ ...msg })
    }

    scrollToBottom()
  } catch (err: any) {
    const comfortText = getErrorComfort()
    const errorContent = `${comfortText}\n\n[具体错误] ${err.message}`
    const errorMsg = await addMessage(sessionId, 'system', errorContent)
    messages.value.push({ ...errorMsg })
    scrollToBottom()
  } finally {
    aiLoading.value = false
  }
}

// 删除对话
async function handleDeleteSession() {
  if (!window.confirm('确定删除这个对话？所有消息将被清除。')) return

  await db.messages.where('sessionId').equals(sessionId).delete()
  await db.chatSessions.delete(sessionId)
  router.push('/chat')
}

function resetTextarea() {
  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.style.height = 'auto'
    }
  })
}

function formatMsgTime(timestamp: number): string {
  const d = new Date(timestamp)
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// 点击页面关闭右键菜单
watch(() => contextMenu.visible, (visible) => {
  if (visible) {
    const handler = () => {
      closeContextMenu()
      document.removeEventListener('click', handler)
    }
    setTimeout(() => document.addEventListener('click', handler), 0)
  }
})
</script>

<style scoped>
.chat-session-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  max-width: 600px;
  margin: 0 auto;
  position: relative;
  overflow: hidden;
}

/* Header — 固定 */
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  position: relative;
  flex-shrink: 0;
}

.header-center {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-letter {
  font-family: 'Cinzel', serif;
  font-size: 14px;
  color: rgba(245, 245, 245, 0.6);
}

.header-name {
  font-size: 16px;
  font-weight: 500;
}

.header-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: rgba(245, 245, 245, 0.7);
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.header-btn:hover {
  color: #f5f5f5;
  background: rgba(255, 255, 255, 0.05);
}

.session-menu {
  position: absolute;
  top: 54px;
  right: 16px;
  background: #2c2c2e;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  overflow: hidden;
  z-index: 50;
}

.menu-item {
  display: block;
  width: 100%;
  padding: 10px 20px;
  font-family: inherit;
  font-size: 14px;
  color: rgba(245, 245, 245, 0.8);
  background: transparent;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.menu-item.danger {
  color: #e57373;
}

/* Message List — 滚动区域 */
.message-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-row {
  display: flex;
  gap: 10px;
  max-width: 85%;
}

.message-row.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-row.assistant {
  align-self: flex-start;
}

.message-row.system {
  align-self: center;
  max-width: 90%;
}

.msg-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.msg-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-letter-small {
  font-family: 'Cinzel', serif;
  font-size: 13px;
  color: rgba(245, 245, 245, 0.5);
}

.msg-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message-row.user .msg-body {
  align-items: flex-end;
}

.message-row.assistant .msg-body {
  align-items: flex-start;
}

/* Quote in bubble */
.msg-quote {
  padding: 4px 10px;
  font-size: 12px;
  color: rgba(245, 245, 245, 0.5);
  border-left: 2px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 2px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Bubble */
.msg-bubble {
  padding: 10px 14px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
  position: relative;
  cursor: default;
  user-select: text;
}

.msg-bubble.user {
  background: rgba(255, 255, 255, 0.12);
  border-bottom-right-radius: 4px;
}

.msg-bubble.assistant {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-bottom-left-radius: 4px;
}

.msg-bubble.system {
  background: rgba(229, 115, 115, 0.08);
  border: 1px solid rgba(229, 115, 115, 0.15);
  border-radius: 10px;
  font-size: 13px;
  color: rgba(245, 245, 245, 0.7);
  white-space: pre-wrap;
}

.msg-text {
  margin: 0;
  white-space: pre-wrap;
}

.msg-time {
  font-size: 11px;
  color: rgba(245, 245, 245, 0.3);
}

/* Typing indicator */
.msg-bubble.typing {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
}

.typing-text {
  font-size: 13px;
  color: rgba(245, 245, 245, 0.5);
  font-style: italic;
}

.typing-dots {
  display: flex;
  gap: 3px;
}

.typing-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(245, 245, 245, 0.4);
  animation: typingBounce 1.4s infinite ease-in-out both;
}

.typing-dot:nth-child(2) { animation-delay: 0.16s; }
.typing-dot:nth-child(3) { animation-delay: 0.32s; }

@keyframes typingBounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

/* Media */
.media-bubble {
  padding: 0 !important;
  overflow: hidden;
}

.media-sticker {
  width: 140px;
  min-height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  background: rgba(255, 255, 255, 0.03);
}

.sticker-image {
  max-width: 100%;
  max-height: 180px;
  object-fit: contain;
  display: block;
}

.sticker-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80px;
  color: rgba(245, 245, 245, 0.5);
}

.media-image {
  width: 180px;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(255, 255, 255, 0.03);
  cursor: pointer;
  transition: background 0.2s;
}

.media-image:hover {
  background: rgba(255, 255, 255, 0.06);
}

.media-tap-hint {
  margin-top: 8px;
  font-size: 12px;
  color: rgba(245, 245, 245, 0.4);
}

.media-description {
  font-size: 13px;
  color: rgba(245, 245, 245, 0.8);
  padding: 4px;
  text-align: center;
  line-height: 1.4;
}

.media-voice {
  width: 180px;
  padding: 12px 14px;
  cursor: pointer;
}

.voice-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(245, 245, 245, 0.6);
}

.voice-wave {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: 1;
}

.voice-wave span {
  display: block;
  width: 3px;
  border-radius: 2px;
  background: rgba(245, 245, 245, 0.3);
  animation: voiceWave 1s infinite ease-in-out;
}

.voice-wave span:nth-child(1) { height: 8px; animation-delay: 0s; }
.voice-wave span:nth-child(2) { height: 14px; animation-delay: 0.15s; }
.voice-wave span:nth-child(3) { height: 10px; animation-delay: 0.3s; }
.voice-wave span:nth-child(4) { height: 16px; animation-delay: 0.45s; }
.voice-wave span:nth-child(5) { height: 8px; animation-delay: 0.6s; }

@keyframes voiceWave {
  0%, 100% { transform: scaleY(0.6); }
  50% { transform: scaleY(1.2); }
}

/* Quote bar */
.quote-bar {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.04);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}

.quote-bar-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.quote-bar-label {
  font-size: 12px;
  color: rgba(245, 245, 245, 0.5);
  flex-shrink: 0;
}

.quote-bar-text {
  font-size: 13px;
  color: rgba(245, 245, 245, 0.6);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quote-bar-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: rgba(245, 245, 245, 0.5);
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.quote-bar-close:hover {
  color: rgba(245, 245, 245, 0.9);
}

/* Input area — 固定底部 */
.input-area {
  padding: 10px 16px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}

.input-tools {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
}

.tool-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  color: rgba(245, 245, 245, 0.5);
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.tool-btn:hover {
  color: rgba(245, 245, 245, 0.9);
  background: rgba(255, 255, 255, 0.05);
}

.input-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.msg-input {
  flex: 1;
  padding: 10px 14px;
  font-family: inherit;
  font-size: 14px;
  color: var(--color-bone);
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  outline: none;
  resize: none;
  overflow: hidden;
  min-height: 40px;
  max-height: 120px;
  line-height: 1.4;
  transition: border-color 0.2s;
}

.msg-input:focus {
  border-color: rgba(255, 255, 255, 0.2);
}

.msg-input::placeholder {
  color: rgba(245, 245, 245, 0.3);
}

.send-buttons {
  display: flex;
  gap: 6px;
}

.send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}

.send-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.bubble-btn {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(245, 245, 245, 0.7);
}

.bubble-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.18);
  color: #f5f5f5;
}

.ai-btn {
  background: rgba(245, 245, 245, 0.9);
  color: #080808;
}

.ai-btn:hover:not(:disabled) {
  background: #fff;
}

/* Context menu */
.context-menu {
  position: fixed;
  background: #2c2c2e;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  overflow: hidden;
  z-index: 2000;
  min-width: 120px;
}

.ctx-item {
  display: block;
  width: 100%;
  padding: 10px 16px;
  font-family: inherit;
  font-size: 14px;
  color: rgba(245, 245, 245, 0.8);
  background: transparent;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s;
}

.ctx-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

/* Mini modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.mini-modal {
  width: 100%;
  max-width: 360px;
  padding: 24px;
  background: #1c1c1e;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
}

.mini-modal-title {
  font-family: 'Cinzel', 'Noto Serif SC', serif;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
}

.mini-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  font-family: inherit;
  font-size: 14px;
  color: var(--color-bone);
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: rgba(255, 255, 255, 0.25);
}

.form-input::placeholder {
  color: rgba(245, 245, 245, 0.3);
}

.form-textarea {
  resize: vertical;
  min-height: 60px;
}

.modal-btn {
  padding: 9px 16px;
  font-family: inherit;
  font-size: 13px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-btn.secondary {
  color: rgba(245, 245, 245, 0.6);
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-btn.secondary:hover {
  color: rgba(245, 245, 245, 0.9);
  border-color: rgba(255, 255, 255, 0.2);
}

.modal-btn.primary {
  color: #080808;
  background: rgba(245, 245, 245, 0.9);
  border: 1px solid transparent;
}

.modal-btn.primary:hover:not(:disabled) {
  background: #fff;
}

.modal-btn.primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

