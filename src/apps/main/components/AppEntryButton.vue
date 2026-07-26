<template>
  <button
    class="glass-panel px-5 py-3 flex items-center gap-4 text-left group transition-all hover:scale-[1.01] active:scale-[0.99]"
    :aria-label="label"
  >
    <!-- 图标 -->
    <div class="w-9 h-9 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center flex-shrink-0 group-hover:border-white/15 transition-colors">
      <component :is="iconComponent" class="w-4 h-4 opacity-60 group-hover:opacity-90 transition-opacity" />
    </div>
    <!-- 文字 -->
    <div class="min-w-0">
      <p class="text-sm font-gothic tracking-wide">{{ label }}</p>
      <p class="text-xs opacity-40 gothic-subtitle">{{ subtitle }}</p>
    </div>
    <!-- 箭头 -->
    <svg class="w-4 h-4 ml-auto opacity-20 group-hover:opacity-50 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
      <path d="M9 5l7 7-7 7" />
    </svg>
  </button>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'

const props = defineProps<{
  label: string
  subtitle: string
  icon: string
}>()

// 动态加载 SVG 图标组件
const iconComponent = computed(() => {
  return defineAsyncComponent(() => import(`@/assets/svg/icon-${props.icon}.vue`))
})
</script>
