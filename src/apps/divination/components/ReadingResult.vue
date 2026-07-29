<!-- src/apps/divination/components/ReadingResult.vue -->
<script setup lang="ts">
import type { DivinationReading, Deck, Spread } from '../types'

defineProps<{
  reading: DivinationReading
  deck: Deck | null
  spread: Spread | null
}>()

defineEmits<{
  requestAi: []
  close: []
}>()
</script>

<template>
  <div class="space-y-6">
    <!-- 问题 -->
    <div v-if="reading.question" class="text-center">
      <div class="text-xs text-white/40">你的问题</div>
      <div class="text-sm text-white/70 mt-1">{{ reading.question }}</div>
    </div>
    
    <!-- 抽到的牌 -->
    <div class="space-y-3">
      <div class="text-xs text-white/40">抽到的牌</div>
      
      <div 
        v-for="(drawn, index) in reading.drawnCards" 
        :key="index"
        class="p-3 rounded-lg border border-white/10 bg-white/5"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs text-violet-400">{{ drawn.position.name }}</span>
          <span class="text-[10px] text-white/30">
            {{ drawn.isReversed ? '逆位' : '正位' }}
          </span>
        </div>
        <div class="text-sm text-white/80 mt-1">{{ drawn.card.name }}</div>
      </div>
    </div>
    
    <!-- AI 解读 -->
    <div class="space-y-3">
      <div class="text-xs text-white/40">解读</div>
      
      <div v-if="reading.aiInterpretation" class="text-sm text-white/60 leading-relaxed whitespace-pre-wrap">
        {{ reading.aiInterpretation }}
      </div>
      
      <button
        v-else
        class="w-full py-3 rounded-lg border border-violet-500/30 text-violet-400 text-sm hover:bg-violet-500/10 transition"
        @click="$emit('requestAi')"
      >
        请求 AI 解读
      </button>
    </div>
    
    <!-- 操作 -->
    <div class="flex justify-center pt-4">
      <button
        class="text-xs text-white/40 hover:text-white/60 transition"
        @click="$emit('close')"
      >
        完成
      </button>
    </div>
  </div>
</template>
