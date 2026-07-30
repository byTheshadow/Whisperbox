<!-- src/apps/divination/components/ReadingResult.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import type { DivinationReading, Deck, Spread } from '../types'

const props = defineProps<{
  reading: DivinationReading
  deck: Deck | null
  spread: Spread | null
  isRequesting: boolean
  error: string | null
}>()

defineEmits<{
  requestAi: []
  retryAi: []
  gotoSettings: []
  close: []
}>()

const isConfigError = computed(() => {
  if (!props.error) return false
  return /设置|配置|API|密钥|模型|应用设置/i.test(props.error)
})
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

      <!-- 已有解读 -->
      <div
        v-if="reading.aiInterpretation"
        class="text-sm text-white/70 leading-relaxed whitespace-pre-wrap p-4 rounded-lg border border-violet-500/10 bg-violet-500/[0.03]"
      >
        {{ reading.aiInterpretation }}
      </div>

      <!-- 加载中 -->
      <div
        v-else-if="isRequesting"
        class="flex flex-col items-center justify-center py-8 space-y-3"
      >
        <div class="flex gap-1.5">
          <span class="ai-dot" style="animation-delay: 0ms" />
          <span class="ai-dot" style="animation-delay: 150ms" />
          <span class="ai-dot" style="animation-delay: 300ms" />
        </div>
        <div class="text-xs text-white/40">AI 正在为你解读牌意</div>
      </div>

      <!-- 错误 -->
      <div
        v-else-if="error"
        class="p-4 rounded-lg border space-y-3"
        :class="isConfigError
          ? 'border-violet-500/20 bg-violet-500/[0.04]'
          : 'border-red-500/20 bg-red-500/5'"
      >
        <div
          class="text-xs leading-relaxed"
          :class="isConfigError ? 'text-violet-200/80' : 'text-red-300/80'"
        >
          {{ error }}
        </div>

        <!-- 未配置：一键跳转 -->
        <div v-if="isConfigError" class="flex gap-2">
          <button
            class="text-xs text-violet-200 px-3 py-1.5 border border-violet-400/30 rounded hover:bg-violet-500/10 transition"
            @click="$emit('gotoSettings')"
          >
            前往设置 →
          </button>
          <button
            class="text-xs text-white/50 px-3 py-1.5 border border-white/10 rounded hover:bg-white/5 transition"
            @click="$emit('retryAi')"
          >
            重试
          </button>
        </div>

        <!-- 其他错误：仅重试 -->
        <button
          v-else
          class="text-xs text-red-300/80 px-3 py-1.5 border border-red-400/20 rounded hover:bg-red-500/10 transition"
          @click="$emit('retryAi')"
        >
          重试
        </button>
      </div>

      <!-- 未请求 -->
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

<style scoped>
.ai-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(196, 181, 253, 0.6);
  animation: dotBounce 1s ease-in-out infinite;
}

@keyframes dotBounce {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
