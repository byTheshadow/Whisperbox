<template>
  <div class="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6">
    <!-- 阶段 1：塔罗牌 -->
    <div v-if="phase === 'tarot'" class="text-center space-y-6 animate-fade-in w-full max-w-xs">
      <!-- 塔罗牌 3D 质感卡面 -->
      <div 
        class="w-28 h-44 mx-auto border border-violet-500/30 rounded-xl flex flex-col justify-between p-3 bg-gradient-to-b from-neutral-900 to-neutral-950 shadow-[0_0_30px_-5px_rgba(139,92,246,0.25)]"
      >
        <div class="text-[9px] text-white/30 tracking-widest text-left">DAILY TAROT</div>
        
        <!-- 图标/符号/SVG 渲染区 -->
        <div class="flex-1 flex items-center justify-center">
          <div 
            v-if="tarotCard?.iconSvg" 
            class="w-10 h-10 text-violet-400/90" 
            v-html="tarotCard.iconSvg" 
          />
          <span 
            v-else-if="tarotCard?.symbol" 
            class="text-4xl text-violet-400/90 font-light"
          >
            {{ tarotCard.symbol }}
          </span>
          <span v-else class="text-3xl text-white/20 font-light">✦</span>
        </div>

        <div class="text-[11px] text-white/80 font-light tracking-wider truncate">
          {{ tarotCard?.name || '未知卡牌' }}
        </div>
      </div>

      <!-- 解读文本区 -->
      <div class="space-y-3">
        <div>
          <h3 class="text-sm text-violet-300 font-light tracking-wide">
            {{ tarotCard?.name || '本日启示' }}
          </h3>
          <!-- 关键词 -->
          <div 
            v-if="tarotCard?.uprightKeywords && tarotCard.uprightKeywords.length > 0" 
            class="flex justify-center gap-1.5 mt-1.5"
          >
            <span 
              v-for="kw in tarotCard.uprightKeywords.slice(0, 3)" 
              :key="kw" 
              class="text-[9px] text-white/35 px-1.5 py-0.5 rounded bg-white/[0.03] border border-white/5"
            >
              {{ kw }}
            </span>
          </div>
        </div>
        
        <!-- 解释显示区：优先使用 AI 解读，AI 解读为空则展示卡牌库本身的释义 -->
        <p class="text-xs text-white/60 leading-relaxed px-4 py-3 bg-white/[0.01] border border-white/5 rounded-lg text-left max-h-48 overflow-y-auto">
          {{ ritual?.tarotInterpretation || tarotCard?.uprightMeaning || '静心凝神，感受当下的能量。' }}
        </p>
      </div>


      <button
        class="text-xs text-white/40 border border-white/20 px-5 py-2 rounded-lg hover:bg-white/5 transition tracking-wider"
        @click="phase = 'whisper'"
      >
        继续
      </button>
    </div>

    <!-- 阶段 2：字卡私语 -->
    <div v-else-if="phase === 'whisper'" class="text-center space-y-6 animate-fade-in w-full max-w-xs">
      <p class="text-xs text-white/45 tracking-widest uppercase">今日私语</p>
      <p class="text-sm text-white/85 max-w-xs leading-relaxed italic px-4">
        "{{ ritual?.whisperContent }}"
      </p>
      <button
        class="text-xs text-white/40 border border-white/20 px-5 py-2 rounded-lg hover:bg-white/5 transition tracking-wider"
        @click="startMeditation"
      >
        继续
      </button>
    </div>

    <!-- 阶段 3：冥想 -->
    <div v-else-if="phase === 'meditate'" class="text-center space-y-6 animate-fade-in">
      <p class="text-xs text-white/45 tracking-widest uppercase">闭上眼睛，深呼吸</p>
      <p class="text-4xl text-white/55 font-extralight tracking-widest">{{ countdown }}</p>
      <p class="text-xs text-white/30">让心绪沉淀，融入此刻</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { DailyRitual } from '@/core/db'
import { generateDailyRitual } from '../services/dailyRitualService'
// 导入塔罗数据源
import { TAROT_DECK } from '@/apps/divination/data/tarotCards'

const emit = defineEmits<{ complete: [] }>()

const phase = ref<'tarot' | 'whisper' | 'meditate'>('tarot')
const ritual = ref<DailyRitual | null>(null)
const countdown = ref(5)

// 根据 DailyRitual 的索引匹配具体的塔罗牌定义
const tarotCard = computed(() => {
  if (!ritual.value || ritual.value.tarotCardIndex === undefined) return null
  const cards = TAROT_DECK.cards
  const idx = ritual.value.tarotCardIndex
  if (idx >= 0 && idx < cards.length) {
    return cards[idx]
  }
  return null
})

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
