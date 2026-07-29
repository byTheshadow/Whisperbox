<template>
  <div class="fixed inset-0 z-50 bg-black/90 backdrop-blur flex items-center justify-center p-4" @click.self="$emit('close')">
    <div class="w-full max-w-sm bg-neutral-900 border border-white/10 rounded-lg p-5 space-y-4">
      <h2 class="text-sm text-white/80 font-light">
        {{ editId ? '编辑角色' : '新建字卡角色' }}
      </h2>

      <!-- 头像 -->
      <div class="space-y-2">
        <label class="text-xs text-white/40">头像</label>
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
            <img v-if="form.avatar" :src="form.avatar" class="w-full h-full object-cover" alt="" />
            <div v-else class="w-full h-full flex items-center justify-center text-white/30 text-xs">?</div>
          </div>
          <label class="text-xs text-white/40 border border-white/20 px-3 py-1.5 rounded cursor-pointer hover:bg-white/10 transition">
            选择图片
            <input type="file" accept="image/*" class="hidden" @change="onAvatarChange" />
          </label>
        </div>
      </div>

      <!-- 姓名 -->
      <div class="space-y-2">
        <label class="text-xs text-white/40">姓名</label>
        <input
          v-model="form.name"
          class="w-full bg-black border border-white/20 rounded px-3 py-2 text-sm text-white/80"
          placeholder="角色名称"
        />
      </div>

      <!-- 性格 / 链接感描述 -->
      <div class="space-y-2">
        <label class="text-xs text-white/40">性格 / 链接感描述</label>
        <textarea
          v-model="form.personality"
          class="w-full bg-black border border-white/20 rounded px-3 py-2 text-sm text-white/80 h-20 resize-none"
          placeholder="可以填写具有链接感的内容"
        />
      </div>

      <!-- 状态文本 -->
      <div class="space-y-2">
        <label class="text-xs text-white/40">状态文本（一行一条）</label>
        <textarea
          v-model="statusRaw"
          class="w-full bg-black border border-white/20 rounded px-3 py-2 text-sm text-white/80 h-16 resize-none"
          placeholder="在线&#10;离开&#10;发呆中"
        />
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
          class="text-xs text-white/80 px-3 py-1.5 border border-white/20 rounded hover:bg-white/10 transition"
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
import { ref } from 'vue'
import { createCardCharacter, updateCardCharacter } from '../services/cardSessionService'

const props = defineProps<{
  editId?: string
  editData?: { name: string; avatar: string; personality: string; statusTexts: string[] }
}>()

const emit = defineEmits<{ close: []; created: [] }>()

const form = ref({
  name: props.editData?.name || '',
  avatar: props.editData?.avatar || '',
  personality: props.editData?.personality || ''
})

const statusRaw = ref(
  props.editData?.statusTexts?.join('\n') || '在线\n离开\n发呆中\n思考中\n沉默'
)

function onAvatarChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    form.value.avatar = reader.result as string
  }
  reader.readAsDataURL(file)
}

async function handleSave() {
  const statusTexts = statusRaw.value.split('\n').map(s => s.trim()).filter(s => s)

  if (props.editId) {
    await updateCardCharacter(props.editId, {
      name: form.value.name,
      avatar: form.value.avatar,
      personality: form.value.personality,
      statusTexts
    })
  } else {
    await createCardCharacter({
      name: form.value.name,
      avatar: form.value.avatar,
      personality: form.value.personality,
      statusTexts
    })
  }
  emit('created')
}
</script>
