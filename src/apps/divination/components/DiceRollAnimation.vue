<!-- src/apps/divination/components/DiceRollAnimation.vue -->
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

const emit = defineEmits<{
  finish: []
}>()

let timer: number | null = null

onMounted(() => {
  timer = window.setTimeout(() => emit('finish'), 2600)
})

onUnmounted(() => {
  if (timer) window.clearTimeout(timer)
})
</script>

<template>
  <div class="dice-stage">
    <div class="dice-scene">
      <!-- 骰子 1：行星面 -->
      <div class="dice dice-1">
        <div class="face f-front">☉</div>
        <div class="face f-back">☽</div>
        <div class="face f-right">♂</div>
        <div class="face f-left">♀</div>
        <div class="face f-top">☿</div>
        <div class="face f-bottom">♃</div>
      </div>

      <!-- 骰子 2：星座面 -->
      <div class="dice dice-2">
        <div class="face f-front">♈</div>
        <div class="face f-back">♉</div>
        <div class="face f-right">♊</div>
        <div class="face f-left">♋</div>
        <div class="face f-top">♌</div>
        <div class="face f-bottom">♍</div>
      </div>

      <!-- 骰子 3：宫位面 -->
      <div class="dice dice-3">
        <div class="face f-front">I</div>
        <div class="face f-back">II</div>
        <div class="face f-right">III</div>
        <div class="face f-left">IV</div>
        <div class="face f-top">V</div>
        <div class="face f-bottom">VI</div>
      </div>
    </div>

    <div class="dice-hint">星辰在虚空中翻转...</div>
  </div>
</template>

<style scoped>
.dice-stage {
  min-height: 55vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3.5rem;
  perspective: 1400px;
}

.dice-scene {
  display: flex;
  gap: 2.5rem;
  transform-style: preserve-3d;
}

.dice {
  position: relative;
  width: 60px;
  height: 60px;
  transform-style: preserve-3d;
  animation: diceRoll 2.6s cubic-bezier(0.34, 0.05, 0.24, 1) forwards;
  filter: drop-shadow(0 8px 16px rgba(139, 92, 246, 0.25));
}

.dice-1 { animation-delay: 0ms; }
.dice-2 { animation-delay: 150ms; }
.dice-3 { animation-delay: 300ms; }

.face {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  color: rgba(196, 181, 253, 0.95);
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
  border: 1px solid rgba(139, 92, 246, 0.4);
  border-radius: 8px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    inset 0 -1px 0 rgba(0, 0, 0, 0.3);
  font-family: ui-serif, Georgia, serif;
  text-shadow: 0 0 8px rgba(139, 92, 246, 0.4);
}

.f-front  { transform: translateZ(30px); }
.f-back   { transform: rotateY(180deg) translateZ(30px); }
.f-right  { transform: rotateY(90deg) translateZ(30px); }
.f-left   { transform: rotateY(-90deg) translateZ(30px); }
.f-top    { transform: rotateX(90deg) translateZ(30px); }
.f-bottom { transform: rotateX(-90deg) translateZ(30px); }

@keyframes diceRoll {
  0% {
    transform: translateY(-60px) rotateX(0) rotateY(0) rotateZ(0);
    opacity: 0;
  }
  15% {
    opacity: 1;
  }
  60% {
    transform: translateY(0) rotateX(720deg) rotateY(1080deg) rotateZ(360deg);
  }
  75% {
    transform: translateY(-12px) rotateX(750deg) rotateY(1110deg) rotateZ(380deg);
  }
  90% {
    transform: translateY(0) rotateX(720deg) rotateY(1080deg) rotateZ(360deg);
  }
  100% {
    transform: translateY(0) rotateX(720deg) rotateY(1080deg) rotateZ(360deg);
    opacity: 1;
  }
}

.dice-hint {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 3px;
  animation: hintPulse 1.8s ease-in-out infinite;
}

@keyframes hintPulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.75; }
}

@media (prefers-reduced-motion: reduce) {
  .dice {
    animation-duration: 600ms;
  }
}
</style>
