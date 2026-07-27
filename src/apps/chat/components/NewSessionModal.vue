<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <h3 class="modal-title">新建对话</h3>

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
  v-for="char in characters"
  :key="char.id"
  :class="['char-card', { selected: selectedCharId === char.id }]"
  @click="selectedCharId = char.id"
>
  <button
    class="char-delete-btn"
    type="button"
    title="删除角色"
    @click="handleDeleteCharacter(char.id, $event)"
  >
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="18" y1="6" x2="6" y2="18" stroke-linecap="round"/>
      <line x1="6" y1="6" x2="18" y2="18" stroke-linecap="round"/>
    </svg>
  </button>
  <div class="char-avatar-small">
    <img v-if="char.avatar" :src="char.avatar" alt="" />
    <span v-else>{{ char.name.charAt(0) }}</span>
  </div>
  <span class="char-name-small">{{ char.name }}</span>
</div>

            <div class="char-avatar-small">
              <img v-if="char.avatar" :src="char.avatar" alt="" />
              <span v-else>{{ char.name.charAt(0) }}</span>
            </div>
            <span class="char-name-small">{{ char.name }}</span>
          </div>
        </div>

        <button
          class="confirm-btn"
          type="button"
          :disabled="!selectedCharId || creating"
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
                <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
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
          <label class="form-label">关系阶段 <span class="optional">选填</span></label>
          <input
            v-model="newChar.scenario"
            type="text"
            class="form-input"
            placeholder="例如：刚认识 / 恋人 / 青梅竹马…"
          />
        </div>

        <div class="form-group">
          <label class="form-label">附加设定 <span class="optional">选填</span></label>
          <textarea
            v-model="newChar.additionalSettings"
            class="form-input form-textarea"
            placeholder="其他补充设定…"
            rows="2"
          ></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">第一条消息 <span class="optional">选填</span></label>
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
          :disabled="!newChar.name.trim() || !newChar.personality.trim() || creating"
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
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke-linecap="round" stroke-linejoin="round"/>
              <polyline points="17 8 12 3 7 8" stroke-linecap="round" stroke-linejoin="round"/>
              <line x1="12" y1="3" x2="12" y2="15" stroke-linecap="round" stroke-linejoin="round"/>
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
          <p class="imported-name">
            已导入：{{ importedChar.name }}
          </p>
          <button
            class="confirm-btn"
            type="button"
            :disabled="creating"
            @click="startWithImported"
          >
            {{ creating ? '创建中…' : '开始对话' }}
          </button>
        </div>

        <p v-if="importError" class="form-error">{{ importError }}</p>
      </div>

      <!-- 关闭 -->
      <button class="close-btn" type="button" @click="$emit('close')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <line x1="18" y1="6" x2="6" y2="18" stroke-linecap="round"/>
          <line x1="6" y1="6" x2="18" y2="18" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { db, type Character } from '@/core/db'
import { createCharacter, importCharacterFromJson, getAllCharacters } from '../services/characterService'
import { createSession } from '../services/chatService'

const emit = defineEmits<{
  close: []
  created: [sessionId: string]
}>()

const mode = ref<'select' | 'create' | 'import'>('select')
const creating = ref(false)
const characters = ref<Character[]>([])
const selectedCharId = ref('')
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
  firstMes: ''
})

onMounted(async () => {
  characters.value = await getAllCharacters()

  // 如果没有角色卡，默认显示创建模式
  if (characters.value.length === 0) {
    mode.value = 'create'
  }
})

function triggerUpload() {
  avatarFileInput.value?.click()
}

function handleAvatarUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
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

async function handleJsonImport(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  importError.value = ''
  importedChar.value = null

  try {
    const text = await file.text()
    const character = await importCharacterFromJson(text)
    importedChar.value = character
    characters.value = await getAllCharacters()
  } catch (err: any) {
    importError.value = err.message || '导入失败，请检查文件格式'
  }
}

async function getDefaultPersonaId(): Promise<string> {
  const defaultPersona = await db.personas.where('isDefault').equals(1).first()
  return defaultPersona?.id || ''
}

async function startWithExisting() {
  if (!selectedCharId.value) return
  creating.value = true

  try {
    const personaId = await getDefaultPersonaId()
    const session = await createSession(selectedCharId.value, personaId)
    emit('created', session.id)
  } finally {
    creating.value = false
  }
}

async function createAndStart() {
  if (!newChar.name.trim() || !newChar.personality.trim()) return
  creating.value = true

  try {
    const character = await createCharacter({
      name: newChar.name.trim(),
      avatar: newChar.avatar.trim(),
      personality: newChar.personality.trim(),
      scenario: newChar.scenario.trim(),
      additionalSettings: newChar.additionalSettings.trim(),
      firstMes: newChar.firstMes.trim()
    })

    const personaId = await getDefaultPersonaId()
    const session = await createSession(character.id, personaId)
    emit('created', session.id)
  } finally {
    creating.value = false
  }
}

async function startWithImported() {
  if (!importedChar.value) return
  creating.value = true

  try {
    const personaId = await getDefaultPersonaId()
    const session = await createSession(importedChar.value.id, personaId)
    emit('created', session.id)
  } finally {
    creating.value = false
  }
}

async function handleDeleteCharacter(id: string, e: Event) {
  e.stopPropagation()

  const char = characters.value.find(c => c.id === id)
  if (!char) return

  if (!window.confirm(`确定删除角色「${char.name}」吗？相关对话不会被删除。`)) return

  await db.characters.delete(id)
  characters.value = await getAllCharacters()

  if (selectedCharId.value === id) {
    selectedCharId.value = ''
  }
}

</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
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
  font-family: 'Cinzel', 'Noto Serif SC', serif;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
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
  background: transparent;
  border: none;
  border-radius: 8px;
  color: rgba(245, 245, 245, 0.5);
  cursor: pointer;
  transition: color 0.2s;
}

.close-btn:hover {
  color: rgba(245, 245, 245, 0.9);
}

/* Mode tabs */
.mode-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 20px;
  padding: 4px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
}

.mode-tab {
  flex: 1;
  padding: 9px 12px;
  font-family: inherit;
  font-size: 13px;
  color: rgba(245, 245, 245, 0.5);
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mode-tab.active {
  color: rgba(245, 245, 245, 0.95);
  background: rgba(255, 255, 255, 0.08);
}

.mode-tab:hover:not(.active) {
  color: rgba(245, 245, 245, 0.7);
}

/* Panel */
.mode-panel {
  min-height: 200px;
}

/* Character grid */
.char-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
  margin-bottom: 20px;
  max-height: 240px;
  overflow-y: auto;
}

.char-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 8px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.char-card:hover {
  border-color: rgba(255, 255, 255, 0.15);
}

.char-card.selected {
  border-color: rgba(245, 245, 245, 0.5);
  background: rgba(255, 255, 255, 0.06);
}

.char-avatar-small {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Cinzel', serif;
  font-size: 16px;
  color: rgba(245, 245, 245, 0.5);
}

.char-avatar-small img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.char-name-small {
  font-size: 12px;
  color: rgba(245, 245, 245, 0.7);
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.empty-chars {
  text-align: center;
  padding: 40px 0;
  color: rgba(245, 245, 245, 0.4);
  font-size: 14px;
}

/* Form */
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
  resize: vertical;
  min-height: 60px;
}

.form-error {
  margin-top: 8px;
  font-size: 13px;
  color: #e57373;
}

/* Avatar input */
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
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-btn-small.active {
  color: rgba(245, 245, 245, 0.95);
  border-color: rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.06);
}

.avatar-upload-area {
  display: flex;
  align-items: center;
  gap: 8px;
}

.avatar-preview-small {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
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

/* File drop */
.file-drop-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 30px;
  border: 1px dashed rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.file-drop-area:hover {
  border-color: rgba(255, 255, 255, 0.3);
}

.file-drop-area p {
  font-size: 13px;
  color: rgba(245, 245, 245, 0.5);
}

/* Import preview */
.imported-preview {
  margin-top: 16px;
  padding: 14px;
  background: rgba(129, 199, 132, 0.08);
  border: 1px solid rgba(129, 199, 132, 0.2);
  border-radius: 10px;
}

.imported-name {
  font-size: 14px;
  margin-bottom: 12px;
  color: rgba(245, 245, 245, 0.8);
}

/* Confirm button */
.confirm-btn {
  width: 100%;
  padding: 12px;
  margin-top: 8px;
  font-family: inherit;
  font-size: 14px;
  color: #080808;
  background: rgba(245, 245, 245, 0.92);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.confirm-btn:hover:not(:disabled) {
  background: #fff;
}

.confirm-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Modal transition */
.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.2s ease;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.95);
}
.char-card {
  position: relative;
}

.char-delete-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  border: none;
  border-radius: 50%;
  color: rgba(245, 245, 245, 0.5);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s, color 0.2s;
}

.char-card:hover .char-delete-btn {
  opacity: 1;
}

.char-delete-btn:hover {
  color: #e57373;
}

</style>
