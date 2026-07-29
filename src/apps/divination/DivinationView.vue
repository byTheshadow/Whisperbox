<!-- src/apps/divination/DivinationView.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { 
  DivinationStep, 
  Deck, 
  Spread, 
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
import ShuffleAnimation from './components/ShuffleAnimation.vue'

const router = useRouter()

// 流程状态
const currentStep = ref<DivinationStep>('select-deck')

// 选择的牌组和牌阵
const selectedDeckId = ref<string | null>(null)
const selectedSpreadId = ref<string | null>(null)

// 问题输入模式与内容
const questionMode = ref<'write' | 'meditate'>('write')
const question = ref('')

// 数据
const decks = computed(() => getAvailableDecks())
const spreads = computed(() => getAvailableSpreads())
const selectedDeck = computed<Deck | null>(() => selectedDeckId.value ? getDeckById(selectedDeckId.value) : null)
const selectedSpread = computed<Spread | null>(() => selectedSpreadId.value ? getSpreadById(selectedSpreadId.value) : null)

// 抽牌状态
const shuffledCards = ref<DivinationCard[]>([])
const drawnCards = ref<DrawnCard[]>([])
const revealedIndices = ref<number[]>([])

// 结果
const currentReading = ref<DivinationReading | null>(null)
const isRequestingAi = ref(false)
const aiError = ref<string | null>(null)

// 步骤标题
const stepTitle = computed(() => {
  switch (currentStep.value) {
    case 'select-deck': return '选择牌组'
    case 'select-spread': return '选择牌阵'
    case 'input-question': return '设定问题'
    case 'shuffle': return '洗牌'
    case 'draw': return '抽牌'
    case 'reveal': return '翻牌'
    case 'result': return '解读'
    default: return ''
  }
})

function handleSelectDeck(deckId: string) {
  selectedDeckId.value = deckId
}

function handleSelectSpread(spreadId: string) {
  selectedSpreadId.value = spreadId
}

function nextStep() {
  switch (currentStep.value) {
    case 'select-deck':
      if (selectedDeckId.value) currentStep.value = 'select-spread'
      break
    case 'select-spread':
      if (selectedSpreadId.value) currentStep.value = 'input-question'
      break
    case 'input-question':
      if (questionMode.value === 'meditate') {
        question.value = ''
      }
      currentStep.value = 'shuffle'
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

function prevStep() {
  switch (currentStep.value) {
    case 'select-spread':
      currentStep.value = 'select-deck'
      break
    case 'input-question':
      currentStep.value = 'select-spread'
      break
  }
}

/** 洗牌动画结束后触发 */
function handleShuffleFinished() {
  if (!selectedDeck.value) return
  shuffledCards.value = shuffleDeck(selectedDeck.value.cards)
  currentStep.value = 'draw'
}

function performDraw() {
  if (!selectedDeck.value || !selectedSpread.value) return
  drawnCards.value = drawCards(selectedDeck.value, selectedSpread.value, shuffledCards.value)
  revealedIndices.value = []
  currentStep.value = 'reveal'
}

function handleReveal(index: number) {
  if (!revealedIndices.value.includes(index)) {
    revealedIndices.value.push(index)
  }
}

function finishReading() {
  if (!selectedDeckId.value || !selectedSpreadId.value) return
  
  const finalQuestion = questionMode.value === 'meditate' 
    ? '（心中默念问题）' 
    : (question.value.trim() || '无具体问题，整体指引')

  currentReading.value = createReading(
    selectedDeckId.value,
    selectedSpreadId.value,
    finalQuestion,
    drawnCards.value
  )
  aiError.value = null
  currentStep.value = 'result'
}

/** 请求 AI 解读 */
async function handleRequestAi() {
  if (!currentReading.value || !selectedDeck.value || !selectedSpread.value) return
  
  aiError.value = null
  isRequestingAi.value = true

  try {
    const interpretation = await requestAiInterpretation(
      currentReading.value,
      selectedDeck.value,
      selectedSpread.value
    )
    currentReading.value.aiInterpretation = interpretation
  } catch (err) {
    aiError.value = (err as Error).message || '解读请求失败'
  } finally {
    isRequestingAi.value = false
  }
}

/** 重试 AI 解读 */
function handleRetryAi() {
  handleRequestAi()
}

function restart() {
  currentStep.value = 'select-deck'
  selectedDeckId.value = null
  selectedSpreadId.value = null
  question.value = ''
  shuffledCards.value = []
  drawnCards.value = []
  revealedIndices.value = []
  currentReading.value = null
  aiError.value = null
  isRequestingAi.value = false
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
          :deck-type="selectedDeck?.type ?? null"
          @select="handleSelectSpread"
        />
      </template>
      
      <!-- 输入问题 -->
      <template v-else-if="currentStep === 'input-question'">
        <div class="space-y-6">
          <div class="flex bg-neutral-900/50 p-1 rounded-lg border border-white/5">
            <button
              class="flex-1 py-2 text-xs rounded transition"
              :class="questionMode === 'write' ? 'bg-violet-600/20 text-violet-300 border border-violet-500/20' : 'text-white/40 hover:text-white/60'"
              @click="questionMode = 'write'"
            >
              写下问题
            </button>
            <button
              class="flex-1 py-2 text-xs rounded transition"
              :class="questionMode === 'meditate' ? 'bg-violet-600/20 text-violet-300 border border-violet-500/20' : 'text-white/40 hover:text-white/60'"
              @click="questionMode = 'meditate'"
            >
              心中默念
            </button>
          </div>

          <div v-if="questionMode === 'write'" class="space-y-4">
            <div class="text-xs text-white/40">
              写下你的具体问题，有助于 AI 提供更精准的能量解读。
            </div>
            
            <textarea
              v-model="question"
              class="w-full h-32 bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white/80 placeholder-white/30 resize-none focus:outline-none focus:border-violet-500/50 transition"
              placeholder="输入你想问的问题（例如：未来三个月我的职业发展运势如何？）"
            />
          </div>

          <div v-else class="flex flex-col items-center justify-center py-10 space-y-4 text-center">
            <div class="w-12 h-12 rounded-full border border-violet-500/30 flex items-center justify-center text-violet-400 animate-pulse bg-violet-500/5">
              ✨
            </div>
            <div class="space-y-2">
              <h4 class="text-sm text-white/80 font-light">闭上双眼，集中精神</h4>
              <p class="text-xs text-white/40 max-w-[280px] leading-relaxed mx-auto">
                在脑海中清晰地勾勒出你想问的人、事或情境。重复默念你的问题三遍，当内心感到平静时，即可进入下一步。
              </p>
            </div>
          </div>
        </div>
      </template>
      
      <!-- 洗牌（自动播放动画） -->
      <template v-else-if="currentStep === 'shuffle'">
        <ShuffleAnimation @finish="handleShuffleFinished" />
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
          :is-requesting="isRequestingAi"
          :error="aiError"
          @request-ai="handleRequestAi"
          @retry-ai="handleRetryAi"
          @close="restart"
        />
      </template>
    </main>
    
    <!-- 底部操作栏 -->
    <footer 
      v-if="currentStep !== 'result' && currentStep !== 'shuffle'"
      class="px-4 py-4 border-t border-white/5"
    >
      <div class="flex gap-3">
        <button
          v-if="['select-spread', 'input-question'].includes(currentStep)"
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
          <template v-if="currentStep === 'input-question' && questionMode === 'meditate'">我已准备好</template>
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

