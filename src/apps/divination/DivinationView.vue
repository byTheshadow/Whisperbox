<!-- src/apps/divination/DivinationView.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { 
  DivinationStep, 
  DivinationCard,
  DrawnCard,
  DivinationReading 
} from './types'

import { 
  getAvailableDecks, 
  getAvailableSpreads,
  getDeckById,
  getSpreadById,
  shuffleDeck,
  drawCards,
  createReading
} from './services/divinationService'
import { requestAiInterpretation } from './services/aiInterpretService'

import DeckSelector from './components/DeckSelector.vue'
import SpreadSelector from './components/SpreadSelector.vue'
import CardReveal from './components/CardReveal.vue'
import ReadingResult from './components/ReadingResult.vue'

const router = useRouter()

// 流程状态
const currentStep = ref<DivinationStep>('select-deck')

// 选择的牌组和牌阵
const selectedDeckId = ref<string | null>(null)
const selectedSpreadId = ref<string | null>(null)
const question = ref('')

// 数据
const decks = computed(() => getAvailableDecks())
const spreads = computed(() => getAvailableSpreads())
const selectedDeck = computed(() => selectedDeckId.value ? getDeckById(selectedDeckId.value) : null)
const selectedSpread = computed(() => selectedSpreadId.value ? getSpreadById(selectedSpreadId.value) : null)

// 抽牌状态
const shuffledCards = ref<DivinationCard[]>([])
const drawnCards = ref<DrawnCard[]>([])
const revealedIndices = ref<number[]>([])

// 结果
const currentReading = ref<DivinationReading | null>(null)
const isRequestingAi = ref(false)

// 步骤标题
const stepTitle = computed(() => {
  switch (currentStep.value) {
    case 'select-deck': return '选择牌组'
    case 'select-spread': return '选择牌阵'
    case 'input-question': return '你的问题'
    case 'shuffle': return '洗牌'
    case 'draw': return '抽牌'
    case 'reveal': return '翻牌'
    case 'result': return '解读'
    default: return ''
  }
})

// 选择牌组
function handleSelectDeck(deckId: string) {
  selectedDeckId.value = deckId
}

// 选择牌阵
function handleSelectSpread(spreadId: string) {
  selectedSpreadId.value = spreadId
}

// 下一步
function nextStep() {
  switch (currentStep.value) {
    case 'select-deck':
      if (selectedDeckId.value) currentStep.value = 'select-spread'
      break
    case 'select-spread':
      if (selectedSpreadId.value) currentStep.value = 'input-question'
      break
    case 'input-question':
      currentStep.value = 'shuffle'
      break
    case 'shuffle':
      performShuffle()
      break
    case 'draw':
      performDraw()
      break
    case 'reveal':
      if (revealedIndices.value.length === drawnCards.value.length) {
        finishReading()
      }
      break
  }
}

// 上一步
function prevStep() {
  switch (currentStep.value) {
    case 'select-spread':
      currentStep.value = 'select-deck'
      break
    case 'input-question':
      currentStep.value = 'select-spread'
      break
    case 'shuffle':
      currentStep.value = 'input-question'
      break
  }
}

// 洗牌
function performShuffle() {
  if (!selectedDeck.value) return
  shuffledCards.value = shuffleDeck(selectedDeck.value.cards)
  currentStep.value = 'draw'
}

// 抽牌
function performDraw() {
  if (!selectedDeck.value || !selectedSpread.value) return
  drawnCards.value = drawCards(selectedDeck.value, selectedSpread.value, shuffledCards.value)
  revealedIndices.value = []
  currentStep.value = 'reveal'
}

// 翻牌
function handleReveal(index: number) {
  if (!revealedIndices.value.includes(index)) {
    revealedIndices.value.push(index)
  }
}

// 完成占卜
function finishReading() {
  if (!selectedDeckId.value || !selectedSpreadId.value) return
  
  currentReading.value = createReading(
    selectedDeckId.value,
    selectedSpreadId.value,
    question.value,
    drawnCards.value
  )
  currentStep.value = 'result'
}

// 请求 AI 解读
async function handleRequestAi() {
  if (!currentReading.value || !selectedDeck.value || !selectedSpread.value) return
  
  isRequestingAi.value = true
  try {
    const interpretation = await requestAiInterpretation(
      currentReading.value,
      selectedDeck.value,
      selectedSpread.value
    )
    currentReading.value.aiInterpretation = interpretation
  } finally {
    isRequestingAi.value = false
  }
}

// 重新开始
function restart() {
  currentStep.value = 'select-deck'
  selectedDeckId.value = null
  selectedSpreadId.value = null
  question.value = ''
  shuffledCards.value = []
  drawnCards.value = []
  revealedIndices.value = []
  currentReading.value = null
}
</script>

<template>
  <div class="min-h-screen bg-black text-white flex flex-col">
    <!-- 顶栏 -->
    <header class="flex items-center justify-between px-4 py-3 border-b border-white/5">
      <button 
        class="text-white/40 hover:text-white/60 transition text-sm"
        @click="router.push('/')"
      >
        ← 返回
      </button>
      
      <h1 class="text-sm text-white/60 font-light">{{ stepTitle }}</h1>
      
      <div class="w-12" />
    </header>
    
    <!-- 内容区 -->
    <main class="flex-1 overflow-auto p-4">
      <!-- 选择牌组 -->
      <template v-if="currentStep === 'select-deck'">
        <DeckSelector
          :decks="decks"
          :selected-deck-id="selectedDeckId"
          @select="handleSelectDeck"
        />
      </template>
      
      <!-- 选择牌阵 -->
      <template v-else-if="currentStep === 'select-spread'">
        <SpreadSelector
          :spreads="spreads"
          :selected-spread-id="selectedSpreadId"
          @select="handleSelectSpread"
        />
      </template>
      
      <!-- 输入问题 -->
      <template v-else-if="currentStep === 'input-question'">
        <div class="space-y-4">
          <div class="text-xs text-white/40">
            可以留空，进行整体指引
          </div>
          
          <textarea
            v-model="question"
            class="w-full h-32 bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white/80 placeholder-white/30 resize-none focus:outline-none focus:border-violet-500/50"
            placeholder="输入你想问的问题..."
          />
        </div>
      </template>
      
      <!-- 洗牌 -->
      <template v-else-if="currentStep === 'shuffle'">
        <div class="flex flex-col items-center justify-center py-20 space-y-6">
          <div class="text-sm text-white/60">集中精神，想着你的问题</div>
          <div class="text-xs text-white/30">准备好后点击下方按钮洗牌</div>
        </div>
      </template>
      
      <!-- 抽牌 -->
      <template v-else-if="currentStep === 'draw'">
        <div class="flex flex-col items-center justify-center py-20 space-y-6">
          <div class="text-sm text-white/60">牌已洗好</div>
          <div class="text-xs text-white/30">
            将抽取 {{ selectedSpread?.positions.length ?? 0 }} 张牌
          </div>
        </div>
      </template>
      
      <!-- 翻牌 -->
      <template v-else-if="currentStep === 'reveal'">
        <div class="space-y-6">
          <div class="text-xs text-white/40 text-center">
            点击卡牌翻开（{{ revealedIndices.length }} / {{ drawnCards.length }}）
          </div>
          
          <CardReveal
            :drawn-cards="drawnCards"
            :revealed-indices="revealedIndices"
            :back-image-url="selectedDeck?.backImageUrl ?? ''"
            @reveal="handleReveal"
          />
        </div>
      </template>
      
      <!-- 结果 -->
      <template v-else-if="currentStep === 'result' && currentReading">
        <ReadingResult
          :reading="currentReading"
          :deck="selectedDeck"
          :spread="selectedSpread"
          @request-ai="handleRequestAi"
          @close="restart"
        />
      </template>
    </main>
    
    <!-- 底部操作栏 -->
    <footer 
      v-if="currentStep !== 'result'"
      class="px-4 py-4 border-t border-white/5"
    >
      <div class="flex gap-3">
        <button
          v-if="['select-spread', 'input-question', 'shuffle'].includes(currentStep)"
          class="flex-1 py-3 rounded-lg border border-white/10 text-white/40 text-sm hover:bg-white/5 transition"
          @click="prevStep"
        >
          上一步
        </button>
        
        <button
          class="flex-1 py-3 rounded-lg text-sm transition"
          :class="
            (currentStep === 'select-deck' && !selectedDeckId) ||
            (currentStep === 'select-spread' && !selectedSpreadId)
              ? 'bg-white/5 text-white/20 cursor-not-allowed'
              : 'bg-violet-600 text-white hover:bg-violet-500'
          "
          :disabled="
            (currentStep === 'select-deck' && !selectedDeckId) ||
            (currentStep === 'select-spread' && !selectedSpreadId)
          "
          @click="nextStep"
        >
          <template v-if="currentStep === 'shuffle'">洗牌</template>
          <template v-else-if="currentStep === 'draw'">抽牌</template>
          <template v-else-if="currentStep === 'reveal'">
            {{ revealedIndices.length === drawnCards.length ? '查看解读' : '继续翻牌' }}
          </template>
          <template v-else>下一步</template>
        </button>
      </div>
    </footer>
  </div>
</template>
