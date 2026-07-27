
<template>
  <div class="chat-session-container" :style="sessionWallpaperStyle">
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

        <div class="header-meta">
          <span class="header-name">{{ character?.name || '对话' }}</span>
          <span class="header-subtitle">
            {{ sessionModeLabel }}
          </span>
        </div>

        <div v-if="userPersona" class="user-avatar-pill" :title="userPersona.name">
          <img v-if="userPersona.avatar" :src="userPersona.avatar" alt="" />
          <span v-else>{{ userPersona.name.charAt(0) }}</span>
        </div>
      </div>

      <button class="header-btn" type="button" @click="showSessionMenu = !showSessionMenu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
        </svg>
      </button>

      <Transition name="fade">
        <div v-if="showSessionMenu" class="session-menu">
          <button class="menu-item" type="button" @click="handleSetWallpaper">设置壁纸</button>
          <button class="menu-item" type="button" @click="showBubbleStyleModal = true; showSessionMenu = false">气泡样式</button>
          <button class="menu-item" type="button" @click="showProactiveModal = true; showSessionMenu = false">主动消息设置</button>
          <button class="menu-item" type="button" @click="handleClearMessages">清空聊天记录</button>
          <button class="menu-item danger" type="button" @click="handleDeleteSession">删除对话</button>
        </div>
      </Transition>
    </header>

    <!-- 消息列表（滚动区域） -->
    <div ref="messageListRef" class="message-list">
      <div
  v-for="msg in messages"
  :key="msg.id"
  :class="['message-row', msg.role]"
  @contextmenu.prevent="openContextMenu($event, msg)"
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
            :class="[
              'msg-bubble',
              msg.role,
              bubbleStyleClass,
              { 'media-bubble': msg.media }
            ]"
          >
            <!-- 图片 -->
            <div v-if="msg.media?.type === 'image'" class="media-image" @click="toggleMediaReveal(msg.id)">
              <svg
                v-if="!revealedMedia.has(msg.id)"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                opacity="0.6"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <p v-if="revealedMedia.has(msg.id)" class="media-description">{{ msg.media?.description }}</p>
              <p v-else class="media-tap-hint">点击查看</p>
            </div>

            <!-- 语音 -->
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

            <!-- 表情包 -->
            <div v-else-if="msg.media?.type === 'sticker'" class="media-sticker">
              <img v-if="msg.media?.url" :src="msg.media.url" alt="" class="sticker-image" />
              <div v-else class="sticker-fallback">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.6">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16l4-4h10a2 2 0 0 0 2-2V8z" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
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

        <button class="tool-btn" type="button" title="发送表情包" @click="showStickerPicker = true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16l4-4h10a2 2 0 0 0 2-2V8z" stroke-linecap="round" stroke-linejoin="round"/>
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

    <!-- 气泡样式设置 -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showBubbleStyleModal" class="modal-overlay" @click.self="showBubbleStyleModal = false">
          <div class="mini-modal">
            <h4 class="mini-modal-title">气泡样式</h4>

            <div class="bubble-style-list">
              <button
                v-for="item in bubbleStyleOptions"
                :key="item.value"
                type="button"
                :class="['bubble-style-option', { active: (session?.bubbleStyle || 'classic') === item.value }]"
                @click="saveBubbleStyle(item.value)"
              >
                <span class="bubble-style-name">{{ item.label }}</span>
                <span class="bubble-style-desc">{{ item.description }}</span>
              </button>
            </div>

            <div class="mini-modal-actions">
              <button class="modal-btn secondary" type="button" @click="showBubbleStyleModal = false">
                关闭
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  <!-- 主动消息设置 -->
<Teleport to="body">
  <Transition name="fade">
    <div v-if="showProactiveModal" class="modal-overlay" @click.self="showProactiveModal = false">
      <div class="mini-modal">
        <h4 class="mini-modal-title">主动消息设置</h4>

        <label class="setting-row">
          <span>
            <strong>允许角色主动发消息</strong>
            <small>页面打开时，角色可按频率主动传讯。</small>
          </span>
          <input v-model="proactiveForm.enabled" type="checkbox" />
        </label>

        <label class="setting-row">
          <span>
            <strong>允许夜间静默</strong>
            <small>夜间（23:00–7:00）不主动打扰。</small>
          </span>
          <input v-model="proactiveForm.silentNight" type="checkbox" />
        </label>

        <label class="setting-row">
          <span>
            <strong>必须按角色性格触发</strong>
            <small>主动消息必须符合角色性格。</small>
          </span>
          <input v-model="proactiveForm.requirePersonality" type="checkbox" />
        </label>

        <label class="setting-row">
          <span>
            <strong>允许绘画触发</strong>
            <small>角色可在合适时使用绘画/图像表达。</small>
          </span>
          <input v-model="proactiveForm.allowDrawing" type="checkbox" />
        </label>

        <label class="setting-row">
          <span>
            <strong>仅在长对话中主动</strong>
            <small>避免过短对话或连续刷屏。</small>
          </span>
          <input v-model="proactiveForm.onlyWhenLongConversation" type="checkbox" />
        </label>

        <div class="form-group">
          <label class="form-label">频率</label>
          <select v-model.number="proactiveForm.frequencyMinutes" class="form-input">
            <option :value="30">约每 30 分钟</option>
            <option :value="60">约每 1 小时</option>
            <option :value="120">约每 2 小时</option>
            <option :value="360">约每 6 小时</option>
            <option :value="720">约每 12 小时</option>
            <option :value="1440">约每天</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">最少对话消息数</label>
          <input
            v-model.number="proactiveForm.minMessageCount"
            class="form-input"
            type="number"
            min="1"
          />
        </div>

        <div class="form-group">
          <label class="form-label">近 1 小时最多消息数</label>
          <input
            v-model.number="proactiveForm.maxRecentMessages"
            class="form-input"
            type="number"
            min="0"
          />
        </div>

        <label class="setting-row">
          <span>
            <strong>允许系统通知</strong>
            <small>浏览器会请求通知权限。</small>
          </span>
          <input v-model="proactiveForm.notify" type="checkbox" />
        </label>

        <p class="setting-note">
          注：静态网页无法保证关闭页面后仍后台运行。PWA 安装后或未来 Tauri 桌面端会更稳定。
        </p>

        <div class="mini-modal-actions">
          <button
            class="modal-btn secondary"
            type="button"
            :disabled="aiLoading"
            @click="triggerProactiveNow"
          >
            立即触发一次
          </button>

          <button class="modal-btn secondary" type="button" @click="showProactiveModal = false">
            取消
          </button>

          <button class="modal-btn primary" type="button" @click="saveProactiveSettings">
            保存
          </button>
        </div>
      </div>
    </div>
  </Transition>
</Teleport>


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

    <!-- 壁纸设置弹窗 -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showWallpaperInput" class="modal-overlay" @click.self="showWallpaperInput = false">
          <div class="mini-modal">
            <h4 class="mini-modal-title">设置壁纸</h4>
            <textarea
              v-model="wallpaperInput"
              class="form-input form-textarea"
              placeholder="输入壁纸 URL，或粘贴图片链接…"
              rows="3"
            ></textarea>
            <div class="mini-modal-actions">
              <button class="modal-btn secondary" type="button" @click="showWallpaperInput = false">取消</button>
              <button class="modal-btn primary" type="button" :disabled="!wallpaperInput.trim()" @click="saveWallpaper">保存</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 全局表情包选择器 -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showStickerPicker" class="modal-overlay" @click.self="showStickerPicker = false">
          <div class="mini-modal sticker-modal">
            <h4 class="mini-modal-title">表情包</h4>

            <div v-if="stickers.length === 0" class="sticker-empty">
              尚未添加表情包。添加后可在所有聊天窗共用。
            </div>

            <div v-else class="sticker-grid">
              <div
                v-for="sticker in stickers"
                :key="sticker.id"
                class="sticker-card"
              >
                <button
                  class="sticker-send-btn"
                  type="button"
                  :title="sticker.name"
                  @click="sendSticker(sticker)"
                >
                  <img :src="sticker.url" alt="" class="sticker-card-image" />
                </button>

                <div class="sticker-card-footer">
                  <span class="sticker-card-name">{{ sticker.name }}</span>
                  <button
                    class="sticker-delete-btn"
                    type="button"
                    title="删除"
                    @click.stop="handleDeleteSticker(sticker.id)"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>

            <div class="sticker-add-panel">
              <h5 class="sticker-add-title">添加全局表情包</h5>

              <input
                v-model="newSticker.name"
                class="form-input"
                type="text"
                placeholder="名称，例如：哭哭猫"
              />

              <input
                v-model="newSticker.url"
                class="form-input"
                type="text"
                placeholder="图片 URL"
              />

              <textarea
                v-model="newSticker.description"
                class="form-input form-textarea"
                rows="2"
                placeholder="描述：画面上是什么"
              ></textarea>

              <textarea
                v-model="newSticker.meaning"
                class="form-input form-textarea"
                rows="2"
                placeholder="含义：表达什么情绪/意图，给 AI 理解用"
              ></textarea>

              <button
                class="modal-btn primary sticker-add-btn"
                type="button"
                :disabled="
                  !newSticker.name.trim() ||
                  !newSticker.url.trim() ||
                  !newSticker.description.trim() ||
                  !newSticker.meaning.trim()
                "
                @click="handleAddSticker"
              >
                添加到全局表情包
              </button>
            </div>

            <div class="mini-modal-actions">
              <button class="modal-btn secondary" type="button" @click="showStickerPicker = false">
                关闭
              </button>
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
import { startProactiveScheduler, stopProactiveScheduler } from './services/proactiveService'
import { ref, reactive, onMounted, onBeforeUnmount, nextTick, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  db,
  type Message,
  type Character,
  type Persona,
  type ChatSession,
  type StickerItem
} from '@/core/db'
import {
  addMessage,
  deleteMessage,
  getSessionMessages,
  sendAndGetReply,
  rerollMessage,
  sendProactiveReply
} from './services/chatService'
import {
  addSticker,
  deleteSticker,
  getEnabledStickers,
  stickerToMessageMedia
} from './services/stickerService'

interface DisplayMessage extends Message {
  quotedContent?: string
}

const route = useRoute()
const router = useRouter()

const sessionId = route.params.sessionId as string
const session = ref<ChatSession | null>(null)
const character = ref<Character | undefined>()
const userPersona = ref<Persona | null>(null)
const messages = ref<DisplayMessage[]>([])
const inputText = ref('')
const aiLoading = ref(false)
const showSessionMenu = ref(false)
const showImageInput = ref(false)
const showVoiceInput = ref(false)
const showWallpaperInput = ref(false)
const wallpaperInput = ref('')
const showStickerPicker = ref(false)
const mediaDescription = ref('')
const quotedMessage = ref<Message | null>(null)
const revealedMedia = reactive(new Set<string>())
const messageListRef = ref<HTMLElement | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const showBubbleStyleModal = ref(false)
const showProactiveModal = ref(false)
const bubbleStyleOptions = [
  {
    value: 'classic',
    label: '经典玻璃',
    description: '默认黑白毛玻璃气泡'
  },
  {
    value: 'soft',
    label: '柔和雾面',
    description: '更轻、更圆润'
  },
  {
    value: 'sharp',
    label: '锐利边框',
    description: '更冷、更清晰'
  },
  {
    value: 'paper',
    label: '纸片感',
    description: '像便签纸一样的低饱和气泡'
  },
  {
    value: 'transparent',
    label: '透明低干扰',
    description: '弱化气泡背景，适合壁纸'
  }
]

const proactiveForm = reactive({
  enabled: false,
  frequencyMinutes: 120,
  notify: false,
  silentNight: true,
  requirePersonality: true,
  allowDrawing: false,
  minMessageCount: 8,
  maxRecentMessages: 3,
  onlyWhenLongConversation: true
})


const stickers = ref<StickerItem[]>([])
const newSticker = reactive({
  name: '',
  url: '',
  description: '',
  meaning: ''
})

const contextMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  message: null as Message | null
})

const sessionModeLabel = computed(() => {
  if (session.value?.mode === 'daily') return '日常模式'
  if (session.value?.mode === 'roleplay') return 'RP 模式'
  return ''
})

const sessionWallpaperStyle = computed(() => {
  if (!session.value?.wallpaper) return {}

  return {
    backgroundImage: `url(${session.value.wallpaper})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed'
  }
})

// 打字指示器文案（可自定义）
const typingIndicatorText = computed(() => {
  if (character.value?.name) {
    return `${character.value.name}正在输入`
  }
  return '对方正在输入'
})

const bubbleStyleClass = computed(() => {
  const style = session.value?.bubbleStyle || 'classic'
  return `bubble-style-${style}`
})

onMounted(async () => {
  session.value = await db.chatSessions.get(sessionId) || null

  if (!session.value) {
    router.push('/chat')
    return
  }

  character.value = await db.characters.get(session.value.characterId)

  if (session.value.personaId) {
    userPersona.value = await db.personas.get(session.value.personaId) || null
  }
wallpaperInput.value = session.value.wallpaper || ''

proactiveForm.enabled = Boolean(session.value.proactiveEnabled)
proactiveForm.frequencyMinutes = session.value.proactiveFrequencyMinutes || 120
proactiveForm.notify = Boolean(session.value.proactiveNotify)

// 下面这些字段用 ?? 保留默认值：
// 旧会话没有这些字段时，会使用右侧默认值
// 已经保存过 false 的字段，不会被误改成 true
proactiveForm.silentNight = session.value.proactiveSilentNight ?? true
proactiveForm.requirePersonality = session.value.proactiveRequirePersonality ?? true
proactiveForm.allowDrawing = session.value.proactiveAllowDrawing ?? false
proactiveForm.minMessageCount = session.value.proactiveMinMessageCount ?? 8
proactiveForm.maxRecentMessages = session.value.proactiveMaxRecentMessages ?? 3
proactiveForm.onlyWhenLongConversation =
  session.value.proactiveOnlyWhenLongConversation ?? true

await loadMessages()
await loadStickers()
scrollToBottom()

startProactiveScheduler()
})
onBeforeUnmount(() => {
  stopProactiveScheduler()
})


async function loadMessages() {
  const raw = await getSessionMessages(sessionId)
  messages.value = raw.map(msg => ({ ...msg }))
}

async function loadStickers() {
  stickers.value = await getEnabledStickers()
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
    const currentSession = await db.chatSessions.get(sessionId)
    const persona = currentSession?.personaId
      ? await db.personas.get(currentSession.personaId)
      : null

    const replyMessages = await sendAndGetReply(
      sessionId,
      currentSession?.characterId || '',
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

async function sendSticker(sticker: StickerItem) {
  const msg = await addMessage(
    sessionId,
    'user',
    '',
    stickerToMessageMedia(sticker)
  )

  messages.value.push({ ...msg })
  showStickerPicker.value = false
  scrollToBottom()
}

/**
 * 添加全局表情包。
 * 添加后会出现在所有聊天窗。
 */
async function handleAddSticker() {
  const name = newSticker.name.trim()
  const url = newSticker.url.trim()
  const description = newSticker.description.trim()
  const meaning = newSticker.meaning.trim()

  if (!name || !url || !description || !meaning) return

  await addSticker({
    name,
    url,
    description,
    meaning
  })

  newSticker.name = ''
  newSticker.url = ''
  newSticker.description = ''
  newSticker.meaning = ''

  await loadStickers()
}

/**
 * 删除全局表情包。
 * 不影响历史聊天记录里已经发送过的表情包消息。
 */
async function handleDeleteSticker(id: string) {
  if (!window.confirm('确定删除这个全局表情包吗？历史消息不会被删除。')) return

  await deleteSticker(id)
  await loadStickers()
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

    const currentSession = await db.chatSessions.get(sessionId)
    const persona = currentSession?.personaId
      ? await db.personas.get(currentSession.personaId)
      : null

    const newMessages = await rerollMessage(
      msgId,
      sessionId,
      currentSession?.characterId || '',
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

// 清空聊天记录
async function handleClearMessages() {
  if (!window.confirm('确定清空这个对话的所有聊天记录吗？此操作不可撤销。')) return

  await db.messages.where('sessionId').equals(sessionId).delete()
  messages.value = []
  quotedMessage.value = null
  closeContextMenu()
  showSessionMenu.value = false
}
// 删除当前对话及其消息
async function handleDeleteSession() {
  if (!window.confirm('确定删除这个对话吗？所有聊天记录将一并删除，且无法恢复。')) return

  // 删除会话关联的消息；Dexie 不会自动级联删除。
  await db.messages.where('sessionId').equals(sessionId).delete()
  await db.chatSessions.delete(sessionId)

  showSessionMenu.value = false
  router.push('/chat')
}


// 设置壁纸
function handleSetWallpaper() {
  wallpaperInput.value = session.value?.wallpaper || ''
  showWallpaperInput.value = true
  showSessionMenu.value = false
}

async function saveWallpaper() {
  const value = wallpaperInput.value.trim()

  if (!session.value) return

  await db.chatSessions.update(sessionId, {
    wallpaper: value
  })

  session.value = {
    ...session.value,
    wallpaper: value
  }

  showWallpaperInput.value = false
}

async function saveBubbleStyle(style: string) {
  if (!session.value) return

  await db.chatSessions.update(sessionId, {
    bubbleStyle: style
  })

  session.value = {
    ...session.value,
    bubbleStyle: style
  }

  showBubbleStyleModal.value = false
}

async function saveProactiveSettings() {
  if (!session.value) return

  let notify = proactiveForm.notify

  if (notify && 'Notification' in window) {
    const permission = await Notification.requestPermission()
    notify = permission === 'granted'
  } else {
    notify = false
  }

  await db.chatSessions.update(sessionId, {
    proactiveEnabled: proactiveForm.enabled,
    proactiveFrequencyMinutes: proactiveForm.frequencyMinutes,
    proactiveNotify: notify,
    proactiveSilentNight: proactiveForm.silentNight,
    proactiveRequirePersonality: proactiveForm.requirePersonality,
    proactiveAllowDrawing: proactiveForm.allowDrawing,
    proactiveMinMessageCount: proactiveForm.minMessageCount,
    proactiveMaxRecentMessages: proactiveForm.maxRecentMessages,
    proactiveOnlyWhenLongConversation: proactiveForm.onlyWhenLongConversation
  })

  session.value = {
    ...session.value,
    proactiveEnabled: proactiveForm.enabled,
    proactiveFrequencyMinutes: proactiveForm.frequencyMinutes,
    proactiveNotify: notify,
    proactiveSilentNight: proactiveForm.silentNight,
    proactiveRequirePersonality: proactiveForm.requirePersonality,
    proactiveAllowDrawing: proactiveForm.allowDrawing,
    proactiveMinMessageCount: proactiveForm.minMessageCount,
    proactiveMaxRecentMessages: proactiveForm.maxRecentMessages,
    proactiveOnlyWhenLongConversation: proactiveForm.onlyWhenLongConversation
  }

  proactiveForm.notify = notify
  showProactiveModal.value = false
}


async function triggerProactiveNow() {
  if (!session.value || aiLoading.value) return

  aiLoading.value = true
  showProactiveModal.value = false
  scrollToBottom()

  try {
    const persona = session.value.personaId
      ? await db.personas.get(session.value.personaId)
      : null

    // 插入一条 system 消息作为后台触发信号，不展示也可以之后改成不入库
    const replyMessages = await sendProactiveReply(
  sessionId,
  session.value.characterId,
  persona?.description || ''
)

    for (const msg of replyMessages) {
      messages.value.push({ ...msg })
    }

    await db.chatSessions.update(sessionId, {
      lastProactiveAt: Date.now()
    })

    if (session.value.proactiveNotify && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(character.value?.name || 'Whisperbox', {
        body: replyMessages[0]?.content || '你收到了一条新消息'
      })
    }

    scrollToBottom()
  } catch (err: any) {
    const errorMsg = await addMessage(
      sessionId,
      'system',
      `[主动消息失败] ${err.message || '未知错误'}`
    )
    messages.value.push({ ...errorMsg })
    scrollToBottom()
  } finally {
    aiLoading.value = false
  }
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
  background-color: var(--color-abyss);
  background-repeat: no-repeat;
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
  background: rgba(8, 8, 8, 0.72);
  backdrop-filter: blur(10px);
}

.header-center {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
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
  flex-shrink: 0;
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

.header-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.header-name {
  font-size: 16px;
  font-weight: 500;
  line-height: 1.2;
}

.header-subtitle {
  font-size: 11px;
  color: rgba(245, 245, 245, 0.38);
  line-height: 1.2;
}

.user-avatar-pill {
  width: 28px;
  height: 28px;
  margin-left: 4px;
  border-radius: 50%;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.07);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(245, 245, 245, 0.65);
  flex-shrink: 0;
  font-size: 12px;
}

.user-avatar-pill img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
  flex-shrink: 0;
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
  min-width: 140px;
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
  white-space: nowrap;
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
  background: rgba(8, 8, 8, 0.25);
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
  width: 180px;
  min-height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px;
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
  background: rgba(8, 8, 8, 0.72);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
  backdrop-filter: blur(10px);
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
  background: rgba(8, 8, 8, 0.72);
  backdrop-filter: blur(10px);
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

.sticker-modal {
  max-width: 460px;
  max-height: 86vh;
  overflow-y: auto;
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

/* Sticker picker */
.sticker-empty {
  padding: 18px;
  margin-bottom: 16px;
  font-size: 13px;
  line-height: 1.5;
  color: rgba(245, 245, 245, 0.45);
  text-align: center;
  background: rgba(255, 255, 255, 0.025);
  border: 1px dashed rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.sticker-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 18px;
}

.sticker-card {
  overflow: hidden;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
}

.sticker-send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 96px;
  padding: 8px;
  background: transparent;
  border: none;
  cursor: pointer;
}

.sticker-send-btn:hover {
  background: rgba(255, 255, 255, 0.04);
}

.sticker-card-image {
  max-width: 100%;
  max-height: 80px;
  object-fit: contain;
  display: block;
}

.sticker-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 6px 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.sticker-card-name {
  min-width: 0;
  overflow: hidden;
  font-size: 12px;
  color: rgba(245, 245, 245, 0.62);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sticker-delete-btn {
  width: 22px;
  height: 22px;
  color: rgba(245, 245, 245, 0.42);
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  flex-shrink: 0;
}

.sticker-delete-btn:hover {
  color: #e57373;
  background: rgba(229, 115, 115, 0.08);
}

.sticker-add-panel {
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding-top: 14px;
  margin-top: 4px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.sticker-add-title {
  margin: 0 0 2px;
  font-size: 13px;
  font-weight: 500;
  color: rgba(245, 245, 245, 0.7);
}

.sticker-add-btn {
  align-self: flex-end;
  margin-top: 2px;
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
/* Bubble style modal */
.bubble-style-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bubble-style-option {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 11px 12px;
  color: rgba(245, 245, 245, 0.68);
  text-align: left;
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  cursor: pointer;
}

.bubble-style-option:hover {
  background: rgba(255, 255, 255, 0.055);
}

.bubble-style-option.active {
  color: rgba(245, 245, 245, 0.95);
  background: rgba(255, 255, 255, 0.085);
  border-color: rgba(255, 255, 255, 0.36);
}

.bubble-style-name {
  font-size: 14px;
}

.bubble-style-desc {
  font-size: 12px;
  color: rgba(245, 245, 245, 0.42);
}

/* Bubble presets */
.msg-bubble.bubble-style-classic.assistant {
  background: rgba(255, 255, 255, 0.08);
}

.msg-bubble.bubble-style-classic.user {
  background: rgba(245, 245, 245, 0.88);
  color: #080808;
}

.msg-bubble.bubble-style-soft {
  border-radius: 20px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.18);
}

.msg-bubble.bubble-style-soft.assistant {
  background: rgba(255, 255, 255, 0.1);
}

.msg-bubble.bubble-style-soft.user {
  background: rgba(245, 245, 245, 0.78);
  color: #080808;
}

.msg-bubble.bubble-style-sharp {
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.16);
}

.msg-bubble.bubble-style-sharp.assistant {
  background: rgba(0, 0, 0, 0.42);
}

.msg-bubble.bubble-style-sharp.user {
  background: rgba(245, 245, 245, 0.92);
  color: #080808;
}

.msg-bubble.bubble-style-paper {
  border-radius: 3px 14px 14px 14px;
}

.msg-bubble.bubble-style-paper.assistant {
  color: rgba(245, 245, 245, 0.9);
  background: rgba(245, 245, 245, 0.11);
}

.msg-bubble.bubble-style-paper.user {
  color: #181818;
  background: rgba(235, 232, 222, 0.9);
}

.msg-bubble.bubble-style-transparent {
  background: rgba(0, 0, 0, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.07);
  backdrop-filter: blur(10px);
}

.msg-bubble.bubble-style-transparent.user {
  color: rgba(245, 245, 245, 0.92);
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 12px;
  margin-bottom: 10px;
  color: rgba(245, 245, 245, 0.76);
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 10px;
}

.setting-row span {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.setting-row strong {
  font-size: 13px;
  font-weight: 500;
}

.setting-row small {
  font-size: 11px;
  line-height: 1.45;
  color: rgba(245, 245, 245, 0.42);
}

.setting-row input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #f5f5f5;
}

.setting-note {
  margin: 10px 0 0;
  font-size: 11px;
  line-height: 1.6;
  color: rgba(245, 245, 245, 0.38);
}


</style>
