<template>
  <button
    class="glass-panel px-4 sm:px-5 py-3 flex items-center gap-3 sm:gap-4 text-left group transition-all
           hover:scale-[1.01] active:scale-[0.99] min-h-[56px] sm:min-h-[unset]"
    :aria-label="label"
  >
    <div class="w-9 h-9 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center flex-shrink-0
                group-hover:border-white/15 transition-colors">
      <component :is="iconComponent" class="w-4 h-4 opacity-60 group-hover:opacity-90 transition-opacity" />
    </div>

    <div class="min-w-0">
      <p class="text-sm sm:text-sm font-gothic tracking-wide">{{ label }}</p>
      <p class="text-[11px] sm:text-xs opacity-40 gothic-subtitle">{{ subtitle }}</p>
    </div>

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

const iconComponent = computed(() => {
  return defineAsyncComponent(() => import(`@/assets/svg/icon-${props.icon}.vue`))
})
</script>
