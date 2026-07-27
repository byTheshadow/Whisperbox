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
        @blur="saveSettings"
      />
      <p class="form-hint">OpenAI 兼容端点，支持 OpenRouter、DeepSeek 等</p>
    </div>

    <div class="form-group">
      <label class="form-label">API Key</label>
      <div class="input-with-action">
        <input
          v-model="form.apiKey"
          :type="showApiKey ? 'text' : 'password'"
          class="form-input"
          placeholder="sk-..."
          @blur="saveSettings"
        />
        <button class="input-action" @click="showApiKey = !showApiKey">
          <svg v-if="showApiKey" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="1" y1="1" x2="23" y2="23" stroke-linecap="round"/>
          </svg>
          <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">模型</label>
      <div class="input-with-action">
        <select v-model="form.selectedModel" class="form-input form-select" @change="saveSettings">
          <option value="" disabled>选择模型</option>
          <option v-for="model in form.availableModels" :key="model" :value="model">
            {{ model }}
          </option>
        </select>
        <button 
          class="input-action fetch-btn" 
          :disabled="fetchingModels || !form.apiBaseUrl || !form.apiKey"
          @click="fetchModels"
        >
          <svg 
            :class="['fetch-icon', { spinning: fetchingModels }]" 
            width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
          >
            <path d="M23 4v6h-6M1 20v-6h6" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
      <p v-if="fetchError" class="form-error">{{ fetchError }}</p>
      <p v-else class="form-hint">点击刷新按钮获取可用模型列表</p>
    </div>

    <div v-if="saveStatus" class="save-status">
      {{ saveStatus }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { db, type AppSettings } from '@/core/db'

const showApiKey = ref(false)
const fetchingModels = ref(false)
const fetchError = ref('')
const saveStatus = ref('')

const form = reactive({
  apiBaseUrl: '',
  apiKey: '',
  selectedModel: '',
  availableModels: [] as string[]
})

onMounted(async () => {
  const settings = await db.appSettings.get('global')
  if (settings) {
    form.apiBaseUrl = settings.apiBaseUrl
    form.apiKey = settings.apiKey
    form.selectedModel = settings.selectedModel
    form.availableModels = settings.availableModels || []
  }
})

async function saveSettings() {
  try {
    await db.appSettings.update('global', {
      apiBaseUrl: form.apiBaseUrl,
      apiKey: form.apiKey,
      selectedModel: form.selectedModel,
      availableModels: form.availableModels,
      updatedAt: Date.now()
    })
    saveStatus.value = '已保存'
    setTimeout(() => { saveStatus.value = '' }, 1500)
  } catch (e) {
    console.error('保存设置失败:', e)
  }
}

async function fetchModels() {
  if (!form.apiBaseUrl || !form.apiKey) return

  fetchingModels.value = true
  fetchError.value = ''

  try {
    const baseUrl = form.apiBaseUrl.replace(/\/+$/, '')
    const res = await fetch(`${baseUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${form.apiKey}`
      }
    })

    if (!res.ok) {
      throw new Error(`请求失败: ${res.status}`)
    }

    const data = await res.json()
    const models: string[] = (data.data || [])
      .map((m: { id: string }) => m.id)
      .sort()

    form.availableModels = models

    if (models.length > 0 && !form.selectedModel) {
      form.selectedModel = models[0]
    }

    await saveSettings()
  } catch (e: any) {
    fetchError.value = e.message || '获取模型列表失败'
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
  font-size: 14px;
  color: rgba(245, 245, 245, 0.5);
  margin-bottom: 28px;
}

.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: rgba(245, 245, 245, 0.7);
  margin-bottom: 8px;
  letter-spacing: 0.02em;
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
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(245,245,245,0.5)' stroke-width='2' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
}

.form-select option {
  background: #1c1c1e;
  color: #f5f5f5;
}

.input-with-action {
  display: flex;
  gap: 8px;
}

.input-with-action .form-input {
  flex: 1;
}

.input-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: rgba(245, 245, 245, 0.5);
  cursor: pointer;
  transition: all 0.2s ease;
}

.input-action:hover:not(:disabled) {
  color: rgba(245, 245, 245, 0.9);
  border-color: rgba(255, 255, 255, 0.2);
}

.input-action:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.fetch-icon {
  transition: transform 0.3s ease;
}

.fetch-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.form-hint {
  font-size: 12px;
  color: rgba(245, 245, 245, 0.4);
  margin-top: 6px;
}

.form-error {
  font-size: 12px;
  color: #e57373;
  margin-top: 6px;
}

.save-status {
  font-size: 13px;
  color: rgba(129, 199, 132, 0.9);
  margin-top: 16px;
}
</style>
