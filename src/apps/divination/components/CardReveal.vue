<!-- src/apps/divination/components/CardReveal.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { DrawnCard } from '../types'

const props = defineProps<{
  drawnCards: DrawnCard[]
  revealedIndices: number[]
  backImageUrl: string
}>()

defineEmits<{
  reveal: [index: number]
}>()

const enteredIndices = ref<number[]>([])

onMounted(() => {
  props.drawnCards.forEach((_, index) => {
    setTimeout(() => {
      enteredIndices.value.push(index)
    }, index * 120)
  })
})

function isRevealed(index: number): boolean {
  return props.revealedIndices.includes(index)
}

function isEntered(index: number): boolean {
  return enteredIndices.value.includes(index)
}
</script>

<template>
  <div class="card-reveal-stage relative w-full aspect-square max-w-md mx-auto">
    <div
      v-for="(drawn, index) in drawnCards"
      :key="index"
      class="card-slot absolute"
      :style="{
        left: `${drawn.position.x}%`,
        top: `${drawn.position.y}%`,
        transform: `translate(-50%, -50%) rotate(${drawn.position.rotation}deg)`,
        opacity: isEntered(index) ? 1 : 0,
        transitionDelay: `${index * 30}ms`
      }"
    >
      <div
        class="card-flipper"
        :class="{ 'is-revealed': isRevealed(index) }"
        @click="!isRevealed(index) && $emit('reveal', index)"
      >
        <!-- 牌背 -->
        <div class="card-face card-back">
          <div class="card-back-inner">
            <div class="card-back-pattern" />
            <div class="card-back-glyph">✦</div>
          </div>
        </div>

        <!-- 牌面 -->
        <div class="card-face card-front">
          <div
            class="card-front-inner"
            :class="{ 'is-reversed': drawn.isReversed }"
          >
            <img
              v-if="drawn.card.imageUrl"
              :src="drawn.card.imageUrl"
              :alt="drawn.card.name"
              class="card-image"
            />
            <div v-else class="card-placeholder">
              <div
                v-if="drawn.card.iconSvg"
                class="card-icon-svg"
                v-html="drawn.card.iconSvg"
              />
              <span v-else-if="drawn.card.symbol" class="card-symbol">
                {{ drawn.card.symbol }}
              </span>
              <div class="card-name">{{ drawn.card.name }}</div>
              <div v-if="!drawn.card.symbol && !drawn.card.iconSvg" class="card-order">
                {{ drawn.card.order }}
              </div>
            </div>
          </div>

          <div
            v-if="drawn.isReversed"
            class="reversed-tag"
          >
            逆位
          </div>
        </div>
      </div>

      <div class="position-label">
        <div class="position-name">{{ drawn.position.name }}</div>
        <div v-if="isRevealed(index)" class="position-card-name">
          {{ drawn.card.name }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-reveal-stage {
  perspective: 1200px;
  perspective-origin: 50% 40%;
}

.card-slot {
  width: 5rem;
  height: 8rem;
  transition: opacity 400ms cubic-bezier(0.22, 1, 0.36, 1);
}

.card-flipper {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 700ms cubic-bezier(0.65, 0, 0.35, 1);
  cursor: pointer;
}

.card-flipper.is-revealed {
  transform: rotateY(180deg);
  cursor: default;
}

.card-flipper:not(.is-revealed):hover {
  transform: translateY(-4px);
}

.card-flipper:not(.is-revealed):hover .card-back {
  box-shadow:
    0 8px 24px rgba(139, 92, 246, 0.25),
    0 0 0 1px rgba(139, 92, 246, 0.3);
}

.card-face {
  position: absolute;
  inset: 0;
  border-radius: 0.5rem;
  overflow: hidden;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transition: box-shadow 300ms ease;
}

.card-back {
  background: linear-gradient(135deg, #4c1d95 0%, #312e81 50%, #1e1b4b 100%);
  border: 1px solid rgba(139, 92, 246, 0.3);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.card-back-inner {
  position: absolute;
  inset: 6px;
  border: 1px solid rgba(139, 92, 246, 0.25);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-back-pattern {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.15) 0%, transparent 60%),
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 4px,
      rgba(139, 92, 246, 0.04) 4px,
      rgba(139, 92, 246, 0.04) 8px
    );
}

.card-back-glyph {
  position: relative;
  color: rgba(196, 181, 253, 0.4);
  font-size: 1.5rem;
  text-shadow: 0 0 12px rgba(139, 92, 246, 0.4);
}

.card-front {
  transform: rotateY(180deg);
  background: linear-gradient(135deg, #1c1917 0%, #292524 100%);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(196, 181, 253, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.card-front-inner {
  width: 100%;
  height: 100%;
  transition: transform 300ms ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-front-inner.is-reversed {
  transform: rotate(180deg);
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.card-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  text-align: center;
  gap: 0.35rem;
}

.card-icon-svg {
  width: 32px;
  height: 32px;
  color: rgba(196, 181, 253, 0.85);
  filter: drop-shadow(0 0 6px rgba(139, 92, 246, 0.35));
}

.card-icon-svg :deep(svg) {
  width: 100%;
  height: 100%;
  stroke: currentColor;
  fill: none;
}

.card-symbol {
  font-size: 1.75rem;
  color: rgba(196, 181, 253, 0.9);
  font-family: ui-serif, Georgia, serif;
  line-height: 1;
  text-shadow: 0 0 10px rgba(139, 92, 246, 0.35);
}

.card-name {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.3;
}

.card-order {
  font-size: 0.6rem;
  color: rgba(196, 181, 253, 0.5);
  font-family: ui-serif, Georgia, serif;
}

.reversed-tag {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 0.55rem;
  color: rgba(252, 165, 165, 0.8);
  background: rgba(127, 29, 29, 0.5);
  padding: 1px 4px;
  border-radius: 3px;
  border: 1px solid rgba(252, 165, 165, 0.2);
  letter-spacing: 0.5px;
}

.position-label {
  position: absolute;
  top: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  white-space: nowrap;
  pointer-events: none;
}

.position-name {
  font-size: 0.55rem;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 0.5px;
}

.position-card-name {
  font-size: 0.55rem;
  color: rgba(196, 181, 253, 0.7);
  margin-top: 2px;
  animation: fadeInUp 300ms cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .card-slot,
  .card-flipper,
  .card-face,
  .card-front-inner {
    transition-duration: 100ms;
  }
}
</style>
