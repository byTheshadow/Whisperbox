<template>
  <div class="main-view min-h-[calc(100vh-2.5rem)] px-3 sm:px-4 lg:px-6 py-4 animate-fade-in">
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-4">
      <!-- 左栏：今日留言 + 听歌 -->
      <aside class="lg:col-span-3 flex flex-col gap-4 order-1">
        <section class="glass-panel p-4 sm:p-5 lg:p-6 flex-1 flex flex-col justify-center items-center text-center min-h-[180px] sm:min-h-[220px]">
          <p class="font-body text-lg sm:text-xl lg:text-xl leading-relaxed italic opacity-80">
            {{ dailyWhisper }}
          </p>
          <span class="gothic-subtitle text-xs mt-4 block">— 今日感应 —</span>
        </section>

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
      <section class="lg:col-span-5 glass-panel p-5 sm:p-6 lg:p-8 flex flex-col items-center justify-center text-center order-2 min-h-[240px] sm:min-h-[280px]">
        <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-5 sm:mb-6">
          <svg class="w-8 h-8 sm:w-10 sm:h-10 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" aria-hidden="true">
            <path d="M12 2L13.09 8.26L19 7L14.14 11.14L18 17L12 14.27L6 17L9.86 11.14L5 7L10.91 8.26L12 2Z" />
          </svg>
        </div>
        <h2 class="gothic-title text-base sm:text-lg tracking-wide opacity-90">尚未绑定角色</h2>
        <p class="gothic-subtitle text-sm mt-2">导入一张角色卡开始你的旅途</p>

        <div class="mt-6 sm:mt-8 flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-white/20 animate-pulse-slow"></span>
          <span class="text-xs opacity-40">沉睡中</span>
        </div>
      </section>

      <!-- 右栏：App 入口 -->
      <nav class="lg:col-span-4 order-3">
        <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-1 gap-3">
          <AppEntryButton
            v-for="app in appEntries"
            :key="app.name"
            :label="app.label"
            :subtitle="app.subtitle"
            :icon="app.icon"
            @click="$router.push(app.route)"
          />
        </div>
      </nav>
    </div>
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
