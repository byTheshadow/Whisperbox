<template>
  <div class="main-view h-full px-6 py-4 grid grid-cols-12 gap-4 animate-fade-in">
    <!-- 左栏：今日留言 + 一起听歌 -->
    <aside class="col-span-3 flex flex-col gap-4">
      <!-- 今日留言字卡 -->
      <section class="glass-panel p-6 flex-1 flex flex-col justify-center items-center text-center">
        <p class="font-body text-xl leading-relaxed italic opacity-80">
          {{ dailyWhisper }}
        </p>
        <span class="gothic-subtitle text-xs mt-4 block">— 今日感应 —</span>
      </section>

      <!-- 一起听歌（静态装饰组件） -->
      <section class="glass-panel p-4 flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
          <svg class="w-5 h-5 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        </div>
        <div class="min-w-0">
          <p class="text-sm truncate opacity-70">Silence is Golden</p>
          <p class="text-xs opacity-40 gothic-subtitle">ambient · now playing</p>
        </div>
      </section>
    </aside>

    <!-- 中栏：角色状态卡片 -->
    <section class="col-span-5 glass-panel p-8 flex flex-col items-center justify-center text-center">
      <!-- 角色头像占位 -->
      <div class="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
        <svg class="w-10 h-10 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" aria-hidden="true">
          <path d="M12 2L13.09 8.26L19 7L14.14 11.14L18 17L12 14.27L6 17L9.86 11.14L5 7L10.91 8.26L12 2Z" />
        </svg>
      </div>
      <h2 class="gothic-title text-lg tracking-wide opacity-90">尚未绑定角色</h2>
      <p class="gothic-subtitle text-sm mt-2">导入一张角色卡开始你的旅途</p>

      <!-- 状态指示 -->
      <div class="mt-8 flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-white/20 animate-pulse-slow"></span>
        <span class="text-xs opacity-40">沉睡中</span>
      </div>
    </section>

    <!-- 右栏：App 入口网格 -->
    <nav class="col-span-4 flex flex-col gap-3" aria-label="应用导航">
      <AppEntryButton
        v-for="app in appEntries"
        :key="app.name"
        :label="app.label"
        :subtitle="app.subtitle"
        :icon="app.icon"
        @click="$router.push(app.route)"
      />
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AppEntryButton from './components/AppEntryButton.vue'

const dailyWhisper = ref('在沉默中，真实的声音才会浮现。')

const appEntries = [
  { name: 'chat', label: '短信', subtitle: 'Messages', icon: 'chat', route: '/chat' },
  { name: 'cards', label: '字卡', subtitle: 'Whisper Cards', icon: 'cards', route: '/cards' },
  { name: 'memory', label: '记忆', subtitle: 'Memory', icon: 'memory', route: '/memory' },
  { name: 'todo', label: '待办', subtitle: 'Todo', icon: 'todo', route: '/todo' },
  { name: 'notes', label: '备忘录', subtitle: 'Notebook', icon: 'notes', route: '/notes' },
  { name: 'divination', label: '占卜', subtitle: 'Divination', icon: 'divination', route: '/divination' },
  { name: 'settings', label: '设置', subtitle: 'Settings', icon: 'settings', route: '/settings' },
]
</script>
