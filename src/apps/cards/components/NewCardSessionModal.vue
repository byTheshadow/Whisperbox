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
        <p class="text-xs text-white/30">设定时间内未手动回复，系统自动抽取字卡</p>
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

const canCreate = computed(() => form.value.cardCharacterId && form.value.personaId)

onMounted(async () => {
  characters.value = await getAllCardCharacters()
  personas.value = await db.personas.toArray()
  libraries.value = await getAllLibraries()
})

async function handleCreate() {
  const charName = characters.value.find(c => c.id === form.value.cardCharacterId)?.name || '对话'
  await createCardSession({
    cardCharacterId: form.value.cardCharacterId,
    personaId: form.value.personaId,
    title: form.value.title || charName,
    replyMode: form.value.replyMode,
    replyDelayMin: form.value.replyDelayMin,
    replyDelayMax: form.value.replyDelayMax,
    libraryIds: form.value.libraryIds
  })
  emit('created')
}

async function onCharacterCreated() {
  showCharEditor.value = false
  characters.value = await getAllCardCharacters()
}
</script>
