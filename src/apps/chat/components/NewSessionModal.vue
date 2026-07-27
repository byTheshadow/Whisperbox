<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <h3 class="modal-title">新建对话</h3>

      <!-- 会话设置：无论选择、新建或导入角色，都会使用此设置 -->
      <div class="session-setup">
        <div class="setup-section">
          <span class="setup-label">对话模式</span>

          <div class="chat-mode-selector">
            <button
              type="button"
              :class="['chat-mode-card', { active: sessionMode === 'daily' }]"
              @click="selectSessionMode('daily')"
            >
              <span class="chat-mode-title">日常模式</span>
              <span class="chat-mode-description">
                短对话、真实陪伴，并记录与真实 user 有关的日记。
              </span>
            </button>

            <button
              type="button"
              :class="['chat-mode-card', { active: sessionMode === 'roleplay' }]"
              @click="selectSessionMode('roleplay')"
            >
              <span class="chat-mode-title">RP 模式</span>
              <span class="chat-mode-description">
                长篇角色扮演，不记录真实 user 的日记。
              </span>
            </button>
          </div>
        </div>

        <div class="setup-section">
          <div class="setup-label-row">
            <span class="setup-label">
              {{ sessionMode === 'daily' ? '真实 user 身份' : '你使用的人设' }}
            </span>

            <span v-if="sessionMode === 'daily'" class="setup-note">
              日常模式固定使用真实 user
            </span>
          </div>

          <div v-if="availablePersonas.length === 0" class="persona-empty">
            尚未创建用户身份，请先前往「设置」创建。
          </div>

          <div v-else class="persona-list">
            <button
              v-for="persona in availablePersonas"
              :key="persona.id"
              type="button"
              :class="['persona-option', { selected: selectedPersonaId === persona.id }]"
              @click="selectedPersonaId = persona.id"
            >
              <div class="persona-avatar">
                <img v-if="persona.avatar" :src="persona.avatar" alt="" />
                <span v-else>{{ persona.name.charAt(0) || '?' }}</span>
              </div>

              <div class="persona-info">
                <span class="persona-name">{{ persona.name }}</span>
                <span class="persona-description">
                  {{ persona.isRealUser ? '真实 user' : (persona.description || '角色扮演身份') }}
                </span>
              </div>

              <span v-if="selectedPersonaId === persona.id" class="persona-selected-mark">
                ✓
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- 模式切换 -->
      <div class="mode-tabs">
        <button
          :class="['mode-tab', { active: mode === 'select' }]"
          type="button"
          @click="mode = 'select'"
        >
          选择角色
        </button>
        <button
          :class="['mode-tab', { active: mode === 'create' }]"
          type="button"
          @click="mode = 'create'"
        >
          新建角色
        </button>
        <button
          :class="['mode-tab', { active: mode === 'import' }]"
          type="button"
          @click="mode = 'import'"
        >
          导入 JSON
        </button>
      </div>

      <!-- 选择已有角色 -->
      <div v-if="mode === 'select'" class="mode-panel">
        <div v-if="characters.length === 0" class="empty-chars">
          <p>暂无角色卡，请先创建或导入</p>
        </div>

        <div v-else class="char-grid">
          <div
            v-for="item in characters"
            :key="item.id"
            :class="['char-card', { selected: selectedCharId === item.id }]"
            @click="selectedCharId = item.id"
          >
            <button
              class="char-delete-btn"
              type="button"
              title="删除角色"
              @click.stop="handleDeleteCharacter(item.id)"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" stroke-linecap="round" />
                <line x1="6" y1="6" x2="18" y2="18" stroke-linecap="round" />
              </svg>
            </button>

            <div class="char-avatar-small">
              <img v-if="item.avatar" :src="item.avatar" alt="" />
              <span v-else>{{ item.name ? item.name.charAt(0) : '?' }}</span>
            </div>

            <span class="char-name-small">{{ item.name }}</span>
          </div>
        </div>

        <button
          class="confirm-btn"
          type="button"
          :disabled="!selectedCharId || !selectedPersonaId || creating"
          @click="startWithExisting"
        >
          {{ creating ? '创建中…' : '开始对话' }}
        </button>
      </div>

      <!-- 新建角色 -->
      <div v-if="mode === 'create'" class="mode-panel">
        <div class="form-group">
          <label class="form-label">角色名称 *</label>
          <input
            v-model="newChar.name"
            type="text"
            class="form-input"
            placeholder="输入角色名称"
          />
        </div>

        <div class="form-group">
          <label class="form-label">头像</label>
          <div class="avatar-input-row">
            <div class="avatar-mode-switch">
              <button
                type="button"
                :class="['mode-btn-small', { active: avatarMode === 'upload' }]"
                @click="avatarMode = 'upload'"
              >
                上传
              </button>
              <button
                type="button"
                :class="['mode-btn-small', { active: avatarMode === 'url' }]"
                @click="avatarMode = 'url'"
              >
                URL
              </button>
            </div>

            <div v-if="avatarMode === 'upload'" class="avatar-upload-area">
              <div class="avatar-preview-small" @click="triggerUpload">
                <img v-if="newChar.avatar" :src="newChar.avatar" alt="" />
                <svg
                  v-else
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  opacity="0.4"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>

              <input
                ref="avatarFileInput"
                type="file"
                accept="image/*"
                class="hidden-input"
                @change="handleAvatarUpload"
              />
            </div>

            <div v-else class="avatar-url-input">
              <input
                v-model="newChar.avatar"
                type="text"
                class="form-input"
                placeholder="https://..."
              />
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">性格描述 *</label>
          <textarea
            v-model="newChar.personality"
            class="form-input form-textarea"
            placeholder="描述角色的性格特点、说话方式…"
            rows="3"
          ></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">
            关系阶段 <span class="optional">选填</span>
          </label>
          <input
            v-model="newChar.scenario"
            type="text"
            class="form-input"
            placeholder="例如：刚认识 / 恋人 / 青梅竹马…"
          />
        </div>

        <div class="form-group">
          <label class="form-label">
            附加设定 <span class="optional">选填</span>
          </label>
          <textarea
            v-model="newChar.additionalSettings"
            class="form-input form-textarea"
            placeholder="其他补充设定…"
            rows="2"
          ></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">
            世界书内容 <span class="optional">选填</span>
          </label>
          <textarea
            v-model="newChar.worldBookContent"
            class="form-input form-textarea"
            placeholder="这个角色单独使用的世界设定、背景知识、触发规则等…"
            rows="3"
          ></textarea>
          <p class="form-hint">目前会保存为角色附加设定的一部分，后续可迁移到独立世界书。</p>
        </div>

        <div class="form-group">
          <label class="form-label">
            第一条消息 <span class="optional">选填</span>
          </label>
          <textarea
            v-model="newChar.firstMes"
            class="form-input form-textarea"
            placeholder="角色的开场白…"
            rows="2"
          ></textarea>
        </div>

        <button
          class="confirm-btn"
          type="button"
          :disabled="
            !newChar.name.trim() ||
            !newChar.personality.trim() ||
            !selectedPersonaId ||
            creating
          "
          @click="createAndStart"
        >
          {{ creating ? '创建中…' : '创建角色并开始对话' }}
        </button>
      </div>

      <!-- 导入 JSON -->
      <div v-if="mode === 'import'" class="mode-panel">
        <div class="form-group">
          <label class="form-label">选择 SillyTavern V2 角色卡 JSON 文件</label>
          <div class="file-drop-area" @click="triggerJsonUpload">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              opacity="0.4"
            >
              <path
                d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <polyline
                points="17 8 12 3 7 8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <line
                x1="12"
                y1="3"
                x2="12"
                y2="15"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <p>点击选择文件</p>
          </div>

          <input
            ref="jsonFileInput"
            type="file"
            accept=".json"
            class="hidden-input"
            @change="handleJsonImport"
          />
        </div>

        <div v-if="importedChar" class="imported-preview">
          <p class="imported-name">已导入：{{ importedChar.name }}</p>

          <button
            class="confirm-btn"
            type="button"
            :disabled="!selectedPersonaId || creating"
            @click="startWithImported"
          >
            {{ creating ? '创建中…' : '开始对话' }}
          </button>
        </div>

        <p v-if="importError" class="form-error">{{ importError }}</p>
      </div>

      <!-- 关闭 -->
      <button class="close-btn" type="button" @click="$emit('close')">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <line x1="18" y1="6" x2="6" y2="18" stroke-linecap="round" />
          <line x1="6" y1="6" x2="18" y2="18" stroke-linecap="round" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { db, type Character, type Persona } from '@/core/db'
import {
  createCharacter,
  getAllCharacters,
  importCharacterFromJson
} from '../services/characterService'
import { createSession } from '../services/chatService'

const emit = defineEmits<{
  close: []
  created: [sessionId: string]
}>()

const mode = ref<'select' | 'create' | 'import'>('select')
const creating = ref(false)

const characters = ref<Character[]>([])
const personas = ref<Persona[]>([])

const selectedCharId = ref('')
const selectedPersonaId = ref('')
const sessionMode = ref<'daily' | 'roleplay'>('daily')

const importedChar = ref<Character | null>(null)
const importError = ref('')
const avatarMode = ref<'upload' | 'url'>('upload')
const avatarFileInput = ref<HTMLInputElement | null>(null)
const jsonFileInput = ref<HTMLInputElement | null>(null)

const newChar = reactive({
  name: '',
  avatar: '',
  personality: '',
  scenario: '',
  additionalSettings: '',
  worldBookContent: '',
  firstMes: ''
})

/**
 * 日常模式只能使用真实 user 身份。
 * RP 模式可使用全部人设，包括真实身份或专门创建的 RP 人设。
 */
const availablePersonas = computed(() => {
  if (sessionMode.value === 'daily') {
    return personas.value.filter(persona => persona.isRealUser)
  }

  return personas.value
})

onMounted(async () => {
  await Promise.all([
    loadCharacters(),
    loadPersonas()
  ])

  if (characters.value.length === 0) {
    mode.value = 'create'
  }
})

async function loadCharacters() {
  characters.value = await getAllCharacters()
}

async function loadPersonas() {
  personas.value = await db.personas
    .orderBy('createdAt')
    .reverse()
    .toArray()

  syncPersonaForCurrentMode()
}

/**
 * 切换模式时重新保证当前选择的人设有效。
 *
 * - daily：优先选真实 user
 * - roleplay：保留当前选择；若没有则优先默认人设
 */
function selectSessionMode(nextMode: 'daily' | 'roleplay') {
  sessionMode.value = nextMode
  syncPersonaForCurrentMode()
}

function syncPersonaForCurrentMode() {
  const options = sessionMode.value === 'daily'
    ? personas.value.filter(persona => persona.isRealUser)
    : personas.value

  if (options.some(persona => persona.id === selectedPersonaId.value)) {
    return
  }

  const defaultPersona = options.find(persona => persona.isDefault)
  const realUserPersona = options.find(persona => persona.isRealUser)

  selectedPersonaId.value = (
    defaultPersona?.id ||
    realUserPersona?.id ||
    options[0]?.id ||
    ''
  )
}

function triggerUpload() {
  avatarFileInput.value?.click()
}

function handleAvatarUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]

  if (!file) return

  const reader = new FileReader()

  reader.onload = () => {
    newChar.avatar = reader.result as string
  }

  reader.readAsDataURL(file)
}

function triggerJsonUpload() {
  jsonFileInput.value?.click()
}

async function handleJsonImport(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]

  if (!file) return

  importError.value = ''
  importedChar.value = null

  try {
    const text = await file.text()
    const character = await importCharacterFromJson(text)

    importedChar.value = character
    await loadCharacters()
  } catch (error) {
    importError.value = error instanceof Error
      ? error.message
      : '导入失败，请检查文件格式'
  }
}

/**
 * 统一创建会话。
 * 所有入口（已有角色、新角色、导入角色）都走这里，
 * 保证 persona 和 daily / roleplay 模式不会漏传。
 */
async function startSession(characterId: string) {
  if (!selectedPersonaId.value) {
    throw new Error(
      sessionMode.value === 'daily'
        ? '日常模式需要先在设置中创建真实 user 身份'
        : '请先在设置中创建或选择一个用户人设'
    )
  }

  return createSession(
    characterId,
    selectedPersonaId.value,
    sessionMode.value
  )
}

async function startWithExisting() {
  if (!selectedCharId.value || !selectedPersonaId.value) return

  creating.value = true

  try {
    const session = await startSession(selectedCharId.value)
    emit('created', session.id)
  } catch (error) {
    window.alert(error instanceof Error ? error.message : '创建对话失败')
  } finally {
    creating.value = false
  }
}

async function createAndStart() {
  if (
    !newChar.name.trim() ||
    !newChar.personality.trim() ||
    !selectedPersonaId.value
  ) {
    return
  }

  creating.value = true

  try {
    const mergedAdditionalSettings = [
      newChar.additionalSettings.trim(),
      newChar.worldBookContent.trim()
        ? `[世界书内容]\n${newChar.worldBookContent.trim()}`
        : ''
    ]
      .filter(Boolean)
      .join('\n\n')

    const character = await createCharacter({
      name: newChar.name.trim(),
      avatar: newChar.avatar.trim(),
      personality: newChar.personality.trim(),
      scenario: newChar.scenario.trim(),
      additionalSettings: mergedAdditionalSettings,
      firstMes: newChar.firstMes.trim()
    })

    const session = await startSession(character.id)
    emit('created', session.id)
  } catch (error) {
    window.alert(error instanceof Error ? error.message : '创建对话失败')
  } finally {
    creating.value = false
  }
}

async function startWithImported() {
  if (!importedChar.value || !selectedPersonaId.value) return

  creating.value = true

  try {
    const session = await startSession(importedChar.value.id)
    emit('created', session.id)
  } catch (error) {
    window.alert(error instanceof Error ? error.message : '创建对话失败')
  } finally {
    creating.value = false
  }
}

async function handleDeleteCharacter(id: string) {
  const character = characters.value.find(item => item.id === id)

  if (!character) return

  const confirmed = window.confirm(
    `确定删除角色「${character.name}」吗？相关对话不会被删除。`
  )

  if (!confirmed) return

  await db.characters.delete(id)
  await loadCharacters()

  if (selectedCharId.value === id) {
    selectedCharId.value = ''
  }

  if (characters.value.length === 0) {
    mode.value = 'create'
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
}

.modal-content {
  position: relative;
  width: 100%;
  max-width: 480px;
  max-height: 85vh;
  overflow-y: auto;
  padding: 28px;
  background: #1c1c1e;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
}

.modal-title {
  margin-bottom: 20px;
  font-family: 'Cinzel', 'Noto Serif SC', serif;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: rgba(245, 245, 245, 0.5);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 8px;
  transition: color 0.2s;
}

.close-btn:hover {
  color: rgba(245, 245, 245, 0.9);
}

.mode-tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  margin-bottom: 20px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
}

.mode-tab {
  flex: 1;
  padding: 9px 12px;
  font-family: inherit;
  font-size: 13px;
  color: rgba(245, 245, 245, 0.5);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.mode-tab.active {
  color: rgba(245, 245, 245, 0.95);
  background: rgba(255, 255, 255, 0.08);
}

.mode-tab:hover:not(.active) {
  color: rgba(245, 245, 245, 0.7);
}

.mode-panel {
  min-height: 200px;
}

.mode-toggle {
  display: flex;
  gap: 8px;
}

.char-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
  max-height: 240px;
  margin-bottom: 20px;
  overflow-y: auto;
}

.char-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 8px;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  transition: all 0.2s ease;
}

.char-card:hover {
  border-color: rgba(255, 255, 255, 0.15);
}

.char-card.selected {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(245, 245, 245, 0.5);
}

.char-delete-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: rgba(245, 245, 245, 0.5);
  cursor: pointer;
  opacity: 0;
  background: rgba(0, 0, 0, 0.6);
  border: none;
  border-radius: 50%;
  transition: opacity 0.2s, color 0.2s;
}

.char-card:hover .char-delete-btn {
  opacity: 1;
}

.char-delete-btn:hover {
  color: #e57373;
}

.char-avatar-small {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  overflow: hidden;
  font-family: 'Cinzel', serif;
  font-size: 16px;
  color: rgba(245, 245, 245, 0.5);
  background: rgba(255, 255, 255, 0.05);
  border-radius: 50%;
}

.char-avatar-small img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.char-name-small {
  max-width: 100%;
  overflow: hidden;
  font-size: 12px;
  color: rgba(245, 245, 245, 0.7);
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-chars {
  padding: 40px 0;
  font-size: 14px;
  color: rgba(245, 245, 245, 0.4);
  text-align: center;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 500;
  color: rgba(245, 245, 245, 0.7);
}

.optional {
  font-weight: 400;
  color: rgba(245, 245, 245, 0.35);
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
  transition: border-color 0.2s ease;
}

.form-input:focus {
  border-color: rgba(255, 255, 255, 0.25);
}

.form-input::placeholder {
  color: rgba(245, 245, 245, 0.3);
}

.form-textarea {
  min-height: 60px;
  resize: vertical;
}

.form-hint {
  margin-top: 6px;
  font-size: 12px;
  color: rgba(245, 245, 245, 0.35);
}

.form-error {
  margin-top: 8px;
  font-size: 13px;
  color: #e57373;
}

.avatar-input-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.avatar-mode-switch {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mode-btn-small {
  padding: 6px 10px;
  font-family: inherit;
  font-size: 12px;
  color: rgba(245, 245, 245, 0.5);
  cursor: pointer;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  transition: all 0.2s;
}

.mode-btn-small.active {
  color: rgba(245, 245, 245, 0.95);
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.3);
}

.avatar-upload-area {
  display: flex;
  align-items: center;
  gap: 8px;
}

.avatar-preview-small {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  overflow: hidden;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  transition: border-color 0.2s;
}

.avatar-preview-small:hover {
  border-color: rgba(255, 255, 255, 0.25);
}

.avatar-preview-small img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-url-input {
  flex: 1;
}

.hidden-input {
  display: none;
}

.file-drop-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 30px;
  cursor: pointer;
  border: 1px dashed rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  transition: border-color 0.2s;
}

.file-drop-area:hover {
  border-color: rgba(255, 255, 255, 0.3);
}

.file-drop-area p {
  font-size: 13px;
  color: rgba(245, 245, 245, 0.5);
}

.imported-preview {
  padding: 14px;
  margin-top: 16px;
  background: rgba(129, 199, 132, 0.08);
  border: 1px solid rgba(129, 199, 132, 0.2);
  border-radius: 10px;
}

.imported-name {
  margin-bottom: 12px;
  font-size: 14px;
  color: rgba(245, 245, 245, 0.8);
}

.confirm-btn {
  width: 100%;
  padding: 12px;
  margin-top: 8px;
  font-family: inherit;
  font-size: 14px;
  color: #080808;
  cursor: pointer;
  background: rgba(245, 245, 245, 0.92);
  border: none;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.confirm-btn:hover:not(:disabled) {
  background: #fff;
}

.confirm-btn:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

/* 会话前置设置 */
.session-setup {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin: 4px 0 20px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 12px;
}

.setup-section {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.setup-label-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.setup-label {
  font-size: 13px;
  color: rgba(245, 245, 245, 0.78);
}

.setup-note {
  font-size: 11px;
  color: rgba(245, 245, 245, 0.36);
}

/* daily / roleplay */
.chat-mode-selector {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.chat-mode-card {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-height: 82px;
  padding: 11px;
  color: rgba(245, 245, 245, 0.58);
  text-align: left;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 9px;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.chat-mode-card:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.16);
}

.chat-mode-card.active {
  color: rgba(245, 245, 245, 0.92);
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.38);
}

.chat-mode-title {
  font-size: 14px;
  font-weight: 500;
}

.chat-mode-description {
  font-size: 11px;
  line-height: 1.45;
  opacity: 0.62;
}

/* Persona */
.persona-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 180px;
  overflow-y: auto;
}

.persona-option {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 10px;
  padding: 8px 10px;
  color: rgba(245, 245, 245, 0.72);
  text-align: left;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.persona-option:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.14);
}

.persona-option.selected {
  color: rgba(245, 245, 245, 0.95);
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.35);
}

.persona-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  overflow: hidden;
  color: rgba(245, 245, 245, 0.55);
  background: rgba(255, 255, 255, 0.06);
  border-radius: 50%;
  flex-shrink: 0;
}

.persona-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.persona-info {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.persona-name {
  overflow: hidden;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.persona-description {
  overflow: hidden;
  font-size: 11px;
  color: rgba(245, 245, 245, 0.4);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.persona-selected-mark {
  font-size: 15px;
  color: rgba(245, 245, 245, 0.85);
}

.persona-empty {
  padding: 10px;
  font-size: 12px;
  line-height: 1.5;
  color: rgba(245, 245, 245, 0.4);
  background: rgba(255, 255, 255, 0.025);
  border: 1px dashed rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}
</style>
