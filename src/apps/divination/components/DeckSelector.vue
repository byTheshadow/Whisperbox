<!-- src/apps/divination/components/DeckSelector.vue -->
<script setup lang="ts">
import type { Deck, DeckType } from '../types'

defineProps<{
  decks: Deck[]
  selectedDeckId: string | null
}>()

defineEmits<{
  select: [deckId: string]
}>()

function getDeckSymbol(type: DeckType): string {
  switch (type) {
    case 'tarot': return '☾'
    case 'lenormand': return '✧'
    case 'spirit': return '❋'
    case 'custom': return '◈'
    default: return '◇'
  }
}

function getDeckGradient(type: DeckType): string {
  switch (type) {
    case 'tarot':
      return 'bg-gradient-to-br from-violet-900/50 via-purple-900/40 to-indigo-950/60'
    case 'lenormand':
      return 'bg-gradient-to-br from-amber-900/40 via-rose-900/30 to-orange-950/50'
    case 'spirit':
      return 'bg-gradient-to-br from-cyan-900/40 via-teal-900/30 to-emerald-950/50'
    case 'custom':
      return 'bg-gradient-to-br from-neutral-800/60 to-neutral-950/80'
    default:
      return 'bg-neutral-900'
  }
}
</script>

<template>
  <div class="space-y-5">
    <!-- 标题区 -->
    <div>
      <h3 class="text-sm text-white/80 font-light tracking-wider">选择牌组</h3>
      <p class="text-xs text-white/30 mt-1.5 leading-relaxed">
        不同的牌组承载着不同的语言，选一副与此刻共鸣的牌
      </p>
    </div>

    <!-- 空状态 -->
    <div
      v-if="decks.length === 0"
      class="text-xs text-white/30 py-20 text-center"
    >
      暂无可用牌组
    </div>

    <!-- 牌组列表 -->
    <div v-else class="space-y-3">
      <button
        v-for="deck in decks"
        :key="deck.id"
        class="deck-card w-full relative overflow-hidden rounded-xl border text-left transition-all duration-300"
        :class="selectedDeckId === deck.id
          ? 'border-violet-500/60 bg-violet-500/[0.06]'
          : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'"
        :data-selected="selectedDeckId === deck.id"
        @click="$emit('select', deck.id)"
      >
        <!-- 选中态光晕 -->
        <div
          v-if="selectedDeckId === deck.id"
          class="absolute -top-16 -right-16 w-40 h-40 bg-violet-500/20 rounded-full blur-3xl pointer-events-none"
        />

        <div class="flex items-stretch relative">
          <!-- 左侧：卡背预览 -->
          <div
            class="w-20 flex-shrink-0 flex items-center justify-center relative overflow-hidden border-r"
            :class="[
              getDeckGradient(deck.type),
              selectedDeckId === deck.id ? 'border-violet-500/30' : 'border-white/5'
            ]"
          >
            <div class="deck-pattern absolute inset-0 opacity-40" />
            <span
              class="relative z-10 text-3xl font-light transition-colors"
              :class="selectedDeckId === deck.id ? 'text-white/95' : 'text-white/70'"
            >
              {{ getDeckSymbol(deck.type) }}
            </span>
          </div>

          <!-- 右侧：信息 -->
          <div class="flex-1 min-w-0 p-4 space-y-1.5">
            <div class="flex items-start justify-between gap-2">
              <h4
                class="text-sm font-light tracking-wide truncate"
                :class="selectedDeckId === deck.id ? 'text-white/95' : 'text-white/85'"
              >
                {{ deck.name }}
              </h4>
              <span
                v-if="selectedDeckId === deck.id"
                class="text-[10px] text-violet-300/90 flex-shrink-0 tracking-widest mt-0.5"
              >
                ● 已选
              </span>
            </div>

            <p class="text-xs text-white/40 leading-relaxed line-clamp-2">
              {{ deck.description || '暂无描述' }}
            </p>

            <div class="flex items-center gap-2 pt-1">
              <span class="text-[10px] text-white/40 tracking-wider">
                {{ deck.cards.length }} 张
              </span>
              <span class="text-white/15 text-[10px]">·</span>
              <span class="text-[10px] text-white/40 tracking-wider">
                {{ deck.allowReversed ? '含正逆位' : '无逆位' }}
              </span>
            </div>
          </div>
        </div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.deck-card[data-selected="true"] {
  box-shadow: 0 0 40px -12px rgba(139, 92, 246, 0.35);
}

.deck-pattern {
  background-image:
    radial-gradient(circle at 20% 25%, rgba(255, 255, 255, 0.15) 0%, transparent 45%),
    radial-gradient(circle at 80% 75%, rgba(255, 255, 255, 0.1) 0%, transparent 45%),
    radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.05) 0%, transparent 60%);
}
</style>
