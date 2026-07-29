<!-- src/apps/divination/components/DeckSelector.vue -->
<script setup lang="ts">
import type { Deck } from '../types'

defineProps<{
  decks: Deck[]
  selectedDeckId: string | null
}>()

defineEmits<{
  select: [deckId: string]
}>()
</script>

<template>
  <div class="space-y-3">
    <h3 class="text-sm text-white/60 font-light">选择牌组</h3>
    
    <div v-if="decks.length === 0" class="text-xs text-white/30 py-8 text-center">
      暂无可用牌组
    </div>
    
    <div v-else class="grid grid-cols-2 gap-3">
      <button
        v-for="deck in decks"
        :key="deck.id"
        class="p-4 rounded-lg border text-left transition"
        :class="selectedDeckId === deck.id 
          ? 'border-violet-500/50 bg-violet-500/10' 
          : 'border-white/10 hover:border-white/20 hover:bg-white/5'"
        @click="$emit('select', deck.id)"
      >
        <div class="text-sm text-white/80">{{ deck.name }}</div>
        <div class="text-xs text-white/40 mt-1">{{ deck.cards.length }} 张</div>
      </button>
    </div>
  </div>
</template>
