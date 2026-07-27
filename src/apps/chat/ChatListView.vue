<template>
  <div class="chat-list-container">
    <!-- 顶部栏 -->
    <header class="chat-header">
      <button class="header-btn" @click="$router.push('/')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M19 12H5M12 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <h1 class="header-title">短信</h1>
      <button class="header-btn" @click="showNewSession = true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M12 5v14M5 12h14" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </header>

    <!-- 会话列表 -->
    <div class="session-list">
      <div v-if="loading" class="empty-state">
        <p class="empty-text">加载中…</p>
      </div>

      <div v-else-if="sessions.length === 0" class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <p class="empty-text">尚无对话</p>
        <p class="empty-hint">点击右上角开始新对话</p>
      </div>

      <template v-else>
        <div
          v-for="session in sessions"
          :key="session.id"
          class="session-item"
          @click="openSession(session.id)"
        >
          <div class="session-avatar">
            <img
              v-if="session.character?.avatar"
              :src="session.character.avatar"
              alt=""
            />
            <span v-else class="avatar-placeholder">
              {{ (session.character?.name || session.title).charAt(0) }}
            </span>
          </div>

          <div class="session-info">
            <div class="session-top">
              <span class="session-name">
                {{ session.character?.name || session.title }}
              </span>
              <span class="session-time">
                {{ formatTime(session.lastMessageAt) }}
              </span>
            </div>
            <div class="session-preview">
              {{ session.lastMessage || '暂无消息' }}
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- 新建会话弹窗 -->
    <Teleport to="body">
      <Transition name="modal">
        <NewSessionModal
          v-if="showNewSession"
          @close="showNewSession = false"
          @created="handleSessionCreated"
        />
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { db, type ChatSession, type Character } from '@/core/db'
import NewSessionModal from './components/NewSessionModal.vue'

interface SessionWithCharacter extends ChatSession {
  character?: Character
  lastMessage?: string
}

const router = useRouter()
const sessions = ref<SessionWithCharacter[]>([])
const loading = ref(true)
const showNewSession = ref(false)

onMounted(async () => {
  await loadSessions()
})

async function loadSessions() {
  loading.value = true

  try {
    const allSessions = await db.chatSessions
      .orderBy('lastMessageAt')
      .reverse()
      .toArray()

    const result: SessionWithCharacter[] = []

    for (const session of allSessions) {
      const character = await db.characters.get(session.characterId)

      // 获取最后一条消息作为预览
      const lastMsg = await db.messages
        .where('sessionId')
        .equals(session.id)
        .reverse()
        .sortBy('timestamp')

      const lastMessage = lastMsg[0]?.content || ''

      result.push({
        ...session,
        character,
        lastMessage: lastMessage.length > 40
          ? lastMessage.substring(0, 40) + '…'
          : lastMessage
      })
    }

    sessions.value = result
  } finally {
    loading.value = false
  }
}

function openSession(sessionId: string) {
  router.push(`/chat/${sessionId}`)
}

async function handleSessionCreated(sessionId: string) {
  showNewSession.value = false
  await loadSessions()
  router.push(`/chat/${sessionId}`)
}

function formatTime(timestamp: number): string {
  const now = new Date()
  const date = new Date(timestamp)
  const diff = now.getTime() - date.getTime()

  // 今天
  if (diff < 86400000 && now.getDate() === date.getDate()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  // 昨天
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()) {
    return '昨天'
  }

  // 今年
  if (date.getFullYear() === now.getFullYear()) {
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  // 更早
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
}
</script>

<style scoped>
.chat-list-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 600px;
  margin: 0 auto;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.header-title {
  font-family: 'Cinzel', 'Noto Serif SC', serif;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.03em;
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
  transition: all 0.2s ease;
}

.header-btn:hover {
  color: rgba(245, 245, 245, 1);
  background: rgba(255, 255, 255, 0.05);
}

.session-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  gap: 12px;
}

.empty-text {
  font-size: 15px;
  color: rgba(245, 245, 245, 0.5);
}

.empty-hint {
  font-size: 13px;
  color: rgba(245, 245, 245, 0.3);
}

.session-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 20px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.session-item:hover {
  background: rgba(255, 255, 255, 0.03);
}

.session-item:active {
  background: rgba(255, 255, 255, 0.06);
}

.session-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
  flex-shrink: 0;
}

.session-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-family: 'Cinzel', serif;
  font-size: 20px;
  color: rgba(245, 245, 245, 0.5);
}

.session-info {
  flex: 1;
  min-width: 0;
}

.session-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 4px;
}

.session-name {
  font-size: 15px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.session-time {
  font-size: 12px;
  color: rgba(245, 245, 245, 0.4);
  flex-shrink: 0;
  margin-left: 8px;
}

.session-preview {
  font-size: 13px;
  color: rgba(245, 245, 245, 0.45);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Modal 过渡 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
