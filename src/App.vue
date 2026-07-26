<template>
  <div class="app-shell w-screen h-screen relative overflow-x-hidden overflow-y-auto">
    <!-- 背景纹理层 -->
    <div class="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none" aria-hidden="true"></div>

    <!-- 自定义标题栏 -->
    <header
      data-tauri-drag-region
      class="fixed top-0 left-0 right-0 h-10 sm:h-8 z-50 flex items-center justify-between px-3 sm:px-4
             backdrop-blur-md bg-black/20 border-b border-white/5"
    >
      <span class="gothic-title text-[10px] sm:text-xs tracking-[0.25em] opacity-40 select-none">
        WHISPERBOX
      </span>

      <div class="flex items-center gap-2 sm:gap-1">
        <button
          class="w-4 h-4 sm:w-3 sm:h-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="最小化窗口"
          @click="minimizeWindow"
        ></button>
        <button
          class="w-4 h-4 sm:w-3 sm:h-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="关闭窗口"
          @click="closeWindow"
        ></button>
      </div>
    </header>

    <main class="pt-10 sm:pt-8 min-h-full">
      <router-view v-slot="{ Component }">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup lang="ts">
import { appWindow } from '@tauri-apps/api/window'

async function minimizeWindow() {
  try {
    await appWindow.minimize()
  } catch {}
}

async function closeWindow() {
  try {
    await appWindow.hide()
  } catch {}
}
</script>

<style scoped>
.bg-noise {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E");
}

.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
