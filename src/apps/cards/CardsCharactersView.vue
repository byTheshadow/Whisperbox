<template>
  <div class="min-h-screen bg-black text-white">
    <!-- 顶部 -->
    <header class="px-4 pt-6 pb-4 border-b border-white/10">
      <div class="flex items-center justify-between gap-3">
        <div>
          <h1 class="text-lg font-light tracking-wider">字卡角色管理</h1>
          <p class="text-xs text-white/40 mt-1">新建 · 编辑 · 删除</p>
        </div>

        <button
          class="text-xs text-white/60 px-3 py-1.5 rounded border border-white/10 bg-white/5 hover:bg-white/10 transition"
          @click="$router.push('/cards')"
        >
          返回
        </button>
      </div>
    </header>

    <!-- 操作区 -->
    <div class="px-4 py-4">
      <button
        class="w-full text-left px-4 py-3 rounded border border-white/10 bg-white/5 backdrop-blur hover:bg-white/10 transition"
        @click="openCreate"
      >
        <span class="text-sm text-white/80">新建角色</span>
        <span class="text-xs text-white/30 ml-2">名称 · 头像 · 人格 · 状态文本</span>
      </button>
    </div>

    <!-- 角色列表 -->
    <main class="px-4 space-y-3 pb-20">
      <div
        v-for="character in characters"
        :key="character.id"
        class="rounded border border-white/10 bg-white/5 backdrop-blur p-4"
      >
        <div class="flex items-start gap-3">
          <!-- 头像 -->
          <div class="w-12 h-12 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
            <img
              v-if="character.avatar"
              :src="character.avatar"
              class="w-full h-full object-cover"
              alt=""
            />
            <div
              v-else
              class="w-full h-full flex items-center justify-center text-white/30 text-xs"
            >
              ?
            </div>
          </div>

          <!-- 信息 -->
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h2 class="text-sm text-white/90 truncate">
                  {{ character.name }}
                </h2>

                <p class="text-xs text-white/40 mt-1 line-clamp-2">
                  {{ character.personality || '暂无人格描述' }}
                </p>
              </div>

              <div class="flex items-center gap-2 flex-shrink-0">
                <button
                  class="text-xs text-white/50 px-2 py-1 rounded border border-white/10 hover:bg-white/10 transition"
                  @click="openEdit(character)"
                >
                  编辑
                </button>

                <button
                  class="text-xs text-red-300/80 px-2 py-1 rounded border border-red-400/20 hover:bg-red-500/10 transition"
                  @click="requestDelete(character)"
                >
                  删除
                </button>
              </div>
            </div>

            <p class="text-xs text-white/30 mt-2">
              状态文本：{{ character.statusTexts?.length || 0 }} 条
              · 消息框：{{ getSessionCount(character.id) }} 个
            </p>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div
        v-if="characters.length === 0"
        class="min-h-[50vh] flex flex-col items-center justify-center text-center px-6"
      >
        <p class="text-sm text-white/50">这里还没有角色。</p>
        <p class="text-xs text-white/30 mt-3 leading-5">
          角色会承接字卡的存在感与回复语气。<br />
          先创建一个角色，再打开属于你们的消息框。
        </p>

        <button
          class="mt-5 text-xs text-white/70 px-4 py-2 rounded border border-white/10 bg-white/5 hover:bg-white/10 transition"
          @click="openCreate"
        >
          新建角色
        </button>
      </div>
    </main>

    <!-- 新建 / 编辑角色 -->
    <CardCharacterEditor
      v-if="showEditor"
      :character="editingCharacter"
      @close="closeEditor"
      @saved="onCharacterSaved"
      @created="onCharacterSaved"
    />

    <!-- 删除确认 -->
    <div
      v-if="deletingCharacter"
      class="fixed inset-0 z-50 bg-black/80 backdrop-blur flex items-center justify-center p-4"
      @click.self="deletingCharacter = null"
    >
      <div class="w-full max-w-sm bg-neutral-900 border border-white/10 rounded-lg p-5 space-y-4">
        <h2 class="text-sm text-white/80 font-light">
          {{ deletingSessionCount > 0 ? '删除角色及其消息框？' : '删除角色？' }}
        </h2>

        <div class="text-xs text-white/40 leading-5 space-y-2">
          <template v-if="deletingSessionCount > 0">
            <p>
              「{{ deletingCharacter.name }}」关联了 {{ deletingSessionCount }} 个消息框。
            </p>
            <p>
              删除角色后，这些消息框及其中所有消息也会被删除。
            </p>
            <p>此操作无法撤销。</p>
          </template>

          <template v-else>
            <p>将删除「{{ deletingCharacter.name }}」。</p>
            <p>此操作无法撤销。</p>
          </template>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button
            class="text-xs text-white/40 px-3 py-1.5 border border-white/10 rounded hover:bg-white/5 transition"
            @click="deletingCharacter = null"
          >
            取消
          </button>

          <button
            class="text-xs text-red-300/80 px-3 py-1.5 border border-red-400/20 rounded hover:bg-red-500/10 transition"
            @click="confirmDelete"
          >
            删除角色
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { CardCharacter, CardSession } from '@/core/db'
import {
  deleteCardCharacter,
  getAllCardCharacters,
  getAllCardSessions
} from './services/cardSessionService'
import CardCharacterEditor from './components/CardCharacterEditor.vue'

const characters = ref<CardCharacter[]>([])
const sessions = ref<CardSession[]>([])

const showEditor = ref(false)
const editingCharacter = ref<CardCharacter | null>(null)
const deletingCharacter = ref<CardCharacter | null>(null)

onMounted(loadData)

async function loadData() {
  characters.value = await getAllCardCharacters()
  sessions.value = await getAllCardSessions()
}

function getSessionCount(characterId: string): number {
  return sessions.value.filter(s => s.cardCharacterId === characterId).length
}

function openCreate() {
  editingCharacter.value = null
  showEditor.value = true
}

function openEdit(character: CardCharacter) {
  editingCharacter.value = character
  showEditor.value = true
}

function closeEditor() {
  showEditor.value = false
  editingCharacter.value = null
}

async function onCharacterSaved() {
  closeEditor()
  await loadData()
}

function requestDelete(character: CardCharacter) {
  deletingCharacter.value = character
}

const deletingSessionCount = computed(() => {
  if (!deletingCharacter.value) return 0
  return getSessionCount(deletingCharacter.value.id)
})

async function confirmDelete() {
  if (!deletingCharacter.value) return

  await deleteCardCharacter(deletingCharacter.value.id)
  deletingCharacter.value = null
  await loadData()
}
</script>

