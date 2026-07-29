<template>
  <div class="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" @click.self="$emit('close')">
    <div class="w-full max-w-sm bg-neutral-900 border border-white/10 rounded-lg p-5 space-y-4">
      <h2 class="text-sm text-white/80 font-light">新建消息框</h2>

      <!-- 选择角色 -->
      <div class="space-y-2">
        <label class="text-xs text-white/40">选择角色</label>
        <select
          v-model="form.cardCharacterId"
          class="w-full bg-black border border-white/20 rounded px-3 py-2 text-sm text-white/80"
        >
          <option value="" disabled>请选择</option>
          <option v-for="c in characters" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <button
          class="text-xs text-white/40 underline"
          @click="showCharEditor = true"
        >
          + 新建角色
        </button>
      </div>

      <!-- 选择 Persona -->
      <div class="space-y-2">
        <label class="text-xs text-white/40">选择 User 身份</label>
        <select
          v-model="form.personaId"
          class="w-full bg-black border border-white/20 rounded px-3 py-2 text-sm text-white/80"
        >
          <option value="" disabled>请选择</option>
          <option v-for="p in personas" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
      </div>

      <!-- 标题 -->
      <div class="space-y-2">
        <label class="text-xs text-white/40">消息框标题</label>
        <input
          v-model="form.title"
          class="w-full bg-black border border-white/20 rounded px-3 py-2 text-sm text-white/80"
          placeholder="可留空，默认为角色名"
        />
      </div>

      <!-- 回复模式 -->
      <div class="space-y-2">
        <label class="text-xs text-white/40">回复模式</label>
        <div class="flex gap-3">
          <label class="flex items-center gap-1.5 text-xs text-white/60 cursor-pointer">
            <input type="radio" v-model="form.replyMode" value="random" class="accent-white" />
            纯随机
          </label>
          <label class="flex items-center gap-1.5 text-xs text-white/60 cursor-pointer">
            <input type="radio" v-model="form.replyMode" value="keyword" class="accent-white" />
            关键词匹配
          </label>
        </div>
      </div>

      <!-- 回复时间区间 -->
      <div class="space-y-2">
        <label class="text-xs text-white/40">自动回复时间区间（分钟）</label>
        <div class="flex items-center gap-2">
          <input
            v-model.number="form.replyDelayMin"
            type="number"
            min="0"
            class="w-16 bg-black border border-white/20 rounded px-2 py-1 text-sm text-white/80 text-center"
          />
          <span class="text-white/30 text-xs">~</span>
          <input
            v-model.number="form.replyDelayMax"
            type="number"
            min="0"
            class="w-16 bg-black border border-white/20 rounded px-2 py-1 text-sm text-white/80 text-center"
          />
        </div>
      <p class="text-xs text-white/30">
  角色会在这个区间内尝试回复；若超过最晚时间仍无回复，系统会兜底抽取字卡。
</p>
      </div>

      <!-- 字卡库选择 -->
      <div class="space-y-2">
        <label class="text-xs text-white/40">绑定字卡库（可多选）</label>
        <div class="space-y-1 max-h-32 overflow-y-auto">
          <label
            v-for="lib in libraries"
            :key="lib.id"
            class="flex items-center gap-2 text-xs text-white/60 cursor-pointer"
          >
            <input
              type="checkbox"
              :value="lib.id"
              v-model="form.libraryIds"
              class="accent-white"
            />
            {{ lib.name }}
          </label>
          <p v-if="libraries.length === 0" class="text-xs text-white/20">暂无字卡库</p>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex justify-end gap-3 pt-2">
        <button
          class="text-xs text-white/40 px-3 py-1.5 border border-white/10 rounded hover:bg-white/5 transition"
          @click="$emit('close')"
        >
          取消
        </button>
        <button
          class="text-xs text-white/80 px-3 py-1.5 border border-white/20 rounded hover:bg-white/10 transition"
          :disabled="!canCreate"
          @click="handleCreate"
        >
          创建
        </button>
      </div>
    </div>

    <!-- 角色编辑器 -->
    <CardCharacterEditor
      v-if="showCharEditor"
      @close="showCharEditor = false"
      @created="onCharacterCreated"
    />
  </div>
</template>


<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { CardCharacter, Persona, CardLibrary } from '@/core/db'
import { db } from '@/core/db'
import { getAllCardCharacters, createCardSession } from '../services/cardSessionService'
import { getAllLibraries } from '../services/cardLibraryService'
import CardCharacterEditor from './CardCharacterEditor.vue'

const emit = defineEmits<{ close: []; created: [] }>()

const characters = ref<CardCharacter[]>([])
const personas = ref<Persona[]>([])
const libraries = ref<CardLibrary[]>([])
const showCharEditor = ref(false)

const form = ref({
  cardCharacterId: '',
  personaId: '',
  title: '',
  replyMode: 'random' as 'random' | 'keyword',
  replyDelayMin: 0,
  replyDelayMax: 20,
  libraryIds: [] as string[]
})

const canCreate = computed(() => {
  return !!form.value.cardCharacterId && !!form.value.personaId
})

onMounted(async () => {
  characters.value = await getAllCardCharacters()
  personas.value = await ensureDefaultPersona()
  libraries.value = await getAllLibraries()

  if (personas.value.length > 0 && !form.value.personaId) {
    const defaultPersona = personas.value.find(p => p.isDefault) || personas.value[0]
    form.value.personaId = defaultPersona.id
  }

  if (characters.value.length > 0 && !form.value.cardCharacterId) {
    form.value.cardCharacterId = characters.value[0].id
  }
})

async function ensureDefaultPersona(): Promise<Persona[]> {
  const existing = await db.personas.toArray()

  if (existing.length > 0) {
    return existing
  }

  const now = Date.now()

  const defaultPersona: Persona = {
    id: crypto.randomUUID(),
    name: 'User',
    avatar: '',
    description: '默认身份',
    isDefault: true,
    isRealUser: true,
    createdAt: now
  }

  await db.personas.add(defaultPersona)
  return [defaultPersona]
}

async function handleCreate() {
  if (!form.value.cardCharacterId || !form.value.personaId) return

  const charName =
    characters.value.find(c => c.id === form.value.cardCharacterId)?.name || '对话'

  const min = Math.max(0, Number(form.value.replyDelayMin) || 0)
  const max = Math.max(min, Number(form.value.replyDelayMax) || min)

  await createCardSession({
    cardCharacterId: form.value.cardCharacterId,
    personaId: form.value.personaId,
    title: form.value.title.trim() || charName,
    replyMode: form.value.replyMode,
    replyDelayMin: min,
    replyDelayMax: max,
    libraryIds: form.value.libraryIds
  })

  emit('created')
}

async function onCharacterCreated() {
  showCharEditor.value = false
  characters.value = await getAllCardCharacters()

  if (!form.value.cardCharacterId && characters.value.length > 0) {
    form.value.cardCharacterId = characters.value[0].id
  }
}
</script>
