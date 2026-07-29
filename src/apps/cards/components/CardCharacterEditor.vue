<template>
  <div
    class="fixed inset-0 z-50 bg-black/90 backdrop-blur flex items-center justify-center p-4"
    @click.self="$emit('close')"
  >
    <div class="w-full max-w-sm bg-neutral-900 border border-white/10 rounded-lg p-5 space-y-4">
      <h2 class="text-sm text-white/80 font-light">
        {{ props.character ? '编辑角色' : '新建字卡角色' }}
      </h2>

      <!-- 头像 -->
      <div class="space-y-2">
        <label class="text-xs text-white/40">头像</label>
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
            <img
              v-if="form.avatar"
              :src="form.avatar"
              class="w-full h-full object-cover"
              alt=""
            />
            <div
              v-else
              class="w-full h-full flex items-center justify-center text-white/30 text-xs"
            >
              ?
            </div>
          </div>

          <label
            class="text-xs text-white/40 border border-white/20 px-3 py-1.5 rounded cursor-pointer hover:bg-white/10 transition"
          >
            选择图片
            <input
              type="file"
              accept="image/*"
              class="hidden"
              @change="onAvatarChange"
            />
          </label>
        </div>
      </div>

      <!-- 名称 -->
      <div class="space-y-2">
        <label class="text-xs text-white/40">角色名称</label>
        <input
          v-model="form.name"
          class="w-full bg-black border border-white/20 rounded px-3 py-2 text-sm text-white/80 outline-none focus:border-white/40"
          placeholder="角色名称"
        />
      </div>

      <!-- 人格 -->
      <div class="space-y-2">
        <label class="text-xs text-white/40">人格 / 气质描述</label>
        <textarea
          v-model="form.personality"
          class="w-full bg-black border border-white/20 rounded px-3 py-2 text-sm text-white/80 h-20 resize-none outline-none focus:border-white/40"
          placeholder="可以填写角色的语气、气质、存在感"
        />
      </div>

      <!-- 状态文本 -->
      <div class="space-y-2">
        <label class="text-xs text-white/40">状态文本（一行一条）</label>
        <textarea
          v-model="statusRaw"
          class="w-full bg-black border border-white/20 rounded px-3 py-2 text-sm text-white/80 h-20 resize-none outline-none focus:border-white/40"
          placeholder="在线&#10;翻阅旧信&#10;沉默"
        />
      </div>

      <!-- 绑定字卡库 -->
      <div class="space-y-2">
        <label class="text-xs text-white/40">绑定字卡库</label>

        <div
          v-if="libraries.length > 0"
          class="max-h-32 overflow-y-auto space-y-1 rounded border border-white/10 bg-black/30 px-3 py-2"
        >
          <label
            v-for="library in libraries"
            :key="library.id"
            class="flex items-center gap-2 py-1 text-xs text-white/60 cursor-pointer"
          >
            <input
              v-model="selectedLibraryIds"
              type="checkbox"
              :value="library.id"
              class="accent-white"
            />
            <span class="truncate">{{ library.name }}</span>
          </label>
        </div>

        <p v-else class="text-xs text-white/25">
          暂无字卡库，请先前往字卡库管理创建。
        </p>

        <p class="text-xs text-white/25 leading-5">
          角色会从绑定的字卡库中随机送出内容。
        </p>
      </div>

      <!-- 操作 -->
      <div class="flex justify-end gap-3 pt-2">
        <button
          class="text-xs text-white/40 px-3 py-1.5 border border-white/10 rounded hover:bg-white/5 transition"
          @click="$emit('close')"
        >
          取消
        </button>

        <button
          class="text-xs text-white/80 px-3 py-1.5 border border-white/20 rounded hover:bg-white/10 transition disabled:opacity-30 disabled:cursor-not-allowed"
          :disabled="!form.name.trim()"
          @click="handleSave"
        >
          保存
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import type { CardCharacter, CardLibrary } from '@/core/db'
import {
  createCardCharacter,
  updateCardCharacter
} from '../services/cardCharacterService'
import {
  getAllLibraries,
  getLibrariesByCharacterId,
  setCharacterLibraries
} from '../services/cardLibraryService'

const props = withDefaults(
  defineProps<{
    character?: CardCharacter | null
  }>(),
  {
    character: null
  }
)

const emit = defineEmits<{
  close: []
  created: []
  saved: [character?: CardCharacter]
}>()

const form = reactive({
  name: '',
  avatar: '',
  personality: ''
})

const statusRaw = ref('在线\n离开\n发呆中\n思考中\n沉默')

const libraries = ref<CardLibrary[]>([])
const selectedLibraryIds = ref<string[]>([])

watch(
  () => props.character,
  character => {
    form.name = character?.name || ''
    form.avatar = character?.avatar || ''
    form.personality = character?.personality || ''

    statusRaw.value = character
      ? (character.statusTexts || []).join('\n')
      : '在线\n离开\n发呆中\n思考中\n沉默'
  },
  { immediate: true }
)

onMounted(async () => {
  libraries.value = await getAllLibraries()

  if (props.character?.id) {
    const boundLibraries = await getLibrariesByCharacterId(props.character.id)
    selectedLibraryIds.value = boundLibraries.map(library => library.id)
  }
})

function onAvatarChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    form.avatar = reader.result as string
  }
  reader.readAsDataURL(file)
}

function normalizeStatusTexts(): string[] {
  const list = statusRaw.value
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean)

  return [...new Set(list)]
}

async function handleSave() {
  const payload = {
    name: form.name.trim(),
    avatar: form.avatar,
    personality: form.personality.trim(),
    statusTexts: [...normalizeStatusTexts()]
  }

  if (!payload.name) return

  let savedCharacter: CardCharacter

  if (props.character) {
    await updateCardCharacter(props.character.id, payload)

    savedCharacter = {
      ...props.character,
      ...payload,
      updatedAt: Date.now()
    }
  } else {
    savedCharacter = await createCardCharacter(payload)
  }

  await setCharacterLibraries(
    savedCharacter.id,
    [...selectedLibraryIds.value]
  )

  emit('saved', savedCharacter)
  emit('created')
}
</script>
