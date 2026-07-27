<template>
  <div class="api-settings">
    <h2 class="section-title">API / 模型设置</h2>
    <p class="section-desc">配置 OpenAI 兼容的 API 端点</p>

    <div class="form-group">
      <label class="form-label">API Base URL</label>
      <input
        v-model="form.apiBaseUrl"
        type="text"
        class="form-input"
        placeholder="https://api.openai.com/v1"
      />
      <p class="form-hint">
        OpenAI 兼容端点，例如 OpenAI、OpenRouter、DeepSeek 或自建 API。
      </p>
    </div>

    <div class="form-group">
      <label class="form-label">API Key</label>

      <div class="input-with-action">
        <input
          v-model="form.apiKey"
          :type="showApiKey ? 'text' : 'password'"
          class="form-input"
          placeholder="sk-..."
        />

        <button
          type="button"
          class="input-action"
          :title="showApiKey ? '隐藏 API Key' : '显示 API Key'"
          @click="showApiKey = !showApiKey"
        >
          <svg
            v-if="showApiKey"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path
              d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <line x1="1" y1="1" x2="23" y2="23" stroke-linecap="round" />
          </svg>

          <svg
            v-else
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path
              d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">默认模型</label>

      <div class="input-with-action">
        <select v-model="form.selectedModel" class="form-input form-select">
          <option value="">暂不选择模型</option>

          <option
            v-for="model in form.availableModels"
            :key="model"
            :value="model"
          >
            {{ model }}
          </option>
        </select>

        <button
          type="button"
          class="input-action"
          title="刷新模型列表"
          :disabled="fetchingModels || !form.apiBaseUrl.trim() || !form.apiKey.trim()"
          @click="fetchModels"
        >
          <svg
            :class="['fetch-icon', { spinning: fetchingModels }]"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path
              d="M23 4v6h-6M1 20v-6h6"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>

      <p v-if="fetchError" class="form-error">{{ fetchError }}</p>
      <p v-else class="form-hint">
        填写 API 地址与 Key 后，可点击右侧图标获取模型列表。
      </p>
    </div>

    <div class="actions">
      <button
        type="button"
        class="save-btn"
        :disabled="saving"
        @click="saveSettings"
      >
        {{ saving ? '保存中…' : '保存设置' }}
      </button>

      <span
        v-if="saveStatus"
        :class="['save-status', { error: saveStatusType === 'error' }]"
      >
        {{ saveStatus }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { db } from '@/core/db'

const showApiKey = ref(false)
const fetchingModels = ref(false)
const saving = ref(false)
const fetchError = ref('')
const saveStatus = ref('')
const saveStatusType = ref<'success' | 'error'>('success')

const form = reactive({
  apiBaseUrl: '',
  apiKey: '',
  selectedModel: '',
  availableModels: [] as string[]
})

onMounted(async () => {
  const settings = await db.appSettings.get('global')

  if (!settings) {
    return
  }

  form.apiBaseUrl = settings.apiBaseUrl || ''
  form.apiKey = settings.apiKey || ''
  form.selectedModel = settings.selectedModel || ''

  // 从 IndexedDB 读出的旧数据可能没有 availableModels。
  form.availableModels = Array.isArray(settings.availableModels)
    ? [...settings.availableModels]
    : []
})

function showStatus(message: string, type: 'success' | 'error') {
  saveStatus.value = message
  saveStatusType.value = type

  window.setTimeout(() => {
    saveStatus.value = ''
  }, 2200)
}

async function saveSettings() {
  saving.value = true
  fetchError.value = ''

  try {
    const now = Date.now()
    const existing = await db.appSettings.get('global')

    const settingsData = {
      id: 'global',
      apiBaseUrl: form.apiBaseUrl.trim(),
      apiKey: form.apiKey.trim(),
      selectedModel: form.selectedModel,
      // 关键：必须转为普通数组，不能直接保存 Vue Proxy。
      availableModels: [...form.availableModels],
      proactivePushEnabled: existing?.proactivePushEnabled ?? false,
      proactiveCheckInterval: existing?.proactiveCheckInterval ?? 300,
      summarizeEveryN: existing?.summarizeEveryN ?? 20,
      theme: 'dark' as const,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    }

    // put 而不是 update：即使 global 设置尚未被初始化，也能正常创建。
    await db.appSettings.put(settingsData)

    showStatus('设置已保存', 'success')
  } catch (error) {
    console.error('保存 API 设置失败：', error)
    showStatus('保存失败，请查看控制台', 'error')
  } finally {
    saving.value = false
  }
}

async function fetchModels() {
  if (!form.apiBaseUrl.trim() || !form.apiKey.trim()) {
    return
  }

  fetchingModels.value = true
  fetchError.value = ''

  try {
    const baseUrl = form.apiBaseUrl.trim().replace(/\/+$/, '')
    const response = await fetch(`${baseUrl}/models`, {
      headers: {
        Authorization: `Bearer ${form.apiKey.trim()}`
      }
    })

    if (!response.ok) {
      throw new Error(`请求失败：HTTP ${response.status}`)
    }

    const data = await response.json()

    if (!Array.isArray(data.data)) {
      throw new Error('接口返回格式不正确，未找到 data 模型列表')
    }

    const models = data.data
      .map((model: { id?: unknown }) => typeof model.id === 'string' ? model.id : '')
      .filter(Boolean)
      .sort((a: string, b: string) => a.localeCompare(b))

    form.availableModels = models

    if (models.length > 0 && !models.includes(form.selectedModel)) {
      form.selectedModel = models[0]
    }

    await saveSettings()

    if (models.length === 0) {
      fetchError.value = '接口连接成功，但没有返回可选模型。'
    }
  } catch (error) {
    console.error('获取模型列表失败：', error)

    fetchError.value = error instanceof Error
      ? error.message
      : '获取模型列表失败'
  } finally {
    fetchingModels.value = false
  }
}
</script>

<style scoped>
.api-settings {
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
  margin-bottom: 28px;
  font-size: 14px;
  color: rgba(245, 245, 245, 0.5);
}

.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: rgba(245, 245, 245, 0.7);
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

.form-input::placeholder {
  color: rgba(245, 245, 245, 0.3);
}

.form-input:focus {
  border-color: rgba(255, 255, 255, 0.25);
}

.form-select {
  appearance: none;
  padding-right: 36px;
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(245,245,245,0.5)' stroke-width='2' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
}

.form-select option {
  color: #f5f5f5;
  background: #1c1c1e;
}

.input-with-action {
  display: flex;
  gap: 8px;
}

.input-with-action .form-input {
  flex: 1;
  min-width: 0;
}

.input-action {
  display: flex;
  flex: 0 0 44px;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  color: rgba(245, 245, 245, 0.5);
  cursor: pointer;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  transition: all 0.2s ease;
}

.input-action:hover:not(:disabled) {
  color: rgba(245, 245, 245, 0.9);
  border-color: rgba(255, 255, 255, 0.2);
}

.input-action:disabled {
  cursor: not-allowed;
  opacity: 0.3;
}

.fetch-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.form-hint,
.form-error {
  margin-top: 6px;
  font-size: 12px;
}

.form-hint {
  color: rgba(245, 245, 245, 0.4);
}

.form-error {
  color: #e57373;
}

.actions {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 30px;
}

.save-btn {
  padding: 11px 20px;
  font-family: inherit;
  font-size: 14px;
  color: #080808;
  cursor: pointer;
  background: rgba(245, 245, 245, 0.92);
  border: 1px solid transparent;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.save-btn:hover:not(:disabled) {
  background: #ffffff;
}

.save-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.save-status {
  font-size: 13px;
  color: rgba(129, 199, 132, 0.95);
}

.save-status.error {
  color: #e57373;
}
</style>

