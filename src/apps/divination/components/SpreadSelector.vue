<!-- src/apps/divination/components/SpreadSelector.vue -->
<script setup lang="ts">
import type { Spread } from '../types'

defineProps<{
  spreads: Spread[]
  selectedSpreadId: string | null
}>()

defineEmits<{
  select: [spreadId: string]
}>()
</script>

<template>
  <div class="space-y-3">
    <h3 class="text-sm text-white/60 font-light">选择牌阵</h3>
    
    <div v-if="spreads.length === 0" class="text-xs text-white/30 py-8 text-center">
      暂无可用牌阵
    </div>
    
    <div v-else class="space-y-2">
      <button
        v-for="spread in spreads"
        :key="spread.id"
        class="w-full p-4 rounded-lg border text-left transition"
        :class="selectedSpreadId === spread.id 
          ? 'border-violet-500/50 bg-violet-500/10' 
          : 'border-white/10 hover:border-white/20 hover:bg-white/5'"
        @click="$emit('select', spread.id)"
      >
        <div class="text-sm text-white/80">{{ spread.name }}</div>
        <div class="text-xs text-white/40 mt-1">{{ spread.positions.length }} 张牌</div>
        <div class="text-xs text-white/30 mt-2">{{ spread.description }}</div>
      </button>
    </div>
  </div>
</template>
