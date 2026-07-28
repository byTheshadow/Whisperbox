<template>
  <div class="memory-page">
    <header class="memory-header">
      <button class="memory-back-btn" type="button" @click="$router.push('/')">
        ← 返回
      </button>

      <div>
        <h1 class="memory-title">记忆</h1>
        <p class="memory-subtitle">
          这里收藏着 Chat 里生成的摘要、日记、永久记忆与提示词。
        </p>
      </div>
    </header>

    <section class="memory-toolbar">
      <input
        v-model="keyword"
        class="memory-search"
        type="text"
        placeholder="搜索记忆内容、标题、标签…"
      />

      <select v-model="typeFilter" class="memory-select">
        <option value="all">全部类型</option>
        <option value="summary">会话摘要</option>
        <option value="diary">真实 user 日记</option>
        <option value="event">事件</option>
        <option value="custom">自定义记忆</option>
        <option value="permanent">永久记忆</option>
        <option value="worldbook">世界书</option>
        <option value="globalPrompt">全局提示词</option>
      </select>

      <select v-model="statusFilter" class="memory-select">
        <option value="all">全部状态</option>
        <option value="saved">已保存</option>
        <option value="draft">草稿</option>
        <option value="archived">已归档</option>
      </select>

      <button class="memory-action-btn" type="button" @click="openCreateModal">
        新增记忆
      </button>
    </section>

    <section class="global-prompt-panel">
      <div class="global-prompt-header">
        <div>
          <h2 class="global-prompt-title">全局提示词</h2>
          <p class="global-prompt-subtitle">
            这里的内容会注入 Chat 的系统提示词中，影响所有会话。请写长期规则，不要写临时消息。
          </p>
        </div>

        <button
          class="memory-action-btn"
          type="button"
          :disabled="globalPromptSaving"
          @click="handleSaveGlobalPrompt"
        >
          {{ globalPromptSaving ? '保存中…' : '保存全局提示词' }}
        </button>
      </div>

      <textarea
        v-model="globalPromptText"
        class="global-prompt-textarea"
        rows="5"
        maxlength="8000"
        placeholder="例如：Whisperbox 是陪伴型短信空间；回复要有空间感、陪伴感；不要变成普通客服或管理后台语气……"
      ></textarea>
    </section>

    <main class="memory-main">
      <p v-if="loading" class="memory-empty">正在读取记忆…</p>

      <p v-else-if="filteredMemories.length === 0" class="memory-empty">
        暂时没有符合条件的记忆。
      </p>

      <article
        v-for="memory in filteredMemories"
        :key="memory.id"
        :class="[
          'memory-card',
          `type-${memory.type}`,
          {
            'is-disabled': !memory.enabled,
            'is-draft': memory.status === 'draft'
          }
        ]"
      >
        <div class="memory-card-top">
          <div>
            <div class="memory-meta-row">
              <span class="memory-type">{{ typeLabel(memory.type) }}</span>
              <span class="memory-scope">{{ scopeLabel(memory.scope) }}</span>
              <span v-if="memory.status === 'draft'" class="memory-status draft">草稿</span>
              <span v-else-if="memory.status === 'archived'" class="memory-status archived">归档</span>
              <span v-if="!memory.enabled" class="memory-status disabled">禁用</span>
            </div>

            <h2 class="memory-card-title">
              {{ memory.title || '无标题记忆' }}
            </h2>

            <p v-if="memory.sessionId" class="memory-bound-line">
              绑定会话：{{ boundSessionName(memory.sessionId) }}
            </p>
          </div>

          <span class="memory-date">
            {{ formatDate(memory.updatedAt || memory.createdAt) }}
          </span>
        </div>

        <p class="memory-content">{{ memory.content }}</p>

        <div v-if="memory.tags?.length" class="memory-tags">
          <span v-for="tag in memory.tags" :key="tag" class="memory-tag">
            #{{ tag }}
          </span>
        </div>

        <div v-if="memory.keywords?.length" class="memory-tags">
          <span v-for="kw in memory.keywords" :key="kw" class="memory-tag keyword">
            {{ kw }}
          </span>
        </div>

        <div class="memory-card-footer">
          <span class="memory-extra">
            重要度 {{ memory.importance }} · 来源 {{ sourceLabel(memory.source) }}
          </span>

          <div class="memory-actions">
            <button
              v-if="memory.status === 'draft'"
              class="memory-text-btn"
              type="button"
              @click="markSaved(memory)"
            >
              收下草稿
            </button>

            <button
              class="memory-text-btn"
              type="button"
              @click="toggleEnabled(memory)"
            >
              {{ memory.enabled ? '禁用' : '启用' }}
            </button>

            <button
              class="memory-text-btn"
              type="button"
              @click="openEditModal(memory)"
            >
              编辑
            </button>

            <button
              class="memory-text-btn danger"
              type="button"
              @click="removeMemory(memory)"
            >
              删除
            </button>
          </div>
        </div>
      </article>
    </main>

    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showEditor"
          class="memory-modal-overlay"
          @click.self="closeEditor"
        >
          <div class="memory-modal">
            <header class="memory-modal-header">
              <div>
                <h3 class="memory-modal-title">
                  {{ editingId ? '编辑记忆' : '新增记忆' }}
                </h3>
                <p class="memory-modal-subtitle">
                  所有内容都会写入同一个记忆系统，Chat 和记忆 App 会共用。
                </p>
              </div>

              <button class="memory-close-btn" type="button" @click="closeEditor">
                ×
              </button>
            </header>

            <div class="memory-form">
              <label class="memory-field">
                <span>标题</span>
                <input v-model="editor.title" type="text" maxlength="120" />
              </label>

              <label class="memory-field">
                <span>类型</span>
                <select v-model="editor.type" @change="handleEditorTypeChange">
                  <option value="summary">会话摘要</option>
                  <option value="diary">真实 user 日记</option>
                  <option value="event">事件</option>
                  <option value="custom">自定义记忆</option>
                  <option value="permanent">永久记忆</option>
                  <option value="worldbook">世界书</option>
                  <option value="globalPrompt">全局提示词</option>
                </select>
              </label>

              <label class="memory-field">
                <span>范围</span>
                <select v-model="editor.scope">
                  <option value="daily">daily</option>
                  <option value="roleplay">roleplay</option>
                  <option value="global">global</option>
                </select>
              </label>

              <label class="memory-field">
                <span>绑定会话</span>
                <select v-model="editor.sessionId" @change="handleEditorSessionChange">
                  <option value="">不绑定会话 / 全局记忆</option>
                  <option
                    v-for="session in sessions"
                    :key="session.id"
                    :value="session.id"
                  >
                    {{ sessionLabel(session) }}
                  </option>
                </select>
              </label>

              <p v-if="selectedSession" class="memory-bound-hint">
                当前绑定：{{ selectedSession.character?.name || selectedSession.title }}
                · {{ selectedSession.mode === 'daily' ? 'daily' : 'RP' }}
              </p>

              <div v-if="isWorldbookEditor" class="worldbook-editor-hint">
                <strong>世界书模式</strong>
                <p>
                  世界书条目会通过关键词触发，用来补充设定、背景、地点、关系、规则。
                  请不要把它写成普通聊天消息。
                </p>
              </div>

              <label class="memory-field">
                <span>{{ isWorldbookEditor ? '世界书内容' : '内容' }}</span>
                <textarea
                  v-model="editor.content"
                  rows="8"
                  maxlength="8000"
                  :placeholder="isWorldbookEditor
                    ? '写下这个关键词触发时需要注入的世界设定、背景规则或场景信息…'
                    : '写下需要被记住的内容…'"
                ></textarea>
              </label>

              <div class="memory-grid">
                <label class="memory-field">
                  <span>重要度</span>
                  <input
                    v-model.number="editor.importance"
                    type="number"
                    min="0"
                    max="100"
                  />
                </label>

                <label class="memory-field">
                  <span>优先级</span>
                  <input
                    v-model.number="editor.priority"
                    type="number"
                    min="0"
                    max="100"
                  />
                </label>
              </div>

              <label class="memory-field">
                <span>标签，用英文逗号分隔</span>
                <input
                  v-model="editorTagsText"
                  type="text"
                  placeholder="real-user, diary"
                />
              </label>

              <label class="memory-field">
                <span>
                  {{ isWorldbookEditor ? '世界书触发关键词' : '关键词，用英文逗号分隔' }}
                </span>
                <input
                  v-model="editorKeywordsText"
                  type="text"
                  :placeholder="isWorldbookEditor ? '城堡, 血族, 契约' : '关键词1, 关键词2'"
                />
              </label>

              <div class="memory-checks">
                <label>
                  <input v-model="editor.enabled" type="checkbox" />
                  启用
                </label>

                <label>
                  <input v-model="editor.isPermanent" type="checkbox" />
                  永久记忆
                </label>

                <label>
                  <input v-model="editor.isRealUserRelated" type="checkbox" />
                  真实 user 相关
                </label>
              </div>
            </div>

            <footer class="memory-modal-actions">
              <button class="memory-modal-btn secondary" type="button" @click="closeEditor">
                取消
              </button>

              <button
                class="memory-modal-btn primary"
                type="button"
                :disabled="saving || !editor.content.trim()"
                @click="saveMemory"
              >
                {{ saving ? '保存中…' : '保存' }}
              </button>
            </footer>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { db, type MemoryEntry, type ChatSession, type Character } from '@/core/db'
import { saveGlobalPrompt } from '@/apps/chat/services/memoryService'

type MemoryType = MemoryEntry['type']
type MemoryScope = MemoryEntry['scope']

const loading = ref(false)
const saving = ref(false)
const memories = ref<MemoryEntry[]>([])
const sessions = ref<(ChatSession & { character?: Character })[]>([])
const globalPromptText = ref('')
const globalPromptSaving = ref(false)

const keyword = ref('')
const typeFilter = ref<MemoryType | 'all'>('all')
const statusFilter = ref<MemoryEntry['status'] | 'all'>('all')

const showEditor = ref(false)
const editingId = ref<string | null>(null)
const editorTagsText = ref('')
const editorKeywordsText = ref('')

const editor = reactive({
  title: '',
  type: 'custom' as MemoryType,
  scope: 'daily' as MemoryScope,
  sessionId: '',
  characterId: '',
  content: '',
  importance: 50,
  priority: 0,
  enabled: true,
  isPermanent: false,
  isRealUserRelated: false
})

const filteredMemories = computed(() => {
  const q = keyword.value.trim().toLowerCase()

  return memories.value
    .filter(memory => {
      if (typeFilter.value !== 'all' && memory.type !== typeFilter.value) {
        return false
      }

      if (statusFilter.value !== 'all' && memory.status !== statusFilter.value) {
        return false
      }

      if (!q) return true

      const haystack = [
        memory.title,
        memory.content,
        memory.type,
        memory.scope,
        memory.source,
        ...(memory.tags || []),
        ...(memory.keywords || [])
      ]
        .join(' ')
        .toLowerCase()

      return haystack.includes(q)
    })
    .sort((a, b) => {
      const aTime = a.updatedAt || a.createdAt
      const bTime = b.updatedAt || b.createdAt
      return bTime - aTime
    })
})

const isWorldbookEditor = computed(() => editor.type === 'worldbook')

const selectedSession = computed(() => {
  if (!editor.sessionId) return null
  return sessions.value.find(session => session.id === editor.sessionId) || null
})

onMounted(async () => {
  await Promise.all([
    loadMemories(),
    loadSessions(),
    loadGlobalPrompt()
  ])
})

async function loadMemories() {
  loading.value = true

  try {
    memories.value = await db.memoryEntries.toArray()
  } catch (error) {
    console.error('[memory] 读取记忆失败:', error)
  } finally {
    loading.value = false
  }
}

async function loadSessions() {
  try {
    const rawSessions = await db.chatSessions
      .orderBy('lastMessageAt')
      .reverse()
      .toArray()

    const result: (ChatSession & { character?: Character })[] = []

    for (const session of rawSessions) {
      const character = await db.characters.get(session.characterId)
      result.push({
        ...session,
        character
      })
    }

    sessions.value = result
  } catch (error) {
    console.error('[memory] 读取会话列表失败:', error)
  }
}

async function loadGlobalPrompt() {
  try {
    const existing = await db.memoryEntries.get('global-chat-prompt')
    globalPromptText.value = existing?.content || ''
  } catch (error) {
    console.error('[memory] 读取全局提示词失败:', error)
  }
}

async function handleSaveGlobalPrompt() {
  globalPromptSaving.value = true

  try {
    await saveGlobalPrompt(globalPromptText.value)
    await loadMemories()
  } catch (error) {
    console.error('[memory] 保存全局提示词失败:', error)
    window.alert('全局提示词没有保存成功，请稍后再试。')
  } finally {
    globalPromptSaving.value = false
  }
}

function openCreateModal() {
  editingId.value = null

  editor.title = ''
  editor.type = 'custom'
  editor.scope = 'daily'
  editor.sessionId = ''
  editor.characterId = ''
  editor.content = ''
  editor.importance = 50
  editor.priority = 0
  editor.enabled = true
  editor.isPermanent = false
  editor.isRealUserRelated = false
  editorTagsText.value = ''
  editorKeywordsText.value = ''

  showEditor.value = true
}

function openEditModal(memory: MemoryEntry) {
  editingId.value = memory.id

  editor.title = memory.title || ''
  editor.type = memory.type
  editor.scope = memory.scope
  editor.sessionId = memory.sessionId || ''
  editor.characterId = memory.characterId || ''
  editor.content = memory.content
  editor.importance = memory.importance ?? 50
  editor.priority = memory.priority ?? 0
  editor.enabled = memory.enabled !== false
  editor.isPermanent = memory.isPermanent === true
  editor.isRealUserRelated = memory.isRealUserRelated === true
  editorTagsText.value = (memory.tags || []).join(', ')
  editorKeywordsText.value = (memory.keywords || []).join(', ')

  showEditor.value = true
}

function closeEditor() {
  showEditor.value = false
  editingId.value = null
}

function handleEditorSessionChange() {
  if (!editor.sessionId) {
    editor.characterId = ''
    return
  }

  const session = sessions.value.find(item => item.id === editor.sessionId)
  editor.characterId = session?.characterId || ''

  if (session) {
    editor.scope = session.mode
  }
}

function handleEditorTypeChange() {
  if (editor.type === 'worldbook') {
    editor.scope = editor.scope === 'global' ? 'global' : editor.scope
    editor.priority = Math.max(editor.priority, 50)
    editorTagsText.value = normalizeTagsForType('worldbook', splitTextList(editorTagsText.value)).join(', ')
  }

  if (editor.type === 'globalPrompt') {
    editor.scope = 'global'
    editor.sessionId = ''
    editor.characterId = ''
    editor.priority = 100
    editor.isPermanent = true
    editorTagsText.value = normalizeTagsForType('globalPrompt', splitTextList(editorTagsText.value)).join(', ')
  }

  if (editor.type === 'diary') {
    editor.scope = 'daily'
    editor.isRealUserRelated = true
    editorTagsText.value = normalizeTagsForType('diary', splitTextList(editorTagsText.value)).join(', ')
  }

  if (editor.type === 'permanent') {
    editor.isPermanent = true
    editorTagsText.value = normalizeTagsForType('permanent', splitTextList(editorTagsText.value)).join(', ')
  }
}

async function saveMemory() {
  const content = editor.content.trim()
  if (!content) return

  saving.value = true

  const now = Date.now()
  const tags = splitTextList(editorTagsText.value)
  const keywords = splitTextList(editorKeywordsText.value)

  try {
    if (editingId.value) {
      await db.memoryEntries.update(editingId.value, {
        title: editor.title.trim() || defaultTitle(editor.type),
        type: editor.type,
        scope: editor.scope,
        sessionId: editor.sessionId,
        characterId: editor.characterId,
        content,
        importance: clampNumber(editor.importance, 0, 100),
        priority: clampNumber(editor.priority, 0, 100),
        enabled: editor.enabled,
        isPermanent: editor.isPermanent || editor.type === 'permanent',
        isRealUserRelated: editor.isRealUserRelated || editor.type === 'diary',
        tags: normalizeTagsForType(editor.type, tags),
        keywords,
        status: 'saved',
        updatedAt: now
      })
    } else {
      const entry: MemoryEntry = {
        id: crypto.randomUUID(),
        characterId: editor.characterId,
        sessionId: editor.sessionId,
        type: editor.type,
        title: editor.title.trim() || defaultTitle(editor.type),
        content,
        scope: editor.scope,
        isRealUserRelated: editor.isRealUserRelated || editor.type === 'diary',
        isPermanent: editor.isPermanent || editor.type === 'permanent',
        enabled: editor.enabled,
        importance: clampNumber(editor.importance, 0, 100),
        tags: normalizeTagsForType(editor.type, tags),
        keywords,
        priority: clampNumber(editor.priority, 0, 100),
        status: 'saved',
        source: 'user',
        createdAt: now,
        updatedAt: now
      }

      await db.memoryEntries.add(entry)
    }

    closeEditor()
    await loadMemories()
  } catch (error) {
    console.error('[memory] 保存记忆失败:', error)
    window.alert('记忆没有保存成功，请稍后再试。')
  } finally {
    saving.value = false
  }
}

async function toggleEnabled(memory: MemoryEntry) {
  await db.memoryEntries.update(memory.id, {
    enabled: !memory.enabled,
    updatedAt: Date.now()
  })

  await loadMemories()
}

async function markSaved(memory: MemoryEntry) {
  await db.memoryEntries.update(memory.id, {
    status: 'saved',
    updatedAt: Date.now()
  })

  await loadMemories()
}

async function removeMemory(memory: MemoryEntry) {
  const confirmed = window.confirm(`确定删除「${memory.title || '这条记忆'}」吗？此操作无法恢复。`)
  if (!confirmed) return

  await db.memoryEntries.delete(memory.id)
  await loadMemories()
}

function splitTextList(text: string): string[] {
  return text
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

function normalizeTagsForType(type: MemoryType, tags: string[]): string[] {
  const set = new Set(tags)

  if (type === 'diary') {
    set.add('diary')
    set.add('real-user')
  }

  if (type === 'summary') {
    set.add('summary')
  }

  if (type === 'worldbook') {
    set.add('worldbook')
  }

  if (type === 'globalPrompt') {
    set.add('global-prompt')
  }

  if (type === 'permanent') {
    set.add('permanent')
  }

  return [...set]
}

function clampNumber(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min
  return Math.min(max, Math.max(min, value))
}

function defaultTitle(type: MemoryType): string {
  const map: Record<MemoryType, string> = {
    summary: '会话摘要',
    event: '事件',
    diary: '真实 user 日记',
    custom: '自定义记忆',
    permanent: '永久记忆',
    worldbook: '世界书条目',
    globalPrompt: '全局提示词'
  }

  return map[type]
}

function typeLabel(type: MemoryType): string {
  return defaultTitle(type)
}

function scopeLabel(scope: MemoryScope): string {
  const map: Record<MemoryScope, string> = {
    daily: 'daily',
    roleplay: 'RP',
    global: '全局'
  }

  return map[scope]
}

function sourceLabel(source: MemoryEntry['source']): string {
  const map: Record<MemoryEntry['source'], string> = {
    user: '用户',
    ai: 'AI',
    system: '系统'
  }

  return map[source]
}

function sessionLabel(session: ChatSession & { character?: Character }): string {
  const characterName = session.character?.name || session.title || '未知角色'
  const mode = session.mode === 'daily' ? 'daily' : 'RP'
  return `${characterName} · ${mode} · ${formatDate(session.lastMessageAt || session.createdAt)}`
}

function boundSessionName(sessionId: string): string {
  const session = sessions.value.find(item => item.id === sessionId)
  if (!session) return '未知会话'

  return `${session.character?.name || session.title || '未知角色'} · ${session.mode === 'daily' ? 'daily' : 'RP'}`
}

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(timestamp)
}
</script>

<style scoped>
.memory-page {
  min-height: 100%;
  padding: 28px;
  color: rgba(245, 245, 245, 0.86);
}

.memory-header {
  display: flex;
  align-items: flex-start;
  gap: 18px;
  margin-bottom: 22px;
}

.memory-back-btn {
  border: 0;
  background: transparent;
  color: rgba(245, 245, 245, 0.45);
  font-size: 12px;
  cursor: pointer;
}

.memory-back-btn:hover {
  color: rgba(245, 245, 245, 0.8);
}

.memory-title {
  margin: 0;
  font-family: var(--font-gothic, serif);
  font-size: 24px;
  font-weight: 400;
  letter-spacing: 0.12em;
}

.memory-subtitle {
  margin: 8px 0 0;
  font-size: 12px;
  color: rgba(245, 245, 245, 0.42);
}

.memory-toolbar {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) 150px 130px auto;
  gap: 10px;
  margin-bottom: 18px;
}

.memory-search,
.memory-select,
.memory-action-btn {
  height: 36px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  color: rgba(245, 245, 245, 0.86);
  padding: 0 12px;
  outline: none;
}

.memory-search::placeholder {
  color: rgba(245, 245, 245, 0.32);
}

.memory-action-btn {
  cursor: pointer;
  background: rgba(255, 255, 255, 0.08);
}

.memory-action-btn:hover {
  background: rgba(255, 255, 255, 0.12);
}

.global-prompt-panel {
  margin-bottom: 18px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.055), rgba(255, 255, 255, 0.018)),
    rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(18px);
}

.global-prompt-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.global-prompt-title {
  margin: 0;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0.08em;
}

.global-prompt-subtitle {
  margin: 6px 0 0;
  font-size: 11px;
  line-height: 1.6;
  color: rgba(245, 245, 245, 0.42);
}

.global-prompt-textarea {
  width: 100%;
  box-sizing: border-box;
  min-height: 110px;
  padding: 12px;
  resize: vertical;
  border: 1px solid rgba(255, 255, 255, 0.12);
  outline: none;
  color: rgba(245, 245, 245, 0.84);
  background: rgba(0, 0, 0, 0.26);
  font: inherit;
  font-size: 12px;
  line-height: 1.7;
}

.global-prompt-textarea:focus {
  border-color: rgba(255, 255, 255, 0.32);
}

.memory-main {
  display: grid;
  gap: 14px;
}

.memory-empty {
  padding: 36px 0;
  text-align: center;
  color: rgba(245, 245, 245, 0.42);
  font-size: 13px;
}

.memory-card {
  padding: 16px 16px 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(10px);
}

.memory-card.is-disabled {
  opacity: 0.58;
}

.memory-card.is-draft {
  border-color: rgba(255, 210, 120, 0.22);
}

.memory-card-top,
.memory-card-footer {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.memory-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 11px;
}

.memory-type,
.memory-scope,
.memory-status {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(245, 245, 245, 0.72);
}

.memory-status.draft {
  background: rgba(255, 193, 7, 0.18);
  color: rgba(255, 226, 140, 0.95);
}

.memory-status.archived {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(245, 245, 245, 0.45);
}

.memory-status.disabled {
  background: rgba(255, 120, 120, 0.14);
  color: rgba(255, 170, 170, 0.95);
}

.memory-card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: rgba(245, 245, 245, 0.94);
}

.memory-bound-hint,
.memory-bound-line {
  margin: 0;
  font-size: 11px;
  color: rgba(245, 245, 245, 0.36);
}

.memory-bound-line {
  margin-top: 4px;
}

.memory-date {
  flex-shrink: 0;
  color: rgba(245, 245, 245, 0.36);
  font-size: 12px;
}

.memory-content {
  margin: 12px 0 0;
  white-space: pre-wrap;
  line-height: 1.7;
  font-size: 13px;
  color: rgba(245, 245, 245, 0.8);
}

.memory-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.memory-tag {
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 11px;
  background: rgba(255, 255, 255, 0.07);
  color: rgba(245, 245, 245, 0.72);
}

.memory-tag.keyword {
  background: rgba(120, 180, 255, 0.14);
  color: rgba(200, 225, 255, 0.92);
}

.memory-card-footer {
  margin-top: 14px;
  align-items: center;
}

.memory-extra {
  font-size: 11px;
  color: rgba(245, 245, 245, 0.42);
}

.memory-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
}

.memory-text-btn {
  border: 0;
  background: transparent;
  color: rgba(245, 245, 245, 0.7);
  font-size: 12px;
  cursor: pointer;
  padding: 0;
}

.memory-text-btn:hover {
  color: rgba(245, 245, 245, 0.95);
}

.memory-text-btn.danger {
  color: rgba(255, 160, 160, 0.78);
}

.memory-text-btn.danger:hover {
  color: rgba(255, 190, 190, 1);
}

.memory-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.55);
}

.memory-modal {
  width: min(760px, 100%);
  max-height: min(90vh, 920px);
  overflow: auto;
  padding: 18px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 18px;
  background: rgba(22, 22, 28, 0.96);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
}

.memory-modal-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.memory-modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.memory-modal-subtitle {
  margin: 8px 0 0;
  font-size: 12px;
  color: rgba(245, 245, 245, 0.42);
}

.memory-close-btn {
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(245, 245, 245, 0.72);
  cursor: pointer;
  font-size: 22px;
  line-height: 1;
}

.memory-form {
  display: grid;
  gap: 14px;
}

.memory-field {
  display: grid;
  gap: 8px;
  font-size: 12px;
  color: rgba(245, 245, 245, 0.68);
}

.memory-field input,
.memory-field select,
.memory-field textarea {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  color: rgba(245, 245, 245, 0.88);
  outline: none;
  font-size: 13px;
}

.memory-field input,
.memory-field select {
  height: 38px;
  padding: 0 12px;
}

.memory-field textarea {
  padding: 10px;
  resize: vertical;
  line-height: 1.7;
}

.memory-field input:focus,
.memory-field select:focus,
.memory-field textarea:focus {
  border-color: rgba(255, 255, 255, 0.32);
}

.memory-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.memory-checks {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 12px;
  color: rgba(245, 245, 245, 0.58);
}

.worldbook-editor-hint {
  padding: 12px;
  border-left: 1px solid rgba(205, 183, 128, 0.58);
  background: rgba(205, 183, 128, 0.06);
}

.worldbook-editor-hint strong {
  display: block;
  margin-bottom: 5px;
  font-size: 12px;
  color: rgba(225, 204, 147, 0.92);
}

.worldbook-editor-hint p {
  margin: 0;
  font-size: 11px;
  line-height: 1.7;
  color: rgba(245, 245, 245, 0.5);
}

.memory-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
}

.memory-modal-btn {
  min-width: 76px;
  height: 34px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(245, 245, 245, 0.82);
  background: rgba(255, 255, 255, 0.06);
  cursor: pointer;
}

.memory-modal-btn.primary {
  border-color: rgba(255, 255, 255, 0.26);
  background: rgba(255, 255, 255, 0.12);
}

.memory-modal-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 720px) {
  .memory-page {
    padding: 18px;
  }

  .memory-toolbar {
    grid-template-columns: 1fr;
  }

  .global-prompt-header {
    flex-direction: column;
  }

  .memory-card-top,
  .memory-card-footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .memory-actions {
    justify-content: flex-start;
  }

  .memory-grid {
    grid-template-columns: 1fr;
  }
}
</style>

