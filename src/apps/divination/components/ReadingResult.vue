<!-- src/apps/divination/components/ReadingResult.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import type { DivinationReading, Deck, Spread, DrawnCard } from '../types'

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

function getMeaning(drawn: DrawnCard): string {
  if (drawn.isReversed && drawn.card.reversedMeaning) {
    return drawn.card.reversedMeaning
  }
  return drawn.card.uprightMeaning || '暂无解释文本'
}

function getKeywords(drawn: DrawnCard): string[] {
  if (drawn.isReversed && drawn.card.reversedKeywords.length > 0) {
    return drawn.card.reversedKeywords
  }
  return drawn.card.uprightKeywords
}
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
        class="rounded-lg border border-white/10 bg-white/[0.03] overflow-hidden"
      >
        <!-- 头部：位置 + 正逆位 -->
        <div class="flex items-center justify-between px-3 pt-3">
          <span class="text-xs text-violet-400 tracking-wide">{{ drawn.position.name }}</span>
          <span
            class="text-[10px] tracking-wider"
            :class="drawn.isReversed ? 'text-rose-300/80' : 'text-white/30'"
          >
            {{ drawn.isReversed ? '逆位' : '正位' }}
          </span>
        </div>

        <!-- 牌视觉 + 名称 -->
        <div class="flex items-center gap-3 px-3 pt-2">
          <div
            class="card-icon flex-shrink-0"
            :class="{ 'is-reversed': drawn.isReversed }"
          >
            <div
              v-if="drawn.card.iconSvg"
              class="card-icon-svg"
              v-html="drawn.card.iconSvg"
            />
            <span v-else-if="drawn.card.symbol" class="card-icon-symbol">
              {{ drawn.card.symbol }}
            </span>
            <span v-else class="card-icon-fallback">
              {{ drawn.card.name.slice(0, 1) }}
            </span>
          </div>

          <div class="flex-1 min-w-0">
            <div class="text-sm text-white/85 font-light tracking-wide">{{ drawn.card.name }}</div>
            <div class="text-[11px] text-white/40 mt-0.5 leading-relaxed">
              {{ drawn.position.description }}
            </div>
          </div>
        </div>

        <!-- 关键词 -->
        <div
          v-if="getKeywords(drawn).length > 0"
          class="flex flex-wrap gap-1.5 px-3 pt-3"
        >
          <span
            v-for="kw in getKeywords(drawn)"
            :key="kw"
            class="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300/80 border border-violet-500/15"
          >
            {{ kw }}
          </span>
        </div>

        <!-- 牌意解释（兜底文本） -->
        <div class="mt-3 mx-3 mb-3 px-3 py-2.5 rounded bg-black/30 border border-white/5">
          <div class="text-[10px] text-white/30 mb-1 tracking-wider">
            {{ drawn.isReversed ? '逆位含义' : '牌意' }}
          </div>
          <p class="text-xs text-white/65 leading-relaxed whitespace-pre-wrap">
            {{ getMeaning(drawn) }}
          </p>
        </div>
      </div>
    </div>

    <!-- AI 解读 -->
    <div class="space-y-3">
      <div class="text-xs text-white/40">AI 综合解读</div>

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
.card-icon {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
  border: 1px solid rgba(139, 92, 246, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(196, 181, 253, 0.9);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
  transition: transform 300ms ease;
}

.card-icon.is-reversed {
  transform: rotate(180deg);
}

.card-icon-svg {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-icon-svg :deep(svg) {
  width: 100%;
  height: 100%;
  stroke: currentColor;
  fill: none;
}

.card-icon-symbol {
  font-size: 1.5rem;
  font-family: ui-serif, Georgia, serif;
  line-height: 1;
}

.card-icon-fallback {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.5);
  font-family: ui-serif, Georgia, serif;
}

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

