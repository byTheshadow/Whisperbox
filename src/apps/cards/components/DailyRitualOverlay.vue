<template>
  <div class="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6">
    <!-- 阶段 1：塔罗牌 -->
    <div v-if="phase === 'tarot'" class="text-center space-y-6 animate-fade-in">
      <div class="w-24 h-36 mx-auto border border-white/20 rounded flex items-center justify-center bg-white/5 backdrop-blur">
        <span class="text-2xl text-white/60">{{ ritual?.tarotCardIndex }}</span>
      </div>
      <p class="text-sm text-white/70 max-w-xs leading-relaxed">
        {{ ritual?.tarotInterpretation }}
      </p>
      <button
        class="text-xs text-white/40 border border-white/20 px-4 py-1.5 rounded hover:bg-white/10 transition"
        @click="phase = 'whisper'"
      >
        继续
      </button>
    </div>

    <!-- 阶段 2：字卡私语 -->
    <div v-else-if="phase === 'whisper'" class="text-center space-y-6 animate-fade-in">
      <p class="text-xs text-white/40">今日私语</p>
      <p class="text-sm text-white/80 max-w-xs leading-relaxed italic">
        "{{ ritual?.whisperContent }}"
      </p>
      <button
        class="text-xs text-white/40 border border-white/20 px-4 py-1.5 rounded hover:bg-white/10 transition"
        @click="startMeditation"
      >
        继续
      </button>
    </div>

    <!-- 阶段 3：冥想 -->
    <div v-else-if="phase === 'meditate'" class="text-center space-y-6 animate-fade-in">
      <p class="text-xs text-white/40">闭上眼睛，深呼吸</p>
      <p class="text-3xl text-white/60 font-light">{{ countdown }}</p>
      <p class="text-xs text-white/30">让自己安静下来</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { DailyRitual } from '@/core/db'
import { generateDailyRitual } from '../services/dailyRitualService'

const emit = defineEmits<{ complete: [] }>()

const phase = ref<'tarot' | 'whisper' | 'meditate'>('tarot')
const ritual = ref<DailyRitual | null>(null)
const countdown = ref(5)

onMounted(async () => {
  ritual.value = await generateDailyRitual()
})

function startMeditation() {
  phase.value = 'meditate'
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
      emit('complete')
    }
  }, 1000)
}
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.6s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
