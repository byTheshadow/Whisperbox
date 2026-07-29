<template>
  <div class="cards-home min-h-screen bg-black text-white relative">
    <!-- 每日仪式覆盖层 -->
    <DailyRitualOverlay
      v-if="showRitual"
      @complete="showRitual = false"
    />

    <!-- 顶部标题 -->
    <header class="px-4 pt-6 pb-4 border-b border-white/10">
      <h1 class="text-lg font-light tracking-wider">Cards</h1>
      <p class="text-xs text-white/40 mt-1">字卡 · 私语碎片</p>
    </header>

   <!-- 功能区 -->
<div class="px-4 py-4 space-y-4">
  <!-- 字卡库管理入口 -->
  <button
    class="w-full text-left px-4 py-3 rounded border border-white/10 bg-white/5 backdrop-blur hover:bg-white/10 transition"
    @click="$router.push('/cards/library')"
  >
    <span class="text-sm text-white/80">字卡库管理</span>
    <span class="text-xs text-white/30 ml-2">新建 · 导入 · 编辑</span>
  </button>

  <!-- 字卡角色管理入口 -->
  <button
    class="w-full text-left px-4 py-3 rounded border border-white/10 bg-white/5 backdrop-blur hover:bg-white/10 transition"
    @click="$router.push('/cards/characters')"
  >
    <span class="text-sm text-white/80">字卡角色管理</span>
    <span class="text-xs text-white/30 ml-2">新建 · 编辑 · 删除</span>
  </button>

  <!-- 新建消息框 -->
  <button
    class="w-full text-left px-4 py-3 rounded border border-white/10 bg-white/5 backdrop-blur hover:bg-white/10 transition"
    @click="showNewSession = true"
  >
    <span class="text-sm text-white/80">+ 新建消息框</span>
  </button>
</div>

    <!-- 消息框列表 -->
    <div class="px-4 space-y-3 pb-20">
      <div
        v-for="session in sessions"
        :key="session.id"
        class="relative px-4 py-3 rounded border border-white/10 bg-white/5 backdrop-blur cursor-pointer hover:bg-white/10 transition"
        @click="$router.push(`/cards/session/${session.id}`)"
      >
        <div class="flex items-center gap-3">
          <!-- 角色头像 -->
          <div class="w-10 h-10 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
            <img
              v-if="getCharacterAvatar(session.cardCharacterId)"
              :src="getCharacterAvatar(session.cardCharacterId)"
              class="w-full h-full object-cover"
              alt=""
            />
            <div v-else class="w-full h-full flex items-center justify-center text-white/30 text-xs">
              ?
            </div>
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <span class="text-sm text-white/90 truncate">{{ session.title }}</span>
              <span class="text-xs text-white/30 flex-shrink-0">
                {{ formatTime(session.lastMessageAt) }}
              </span>
            </div>
            <!-- 角色状态 -->
            <p class="text-xs text-white/40 mt-0.5 truncate">
              {{ getCharacterStatus(session.cardCharacterId) }}
            </p>
          </div>
        </div>
      </div>

      <p v-if="sessions.length === 0" class="text-center text-white/20 text-sm py-8">
        还没有消息框
      </p>
    </div>

    <!-- 新建消息框 Modal -->
    <NewCardSessionModal
      v-if="showNewSession"
      @close="showNewSession = false"
      @created="onSessionCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

import type { CardSession, CardCharacter } from '@/core/db'
import { getAllCardSessions } from './services/cardSessionService'
import { getAllCardCharacters } from './services/cardSessionService'
import { hasTodayRitual } from './services/dailyRitualService'
import DailyRitualOverlay from './components/DailyRitualOverlay.vue'
import NewCardSessionModal from './components/NewCardSessionModal.vue'


const sessions = ref<CardSession[]>([])
const characters = ref<CardCharacter[]>([])
const showRitual = ref(false)
const showNewSession = ref(false)

onMounted(async () => {
  // 检查每日仪式
  const done = await hasTodayRitual()
  if (!done) {
    showRitual.value = true
  }

  await loadData()
})

async function loadData() {
  sessions.value = await getAllCardSessions()
  characters.value = await getAllCardCharacters()
}

function getCharacterAvatar(charId: string): string {
  const c = characters.value.find(ch => ch.id === charId)
  return c?.avatar || ''
}

function getCharacterStatus(charId: string): string {
  const c = characters.value.find(ch => ch.id === charId)
  if (!c || !c.statusTexts || c.statusTexts.length === 0) return ''
  return c.statusTexts[0]
}


function formatTime(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
}

function onSessionCreated() {
  showNewSession.value = false
  loadData()
}
</script>
