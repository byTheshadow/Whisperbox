<template>
  <div class="settings-container">
    <!-- 返回按钮 -->
    <button 
      class="back-button"
      @click="$router.push('/')"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M19 12H5M12 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span>返回</span>
    </button>

    <div class="settings-layout">
      <!-- 导航 -->
      <SettingsNav 
        :current-tab="currentTab" 
        @change="currentTab = $event" 
      />

      <!-- 内容区 -->
      <div class="settings-content">
        <Transition name="fade" mode="out-in">
          <ApiSettings v-if="currentTab === 'api'" key="api" />
          <PersonaSettings v-else-if="currentTab === 'persona'" key="persona" />
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SettingsNav from './components/SettingsNav.vue'
import ApiSettings from './components/ApiSettings.vue'
import PersonaSettings from './components/PersonaSettings.vue'

const currentTab = ref<'api' | 'persona'>('api')
</script>

<style scoped>
.settings-container {
  min-height: 100vh;
  padding: 24px;
  padding-top: 60px;
}

.back-button {
  position: fixed;
  top: 16px;
  left: 16px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  font-size: 14px;
  color: rgba(245, 245, 245, 0.6);
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 100;
}

.back-button:hover {
  color: rgba(245, 245, 245, 0.9);
  border-color: rgba(255, 255, 255, 0.15);
}

.settings-layout {
  display: flex;
  gap: 32px;
  max-width: 1000px;
  margin: 0 auto;
}

.settings-content {
  flex: 1;
  min-width: 0;
}

/* 移动端 */
@media (max-width: 768px) {
  .settings-container {
    padding: 16px;
    padding-top: 70px;
  }

  .settings-layout {
    flex-direction: column;
    gap: 20px;
  }
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
