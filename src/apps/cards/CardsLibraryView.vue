<template>
  <div class="min-h-screen bg-black text-white">
    <!-- 顶部 -->
    <header class="px-4 pt-6 pb-4 border-b border-white/10 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button class="text-white/40 text-sm" @click="$router.push('/cards')">&larr;</button>
        <h1 class="text-lg font-light tracking-wider">字卡库</h1>
      </div>
      <button
        class="text-xs text-white/60 border border-white/20 px-3 py-1 rounded hover:bg-white/10 transition"
        @click="showNewLib = true"
      >
        + 新建
      </button>
    </header>

    <!-- 字卡库列表 -->
    <div class="px-4 py-4 space-y-3">
      <div
        v-for="lib in libraries"
        :key="lib.id"
        class="border border-white/10 rounded p-4 bg-white/5 backdrop-blur space-y-3"
      >
        <div class="flex items-center justify-between">
          <h3 class="text-sm text-white/80">{{ lib.name }}</h3>
          <div class="flex gap-2">
            <button class="text-xs text-white/40 hover:text-white/70" @click="startImport(lib.id)">导入</button>
            <button class="text-xs text-white/40 hover:text-white/70" @click="toggleExpand(lib.id)">
              {{ expanded === lib.id ? '收起' : '展开' }}
            </button>
            <button class="text-xs text-red-400/60 hover:text-red-400" @click="handleDeleteLib(lib.id)">删除</button>
          </div>
        </div>

        <p v-if="lib.description" class="text-xs text-white/30">{{ lib.description }}</p>
        <p class="text-xs text-white/30">共 {{ cardCounts[lib.id] || 0 }} 条字卡</p>

        <!-- 展开的字卡列表 -->
        <div v-if="expanded === lib.id" class="space-y-2 pt-2 border-t border-white/5">
          <div
            v-for="card in libraryCards"
            :key="card.id"
            class="flex items-start gap-2 group"
          >
            <p class="flex-1 text-xs text-white/60 leading-relaxed">{{ card.content }}</p>
            <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
              <button class="text-xs text-white/30 hover:text-white/60" @click="startEditCard(card)">编辑</button>
              <button class="text-xs text-red-400/40 hover:text-red-400" @click="handleDeleteCard(card.id)">删</button>
            </div>
          </div>

          <!-- 新增字卡 -->
          <div class="flex gap-2 pt-2">
            <input
              v-model="newCardContent"
              class="flex-1 bg-black border border-white/20 rounded px-2 py-1 text-xs text-white/80"
              placeholder="输入新字卡内容"
              @keyup.enter="handleAddCard(lib.id)"
            />
            <button
              class="text-xs text-white/60 border border-white/20 px-2 py-1 rounded hover:bg-white/10"
              @click="handleAddCard(lib.id)"
            >
              添加
            </button>
          </div>
        </div>
      </div>

      <p v-if="libraries.length === 0" class="text-center text-white/20 text-sm py-8">
        还没有字卡库
      </p>
    </div>

    <!-- 新建字卡库 Modal -->
    <div
      v-if="showNewLib"
      class="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      @click.self="showNewLib = false"
    >
      <div class="w-full max-w-sm bg-neutral-900 border border-white/10 rounded-lg p-5 space-y-4">
        <h2 class="text-sm text-white/80">新建字卡库</h2>
        <input
          v-model="newLibName"
          class="w-full bg-black border border-white/20 rounded px-3 py-2 text-sm text-white/80"
          placeholder="字卡库名称"
        />
        <textarea
          v-model="newLibDesc"
          class="w-full bg-black border border-white/20 rounded px-3 py-2 text-sm text-white/80 h-16 resize-none"
          placeholder="描述（可选）"
        />
        <div class="flex justify-end gap-3">
          <button class="text-xs text-white/40 px-3 py-1.5 border border-white/10 rounded" @click="showNewLib = false">取消</button>
          <button class="text-xs text-white/80 px-3 py-1.5 border border-white/20 rounded hover:bg-white/10" @click="handleCreateLib">创建</button>
        </div>
      </div>
    </div>

    <!-- 导入 Modal -->
    <div
      v-if="importTargetId"
      class="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      @click.self="importTargetId = ''"
    >
      <div class="w-full max-w-sm bg-neutral-900 border border-white/10 rounded-lg p-5 space-y-4">
        <h2 class="text-sm text-white/80">导入字卡</h2>
        <p class="text-xs text-white/30">一行一条，纯文本格式</p>
        <textarea
          v-model="importText"
          class="w-full bg-black border border-white/20 rounded px-3 py-2 text-sm text-white/80 h-40 resize-none font-mono"
          placeholder="每一行作为一条字卡内容"
        />
        <div class="flex justify-end gap-3">
          <button class="text-xs text-white/40 px-3 py-1.5 border border-white/10 rounded" @click="importTargetId = ''">取消</button>
          <button class="text-xs text-white/80 px-3 py-1.5 border border-white/20 rounded hover:bg-white/10" @click="handleImport">导入</button>
        </div>
      </div>
    </div>

    <!-- 编辑字卡 Modal -->
    <div
      v-if="editingCard"
      class="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      @click.self="editingCard = null"
    >
      <div class="w-full max-w-sm bg-neutral-900 border border-white/10 rounded-lg p-5 space-y-4">
        <h2 class="text-sm text-white/80">编辑字卡</h2>
        <textarea
          v-model="editContent"
          class="w-full bg-black border border-white/20 rounded px-3 py-2 text-sm text-white/80 h-20 resize-none"
        />
        <div class="space-y-2">
          <label class="text-xs text-white/40">触发词（逗号分隔）</label>
          <input
            v-model="editTriggerWords"
            class="w-full bg-black border border-white/20 rounded px-3 py-2 text-sm text-white/80"
            placeholder="关键词1, 关键词2"
          />
        </div>
        <div class="space-y-2">
          <label class="text-xs text-white/40">权重</label>
          <input
            v-model.number="editWeight"
            type="number"
            min="1"
            class="w-20 bg-black border border-white/20 rounded px-2 py-1 text-sm text-white/80"
          />
        </div>
        <div class="flex justify-end gap-3">
          <button class="text-xs text-white/40 px-3 py-1.5 border border-white/10 rounded" @click="editingCard = null">取消</button>
          <button class="text-xs text-white/80 px-3 py-1.5 border border-white/20 rounded hover:bg-white/10" @click="handleSaveCard">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { CardLibrary, WhisperCard } from '@/core/db'
import {
  getAllLibraries,
  createLibrary,
  deleteLibrary,
  getCardsByLibrary,
  createCard,
  updateCard,
  deleteCard,
  importCardsFromText
} from './services/cardLibraryService'

const libraries = ref<CardLibrary[]>([])
const cardCounts = ref<Record<string, number>>({})
const expanded = ref<string>('')
const libraryCards = ref<WhisperCard[]>([])

const showNewLib = ref(false)
const newLibName = ref('')
const newLibDesc = ref('')

const importTargetId = ref('')
const importText = ref('')

const newCardContent = ref('')

const editingCard = ref<WhisperCard | null>(null)
const editContent = ref('')
const editTriggerWords = ref('')
const editWeight = ref(1)

onMounted(loadData)

async function loadData() {
  libraries.value = await getAllLibraries()
  for (const lib of libraries.value) {
    const cards = await getCardsByLibrary(lib.id)
    cardCounts.value[lib.id] = cards.length
  }
}

async function toggleExpand(libId: string) {
  if (expanded.value === libId) {
    expanded.value = ''
    libraryCards.value = []
  } else {
    expanded.value = libId
    libraryCards.value = await getCardsByLibrary(libId)
  }
}

async function handleCreateLib() {
  if (!newLibName.value.trim()) return
  await createLibrary({ name: newLibName.value.trim(), description: newLibDesc.value.trim() })
  newLibName.value = ''
  newLibDesc.value = ''
  showNewLib.value = false
  await loadData()
}

async function handleDeleteLib(id: string) {
  if (!confirm('删除字卡库将同时删除其中所有字卡')) return
  await deleteLibrary(id)
  if (expanded.value === id) {
    expanded.value = ''
    libraryCards.value = []
  }
  await loadData()
}

function startImport(libId: string) {
  importTargetId.value = libId
  importText.value = ''
}

async function handleImport() {
  if (!importText.value.trim()) return
  const count = await importCardsFromText(importTargetId.value, importText.value)
  importTargetId.value = ''
  importText.value = ''
  await loadData()
  if (expanded.value) {
    libraryCards.value = await getCardsByLibrary(expanded.value)
  }
}

async function handleAddCard(libId: string) {
  if (!newCardContent.value.trim()) return
  await createCard({ libraryId: libId, content: newCardContent.value.trim() })
  newCardContent.value = ''
  libraryCards.value = await getCardsByLibrary(libId)
  cardCounts.value[libId] = libraryCards.value.length
}

function startEditCard(card: WhisperCard) {
  editingCard.value = card
  editContent.value = card.content
  editTriggerWords.value = card.triggerWords.join(', ')
  editWeight.value = card.weight
}

async function handleSaveCard() {
  if (!editingCard.value) return
  await updateCard(editingCard.value.id, {
    content: editContent.value,
    triggerWords: editTriggerWords.value.split(',').map(s => s.trim()).filter(s => s),
    weight: editWeight.value
  })
  editingCard.value = null
  if (expanded.value) {
    libraryCards.value = await getCardsByLibrary(expanded.value)
  }
}

async function handleDeleteCard(id: string) {
  await deleteCard(id)
  if (expanded.value) {
    libraryCards.value = await getCardsByLibrary(expanded.value)
    cardCounts.value[expanded.value] = libraryCards.value.length
  }
}
</script>
