<!-- src/apps/divination/components/SpreadSelector.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import type { Spread, DeckType } from '../types'

const props = defineProps<{
  spreads: Spread[]
  selectedSpreadId: string | null
  /** 当前选择的牌组类型，用于过滤适用牌阵 */
  deckType: DeckType | null
}>()

defineEmits<{
  select: [spreadId: string]
}>()

/** 判断牌阵是否适用当前牌组 */
function isSpreadCompatible(spread: Spread): boolean {
  if (!props.deckType) return true
  if (!spread.supportedDeckTypes || spread.supportedDeckTypes.length === 0) return true
  return spread.supportedDeckTypes.includes(props.deckType)
}

/** 适用的牌阵 */
const compatibleSpreads = computed(() => 
  props.spreads.filter(isSpreadCompatible)
)

/** 不适用的牌阵 */
const incompatibleSpreads = computed(() =>
  props.spreads.filter(s => !isSpreadCompatible(s))
)
</script>

<template>
  <div class="space-y-6">
    <h3 class="text-sm text-white/60 font-light">选择牌阵</h3>
    
    <!-- 无牌阵 -->
    <div 
      v-if="spreads.length === 0" 
      class="text-xs text-white/30 py-8 text-center"
    >
      暂无可用牌阵
    </div>
    
    <template v-else>
      <!-- 适用牌阵 -->
      <div v-if="compatibleSpreads.length > 0" class="space-y-2">
        <button
          v-for="spread in compatibleSpreads"
          :key="spread.id"
          class="w-full p-4 rounded-lg border text-left transition"
          :class="selectedSpreadId === spread.id 
            ? 'border-violet-500/50 bg-violet-500/10' 
            : 'border-white/10 hover:border-white/20 hover:bg-white/5'"
          @click="$emit('select', spread.id)"
        >
          <div class="text-sm text-white/80">{{ spread.name }}</div>
          <div class="text-xs text-white/40 mt-1">{{ spread.positions.length }} 张牌</div>
          <div class="text-xs text-white/30 mt-2 leading-relaxed">{{ spread.description }}</div>
        </button>
      </div>

      <!-- 不适用牌阵（置灰展示） -->
      <div v-if="incompatibleSpreads.length > 0" class="space-y-2 pt-4">
        <div class="text-xs text-white/30 flex items-center gap-2">
          <span>不适用当前牌组</span>
          <span class="flex-1 h-px bg-white/5" />
        </div>
        
        <button
          v-for="spread in incompatibleSpreads"
          :key="spread.id"
          class="w-full p-4 rounded-lg border border-white/5 bg-white/[0.02] text-left opacity-40 cursor-not-allowed"
          disabled
        >
          <div class="text-sm text-white/60">{{ spread.name }}</div>
          <div class="text-xs text-white/30 mt-1">{{ spread.positions.length }} 张牌</div>
        </button>
      </div>
    </template>
  </div>
</template>
