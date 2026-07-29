<!-- src/apps/divination/components/CardReveal.vue -->
<script setup lang="ts">
import type { DrawnCard } from '../types'

defineProps<{
  drawnCards: DrawnCard[]
  revealedIndices: number[]
  backImageUrl: string
}>()

defineEmits<{
  reveal: [index: number]
}>()
</script>

<template>
  <div class="relative w-full aspect-square max-w-md mx-auto">
    <!-- 牌阵布局区域 -->
    <div
      v-for="(drawn, index) in drawnCards"
      :key="index"
      class="absolute w-20 h-28 transition-all duration-500 cursor-pointer"
      :style="{
        left: `${drawn.position.x}%`,
        top: `${drawn.position.y}%`,
        transform: `translate(-50%, -50%) rotate(${drawn.position.rotation}deg)`
      }"
      @click="$emit('reveal', index)"
    >
      <!-- 牌背 / 牌面 -->
      <div
        class="w-full h-full rounded-lg border border-white/20 overflow-hidden transition-transform duration-500"
        :class="{ 'rotate-y-180': revealedIndices.includes(index) }"
      >
        <div 
          v-if="!revealedIndices.includes(index)"
          class="w-full h-full bg-gradient-to-br from-violet-900 to-indigo-900 flex items-center justify-center"
        >
          <span class="text-white/20 text-xs">?</span>
        </div>
        
        <div 
          v-else
          class="w-full h-full bg-neutral-800 flex flex-col items-center justify-center p-2"
          :class="{ 'rotate-180': drawn.isReversed }"
        >
          <span class="text-xs text-white/60 text-center">{{ drawn.card.name }}</span>
          <span class="text-[10px] text-white/30 mt-1">
            {{ drawn.isReversed ? '逆位' : '正位' }}
          </span>
        </div>
      </div>
      
      <!-- 位置标签 -->
      <div class="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-white/40 whitespace-nowrap">
        {{ drawn.position.name }}
      </div>
    </div>
  </div>
</template>
