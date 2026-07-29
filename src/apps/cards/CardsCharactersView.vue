<template>
  <div class="min-h-screen bg-black text-white">
    <header class="px-4 pt-6 pb-4 border-b border-white/10">
      <div class="flex items-center justify-between gap-3">
        <div>
          <h1 class="text-lg font-light tracking-wider">字卡角色管理</h1>
          <p class="text-xs text-white/40 mt-1">新建 · 编辑 · 删除</p>
        </div>

        <button
          class="px-3 py-2 rounded border border-white/10 bg-white/5 backdrop-blur text-xs text-white/80 hover:bg-white/10 transition"
          @click="showEditor = true"
        >
          新建角色
        </button>
      </div>
    </header>

    <main class="px-4 py-4 pb-20">
      <div v-if="characters.length > 0" class="space-y-3">
        <div
          v-for="character in characters"
          :key="character.id"
          class="rounded border border-white/10 bg-white/5 backdrop-blur p-4"
        >
          <div class="flex items-start gap-3">
            <div class="w-12 h-12 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
              <img
                v-if="character.avatar"
                :src="character.avatar"
                class="w-full h-full object-cover"
                alt=""
              />
              <div v-else class="w-full h-full flex items-center justify-center text-white/30 text-xs">
                ?
              </div>
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <h2 class="text-sm text-white/90 truncate">{{ character.name }}</h2>
                  <p class="text-xs text-white/40 mt-1 line-clamp-2">
                    {{ character.personality || '暂无人格描述' }}
                  </p>
                </div>

                <div class="flex items-center gap-2 flex-shrink-0">
                  <button
                    class="text-xs text-white/60 px-2 py-1 rounded border border-white/10 hover:bg-white/10 transition"
                    @click="openEdit(character)"
                  >
                    编辑
                  </button>
                  <button
                    class="text-xs text-red-300 px-2 py-1 rounded border border-red-400/20 hover:bg-red-500/10 transition"
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
      </div>

      <div v-else class="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <p class="text-white/60 text-sm">这里还没有角色。</p>
        <p class="text-white/30 text-xs mt-2">先创建一个角色，再开始使用 Cards。</p>
        <button
          class="mt-4 px-4 py-2 rounded border border-white/10 bg-white/5 backdrop-blur text-xs text-white/80 hover:bg-white/10 transition"
          @click="showEditor = true"
        >
          新建角色
        </button>
      </div>
    </main>

    <CardCharacterEditor
      v-if="showEditor"
      :character="editingCharacter"
      @close="closeEditor"
      @saved="onSaved"
    />

    <div
      v-if="deletingCharacter"
      class="fixed inset-0 z-50 bg-black/80 backdrop-blur flex items-center justify-center p-4"
      @click.self="deletingCharacter = null"
    >
      <div class="w-full max-w-sm bg-neutral-900 border border-white/10 rounded-lg p-5 space-y-4">
        <h2 class="text-sm text-white/80 font-light">
          {{ deletingCharacterSessionCount > 0 ? '删除角色及其消息框？' : '删除角色？' }}
        </h2>

        <div class="text-xs text-white/40 space-y-2 leading-5">
          <p>「{{ deletingCharacter.name }}」</p>
          <p v-if="deletingCharacterSessionCount > 0">
            关联了 {{ deletingCharacterSessionCount }} 个消息框。删除后，这些消息框及其中所有消息也会被删除。
          </p>
          <p>此操作无法撤销。</p>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button
            class="text-xs text-white/40 px-3 py-1.5 border border-white/10 rounded hover:bg-white/5 transition"
            @click="deletingCharacter = null"
          >
            取消
          </button>
          <button
            class="text-xs text-red-300 px-3 py-1.5 border border-red-400/20 rounded hover:bg-red-500/10 transition"
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
import { deleteCardCharacter, getAllCardCharacters, getAllCardSessions } from './services/cardSessionService'
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

function getSessionCount(characterId: string) {
  return sessions.value.filter(s => s.cardCharacterId === characterId).length
}

function openEdit(character: CardCharacter) {
  editingCharacter.value = character
  showEditor.value = true
}

function closeEditor() {
  showEditor.value = false
  editingCharacter.value = null
}

async function onSaved() {
  closeEditor()
  await loadData()
}

const deletingCharacterSessionCount = computed(() => {
  if (!deletingCharacter.value) return 0
  return getSessionCount(deletingCharacter.value.id)
})

function requestDelete(character: CardCharacter) {
  deletingCharacter.value = character
}

async function confirmDelete() {
  if (!deletingCharacter.value) return
  await deleteCardCharacter(deletingCharacter.value.id)
  deletingCharacter.value = null
  await loadData()
}
</script>
