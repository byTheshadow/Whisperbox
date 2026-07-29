<!-- src/apps/divination/components/ShuffleAnimation.vue -->
<script setup lang="ts">
import { onMounted } from 'vue'

const props = defineProps<{
  /** 动画总时长（ms），默认 2800 */
  duration?: number
}>()

const emit = defineEmits<{
  finish: []
}>()

const totalDuration = props.duration ?? 2800

/** 生成一叠影子牌的动画参数 */
const CARD_COUNT = 10
const cards = Array.from({ length: CARD_COUNT }, (_, i) => {
  // 每张牌错开出场时机
  const delay = i * 80
  // 随机化每张牌的运动幅度
  const dx = (Math.random() - 0.5) * 100
  const dy = (Math.random() - 0.5) * 30
  const rot = (Math.random() - 0.5) * 30
  return { index: i, delay, dx, dy, rot }
})

onMounted(() => {
  setTimeout(() => emit('finish'), totalDuration)
})
</script>

<template>
  <div class="shuffle-stage">
    <div class="shuffle-hint">洗牌中</div>
    
    <div class="shuffle-deck">
      <div
        v-for="c in cards"
        :key="c.index"
        class="shuffle-card"
        :style="{
          '--dx': `${c.dx}px`,
          '--dy': `${c.dy}px`,
          '--rot': `${c.rot}deg`,
          'animation-delay': `${c.delay}ms`,
          zIndex: c.index
        }"
      >
        <div class="shuffle-card-inner">
          <span class="shuffle-glyph">✦</span>
        </div>
      </div>
    </div>
    
    <div class="shuffle-subtext">牌灵正在与你的问题共鸣</div>
  </div>
</template>

<style scoped>
.shuffle-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1rem;
  gap: 2.5rem;
  perspective: 1200px;
}

.shuffle-hint {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 4px;
  animation: hintPulse 1.6s ease-in-out infinite;
}

.shuffle-subtext {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.3);
  letter-spacing: 1px;
}

.shuffle-deck {
  position: relative;
  width: 5rem;
  height: 8rem;
  transform-style: preserve-3d;
}

.shuffle-card {
  position: absolute;
  inset: 0;
  border-radius: 0.5rem;
  animation: shuffleMove 1.4s cubic-bezier(0.65, 0, 0.35, 1) infinite;
  transform-origin: center;
}

.shuffle-card-inner {
  position: absolute;
  inset: 0;
  border-radius: 0.5rem;
  background: linear-gradient(
    135deg,
    #4c1d95 0%,
    #312e81 50%,
    #1e1b4b 100%
  );
  border: 1px solid rgba(139, 92, 246, 0.3);
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}

.shuffle-glyph {
  color: rgba(196, 181, 253, 0.3);
  font-size: 1.25rem;
  text-shadow: 0 0 8px rgba(139, 92, 246, 0.4);
}

@keyframes shuffleMove {
  0% {
    transform: translate(0, 0) rotate(0deg);
  }
  25% {
    transform: translate(var(--dx), var(--dy)) rotate(var(--rot));
  }
  50% {
    transform: translate(0, -6px) rotate(0deg);
  }
  75% {
    transform: translate(calc(var(--dx) * -1), var(--dy)) rotate(calc(var(--rot) * -1));
  }
  100% {
    transform: translate(0, 0) rotate(0deg);
  }
}

@keyframes hintPulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 0.9; }
}

@media (prefers-reduced-motion: reduce) {
  .shuffle-card {
    animation: none;
  }
}
</style>
