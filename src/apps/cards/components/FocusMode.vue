<template>
  <div class="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6">
    <!-- 未开始 -->
    <div v-if="state === 'setup'" class="w-full max-w-sm space-y-6 animate-fade-in">
      <h2 class="text-sm text-white/80 text-center font-light">专注模式</h2>

      <!-- 时间档位 -->
      <div class="space-y-2">
        <label class="text-xs text-white/40">专注时长</label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="preset in timePresets"
            :key="preset"
            class="text-xs px-3 py-1.5 rounded border transition"
            :class="selectedMinutes === preset ? 'border-white/60 text-white/90 bg-white/10' : 'border-white/10 text-white/40 hover:bg-white/5'"
            @click="selectedMinutes = preset; customMinutes = ''"
          >
            {{ preset }} 分钟
          </button>
          <input
            v-model="customMinutes"
            type="number"
            min="1"
            placeholder="自定义"
            class="w-20 text-xs bg-black border border-white/20 rounded px-2 py-1.5 text-white/80 text-center"
            @input="selectedMinutes = 0"
          />
        </div>
      </div>

      <!-- 本次专注目标 -->
      <div class="space-y-2">
        <label class="text-xs text-white/40">本次专注目标</label>
        <input
          v-model="focusGoal"
          class="w-full bg-black border border-white/20 rounded px-3 py-2 text-sm text-white/80"
          placeholder="今天想做什么？"
        />
      </div>

      <!-- 角色去做什么 -->
      <div class="space-y-2">
        <label class="text-xs text-white/40">{{ characterName }} 在这段时间会做什么</label>
        <div class="space-y-1 max-h-28 overflow-y-auto">
          <button
            v-for="(activity, idx) in characterActivities"
            :key="idx"
            class="block w-full text-left text-xs px-3 py-1.5 rounded border transition"
            :class="selectedActivity === activity ? 'border-white/60 text-white/90 bg-white/10' : 'border-white/10 text-white/40 hover:bg-white/5'"
            @click="selectedActivity = activity"
          >
            {{ activity }}
          </button>
        </div>
        <button class="text-xs text-white/30 underline" @click="showAddActivity = true">+ 添加选项</button>
      </div>

      <!-- 添加选项输入 -->
      <div v-if="showAddActivity" class="flex gap-2">
        <input
          v-model="newActivity"
          class="flex-1 bg-black border border-white/20 rounded px-2 py-1 text-xs text-white/80"
          placeholder="角色可以做的事..."
          @keyup.enter="addActivity"
        />
        <button class="text-xs text-white/60 border border-white/20 px-2 py-1 rounded" @click="addActivity">添加</button>
      </div>

      <!-- 开始按钮 -->
      <button
        class="w-full text-sm text-white/80 border border-white/20 py-2.5 rounded hover:bg-white/10 transition"
        :disabled="effectiveMinutes <= 0"
        @click="startFocus"
      >
        开始专注
      </button>

      <button class="w-full text-xs text-white/30 py-1" @click="$emit('close')">取消</button>
    </div>

    <!-- 专注中 -->
    <div v-else-if="state === 'focusing'" class="text-center space-y-8 animate-fade-in">
      <!-- 倒计时 -->
      <div>
        <p class="text-xs text-white/40 mb-2">专注中</p>
        <p class="text-4xl font-light text-white/80 tabular-nums">
          {{ formatCountdown(remainingSeconds) }}
        </p>
      </div>

      <!-- 目标 -->
      <p v-if="focusGoal" class="text-xs text-white/50 max-w-xs">
        目标：{{ focusGoal }}
      </p>

      <!-- 角色状态 -->
      <div class="border border-white/10 rounded px-4 py-3 bg-white/5 backdrop-blur max-w-xs">
        <p class="text-xs text-white/30 mb-1">{{ characterName }}</p>
        <p class="text-sm text-white/60 italic">{{ selectedActivity || '陪伴中' }}</p>
      </div>

      <!-- 放弃按钮 -->
      <button
        class="text-xs text-white/20 hover:text-white/40 transition"
        @click="endFocus(false)"
      >
        结束专注
      </button>
    </div>

    <!-- 完成 -->
    <div v-else-if="state === 'done'" class="text-center space-y-6 animate-fade-in">
      <p class="text-xs text-white/40">专注完成</p>
      <p class="text-lg text-white/80 font-light">辛苦了</p>
      <p v-if="focusGoal" class="text-xs text-white/50">{{ focusGoal }}</p>

      <div class="border border-white/10 rounded px-4 py-3 bg-white/5 backdrop-blur max-w-xs mx-auto">
        <p class="text-xs text-white/30 mb-1">{{ characterName }} 回来了</p>
        <p class="text-sm text-white/60 italic">"{{ completionMessage }}"</p>
      </div>

      <button
        class="text-xs text-white/60 border border-white/20 px-4 py-1.5 rounded hover:bg-white/10 transition"
        @click="$emit('close')"
      >
        关闭
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'

const props = defineProps<{
  characterName: string
  initialActivities?: string[]
}>()

const emit = defineEmits<{ close: []; completed: [minutes: number, goal: string] }>()

const state = ref<'setup' | 'focusing' | 'done'>('setup')

// 设置阶段
const timePresets = [5, 15, 25, 45, 60]
const selectedMinutes = ref(25)
const customMinutes = ref('')
const focusGoal = ref('')
const selectedActivity = ref('')
const characterActivities = ref<string[]>(
  props.initialActivities?.length
    ? [...props.initialActivities]
    : ['读书', '画画', '散步', '发呆', '睡觉', '写东西']
)
const showAddActivity = ref(false)
const newActivity = ref('')

const effectiveMinutes = computed(() => {
  if (customMinutes.value) return parseInt(customMinutes.value) || 0
  return selectedMinutes.value
})

// 专注阶段
const remainingSeconds = ref(0)
let countdownInterval: ReturnType<typeof setInterval> | null = null

// 完成阶段
const completionMessages = [
  '我回来了，你做得很好。',
  '时间到了，休息一下吧。',
  '专注的你很好看。',
  '我们都完成了自己的事。',
  '辛苦了，要喝点什么吗？'
]
const completionMessage = ref('')

function addActivity() {
  const text = newActivity.value.trim()
  if (text && !characterActivities.value.includes(text)) {
    characterActivities.value.push(text)
  }
  newActivity.value = ''
  showAddActivity.value = false
}

function startFocus() {
  const minutes = effectiveMinutes.value
  if (minutes <= 0) return

  state.value = 'focusing'
  remainingSeconds.value = minutes * 60

  countdownInterval = setInterval(() => {
    remainingSeconds.value--
    if (remainingSeconds.value <= 0) {
      endFocus(true)
    }
  }, 1000)
}

function endFocus(completed: boolean) {
  if (countdownInterval) {
    clearInterval(countdownInterval)
    countdownInterval = null
  }

  if (completed) {
    completionMessage.value = completionMessages[Math.floor(Math.random() * completionMessages.length)]
    state.value = 'done'
    emit('completed', effectiveMinutes.value, focusGoal.value)
  } else {
    emit('close')
  }
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

onUnmounted(() => {
  if (countdownInterval) clearInterval(countdownInterval)
})
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
