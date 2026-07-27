<template>
  <div class="persona-settings">
    <h2 class="section-title">用户身份</h2>
    <p class="section-desc">管理你的真实身份与角色扮演身份</p>

    <!-- 真实身份 -->
    <div class="persona-section">
      <div class="persona-section-header">
        <h3 class="persona-section-title">真实身份</h3>
        <span class="persona-section-hint">AI 用来认识真实的你</span>
      </div>

      <div v-if="realUserPersona" class="persona-card real-user">
        <div class="persona-avatar" @click="editPersona(realUserPersona)">
          <img v-if="realUserPersona.avatar" :src="realUserPersona.avatar" alt="" />
          <span v-else class="avatar-placeholder">{{ realUserPersona.name.charAt(0) }}</span>
        </div>
        <div class="persona-info">
          <div class="persona-name">{{ realUserPersona.name }}</div>
          <div class="persona-desc">{{ realUserPersona.description || '暂无描述' }}</div>
        </div>
        <button class="persona-edit-btn" type="button" @click="editPersona(realUserPersona)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <button v-else class="add-persona-btn" type="button" @click="createPersona(true)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <line x1="12" y1="5" x2="12" y2="19" stroke-linecap="round"/>
          <line x1="5" y1="12" x2="19" y2="12" stroke-linecap="round"/>
        </svg>
        <span>创建真实身份</span>
      </button>
    </div>

    <!-- 角色扮演身份 -->
    <div class="persona-section">
      <div class="persona-section-header">
        <h3 class="persona-section-title">角色扮演身份</h3>
        <span class="persona-section-hint">与 AI 角色对话时使用</span>
      </div>

      <div class="persona-list">
        <div
          v-for="persona in roleplayPersonas"
          :key="persona.id"
          :class="['persona-card', { default: persona.isDefault }]"
        >
          <div class="persona-avatar" @click="editPersona(persona)">
            <img v-if="persona.avatar" :src="persona.avatar" alt="" />
            <span v-else class="avatar-placeholder">{{ persona.name.charAt(0) }}</span>
          </div>

          <div class="persona-info">
            <div class="persona-name">
              {{ persona.name }}
              <span v-if="persona.isDefault" class="default-badge">默认</span>
            </div>
            <div class="persona-desc">{{ persona.description || '暂无描述' }}</div>
          </div>

          <div class="persona-actions">
            <button
              v-if="!persona.isDefault"
              class="persona-action-btn"
              type="button"
              title="设为默认"
              @click="setDefault(persona.id)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke-linecap="round" stroke-linejoin="round"/>
                <polyline points="22 4 12 14.01 9 11.01" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>

            <button class="persona-action-btn" type="button" title="编辑" @click="editPersona(persona)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>

            <button class="persona-action-btn danger" type="button" title="删除" @click="deletePersona(persona.id)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <polyline points="3 6 5 6 21 6" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        <button class="add-persona-btn" type="button" @click="createPersona(false)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <line x1="12" y1="5" x2="12" y2="19" stroke-linecap="round"/>
            <line x1="5" y1="12" x2="19" y2="12" stroke-linecap="round"/>
          </svg>
          <span>新建角色扮演身份</span>
        </button>
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
          <div class="modal-content">
            <h3 class="modal-title">{{ editingPersona?.id ? '编辑身份' : '新建身份' }}</h3>

            <div class="form-group">
              <label class="form-label">名称</label>
              <input
                v-model="editForm.name"
                type="text"
                class="form-input"
                placeholder="输入名称"
              />
            </div>

            <div class="form-group">
              <label class="form-label">身份类型</label>
              <div class="type-switch">
                <button
                  type="button"
                  class="mode-btn"
                  :class="{ active: editForm.isRealUser }"
                  @click="editForm.isRealUser = true"
                >
                  真实身份
                </button>
                <button
                  type="button"
                  class="mode-btn"
                  :class="{ active: !editForm.isRealUser }"
                  @click="editForm.isRealUser = false"
                >
                  角色扮演身份
                </button>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">头像</label>

              <div class="avatar-mode-switch">
                <button
                  type="button"
                  class="mode-btn"
                  :class="{ active: avatarMode === 'upload' }"
                  @click="avatarMode = 'upload'"
                >
                  上传
                </button>
                <button
                  type="button"
                  class="mode-btn"
                  :class="{ active: avatarMode === 'url' }"
                  @click="avatarMode = 'url'"
                >
                  URL
                </button>
              </div>

              <div v-if="avatarMode === 'upload'" class="avatar-upload">
                <div class="avatar-preview" @click="triggerAvatarUpload">
                  <img v-if="editForm.avatar" :src="editForm.avatar" alt="" />
                  <span v-else class="avatar-placeholder-large">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke-linecap="round" stroke-linejoin="round"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </span>
                </div>

                <input
                  ref="avatarInput"
                  type="file"
                  accept="image/*"
                  class="hidden-input"
                  @change="handleAvatarChange"
                />

                <button v-if="editForm.avatar" class="clear-avatar-btn" type="button" @click="editForm.avatar = ''">
                  清除
                </button>
              </div>

              <div v-else class="url-input-wrap">
                <input
                  v-model="editForm.avatar"
                  type="text"
                  class="form-input"
                  placeholder="输入头像图片 URL"
                />
                <p class="form-hint">支持 http / https 图片地址</p>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">描述</label>
              <textarea
                v-model="editForm.description"
                class="form-input form-textarea"
                placeholder="描述这个身份的背景、性格、设定..."
                rows="4"
              ></textarea>
              <p class="form-hint">
                {{ editForm.isRealUser ? '让 AI 了解真实的你：兴趣爱好、性格特点、生活状态等' : '角色扮演时的人设：身份、背景、与 AI 角色的关系等' }}
              </p>
            </div>

            <div class="modal-actions">
              <button class="modal-btn secondary" type="button" @click="closeModal">
                取消
              </button>
              <button
                class="modal-btn primary"
                type="button"
                :disabled="!editForm.name.trim() || saving"
                @click="savePersona"
              >
                {{ saving ? '保存中...' : '保存身份' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { db, type Persona } from '@/core/db'

const personas = ref<Persona[]>([])
const showModal = ref(false)
const editingPersona = ref<Persona | null>(null)
const avatarInput = ref<HTMLInputElement | null>(null)
const saving = ref(false)
const avatarMode = ref<'upload' | 'url'>('upload')

const editForm = reactive({
  name: '',
  avatar: '',
  description: '',
  isRealUser: false
})

const realUserPersona = computed(() => personas.value.find(p => p.isRealUser))
const roleplayPersonas = computed(() => personas.value.filter(p => !p.isRealUser))

onMounted(async () => {
  await loadPersonas()
})

async function loadPersonas() {
  personas.value = await db.personas.toArray()
}

function detectAvatarMode(avatar: string) {
  if (!avatar) return 'upload'
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) return 'url'
  return 'upload'
}

function createPersona(isRealUser: boolean) {
  editingPersona.value = null
  editForm.name = ''
  editForm.avatar = ''
  editForm.description = ''
  editForm.isRealUser = isRealUser
  avatarMode.value = 'upload'
  showModal.value = true
}

function editPersona(persona: Persona) {
  editingPersona.value = persona
  editForm.name = persona.name
  editForm.avatar = persona.avatar
  editForm.description = persona.description
  editForm.isRealUser = persona.isRealUser
  avatarMode.value = detectAvatarMode(persona.avatar)
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingPersona.value = null
}

function triggerAvatarUpload() {
  avatarInput.value?.click()
}

function handleAvatarChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    editForm.avatar = reader.result as string
  }
  reader.readAsDataURL(file)
}

async function savePersona() {
  if (!editForm.name.trim()) return

  saving.value = true
  try {
    const now = Date.now()

    if (editingPersona.value) {
      await db.personas.update(editingPersona.value.id, {
        name: editForm.name.trim(),
        avatar: editForm.avatar.trim(),
        description: editForm.description.trim(),
        isRealUser: editForm.isRealUser
      })
    } else {
      const isFirstRoleplay = !editForm.isRealUser && roleplayPersonas.value.length === 0

      await db.personas.add({
        id: crypto.randomUUID(),
        name: editForm.name.trim(),
        avatar: editForm.avatar.trim(),
        description: editForm.description.trim(),
        isDefault: isFirstRoleplay,
        isRealUser: editForm.isRealUser,
        createdAt: now
      })
    }

    await loadPersonas()
    closeModal()
  } catch (e) {
    console.error('保存身份失败:', e)
  } finally {
    saving.value = false
  }
}

async function setDefault(id: string) {
  const allRoleplay = personas.value.filter(p => !p.isRealUser)

  for (const p of allRoleplay) {
    if (p.isDefault) {
      await db.personas.update(p.id, { isDefault: false })
    }
  }

  await db.personas.update(id, { isDefault: true })
  await loadPersonas()
}

async function deletePersona(id: string) {
  const persona = personas.value.find(item => item.id === id)

  if (!persona) {
    return
  }

  const confirmed = window.confirm(
    `确定删除身份「${persona.name}」吗？此操作无法撤销。`
  )

  if (!confirmed) {
    return
  }

  try {
    // 若删除的是默认角色扮演身份：
    // 先将另一个角色扮演身份设为默认；若没有其他身份，则允许直接删除。
    if (!persona.isRealUser && persona.isDefault) {
      const replacement = personas.value.find(
        item => !item.isRealUser && item.id !== persona.id
      )

      if (replacement) {
        await db.personas.update(replacement.id, {
          isDefault: true
        })
      }
    }

    await db.personas.delete(id)
    await loadPersonas()
  } catch (error) {
    console.error('删除身份失败：', error)
    window.alert('删除失败，请查看控制台错误信息。')
  }
}

</script>

<style scoped>
.persona-settings {
  padding: 24px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
}

.section-title {
  font-family: 'Cinzel', 'Noto Serif SC', serif;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.03em;
  margin-bottom: 6px;
}

.section-desc {
  font-size: 14px;
  color: rgba(245, 245, 245, 0.5);
  margin-bottom: 28px;
}

.persona-section {
  margin-bottom: 32px;
}

.persona-section-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.persona-section-title {
  font-size: 14px;
  font-weight: 500;
  color: rgba(245, 245, 245, 0.8);
}

.persona-section-hint {
  font-size: 12px;
  color: rgba(245, 245, 245, 0.4);
}

.persona-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.persona-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  transition: border-color 0.2s ease;
}

.persona-card:hover {
  border-color: rgba(255, 255, 255, 0.15);
}

.persona-card.real-user {
  background: rgba(139, 92, 246, 0.08);
  border-color: rgba(139, 92, 246, 0.2);
}

.persona-card.default {
  border-color: rgba(129, 199, 132, 0.3);
}

.persona-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
  flex-shrink: 0;
}

.persona-avatar img {
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
  font-size: 18px;
  color: rgba(245, 245, 245, 0.5);
}

.persona-info {
  flex: 1;
  min-width: 0;
}

.persona-name {
  font-size: 15px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.default-badge {
  font-size: 10px;
  padding: 2px 6px;
  background: rgba(129, 199, 132, 0.2);
  color: rgba(129, 199, 132, 0.9);
  border-radius: 4px;
}

.persona-desc {
  font-size: 13px;
  color: rgba(245, 245, 245, 0.5);
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.persona-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.persona-action-btn,
.persona-edit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  color: rgba(245, 245, 245, 0.4);
  cursor: pointer;
  transition: all 0.2s ease;
}

.persona-action-btn:hover,
.persona-edit-btn:hover {
  color: rgba(245, 245, 245, 0.9);
  background: rgba(255, 255, 255, 0.05);
}

.persona-action-btn.danger:hover {
  color: #e57373;
  background: rgba(229, 115, 115, 0.1);
}

.add-persona-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px;
  font-family: inherit;
  font-size: 14px;
  color: rgba(245, 245, 245, 0.5);
  background: transparent;
  border: 1px dashed rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-persona-btn:hover {
  color: rgba(245, 245, 245, 0.8);
  border-color: rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.02);
}

/* Modal */
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

.modal-content {
  width: 100%;
  max-width: 460px;
  padding: 28px;
  background: #1c1c1e;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-title {
  font-family: 'Cinzel', 'Noto Serif SC', serif;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: rgba(245, 245, 245, 0.7);
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 12px 14px;
  font-family: inherit;
  font-size: 14px;
  color: var(--color-bone);
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  outline: none;
  transition: border-color 0.2s ease;
}

.form-input:focus {
  border-color: rgba(255, 255, 255, 0.25);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.form-hint {
  font-size: 12px;
  color: rgba(245, 245, 245, 0.4);
  margin-top: 6px;
}

.type-switch,
.avatar-mode-switch {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.mode-btn {
  padding: 8px 12px;
  font-family: inherit;
  font-size: 13px;
  color: rgba(245, 245, 245, 0.55);
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mode-btn:hover {
  color: rgba(245, 245, 245, 0.85);
  border-color: rgba(255, 255, 255, 0.2);
}

.mode-btn.active {
  color: #080808;
  background: rgba(245, 245, 245, 0.92);
  border-color: transparent;
}

.avatar-upload {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.avatar-preview {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: border-color 0.2s ease;
  flex-shrink: 0;
}

.avatar-preview:hover {
  border-color: rgba(255, 255, 255, 0.25);
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder-large {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: rgba(245, 245, 245, 0.3);
}

.hidden-input {
  display: none;
}

.clear-avatar-btn {
  font-size: 12px;
  padding: 6px 12px;
  color: rgba(245, 245, 245, 0.5);
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-avatar-btn:hover {
  color: #e57373;
  border-color: rgba(229, 115, 115, 0.3);
}

.url-input-wrap {
  margin-top: 12px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 28px;
}

.modal-btn {
  padding: 10px 20px;
  font-family: inherit;
  font-size: 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
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
  border: none;
}

.modal-btn.primary:hover:not(:disabled) {
  background: #fff;
}

.modal-btn.primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
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

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.2s ease;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.95);
}
</style>

