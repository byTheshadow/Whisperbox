<template>
  <nav class="settings-nav">
    <button
      v-for="item in navItems"
      :key="item.key"
      :class="['nav-item', { active: currentTab === item.key }]"
      @click="$emit('change', item.key)"
    >
      <component :is="item.icon" class="nav-icon" />
      <span>{{ item.label }}</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { h } from 'vue'

defineProps<{
  currentTab: string
}>()

defineEmits<{
  change: [tab: string]
}>()

const IconApi = () => h('svg', { 
  width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.5 
}, [
  h('path', { d: 'M12 2L2 7l10 5 10-5-10-5z', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
  h('path', { d: 'M2 17l10 5 10-5', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
  h('path', { d: 'M2 12l10 5 10-5', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })
])

const IconUser = () => h('svg', { 
  width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.5 
}, [
  h('path', { d: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
  h('circle', { cx: 12, cy: 7, r: 4 })
])

const navItems = [
  { key: 'api', label: 'API / 模型', icon: IconApi },
  { key: 'persona', label: '用户身份', icon: IconUser }
]
</script>

<style scoped>
.settings-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 180px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  font-family: 'Cormorant Garamond', 'Noto Serif SC', serif;
  font-size: 15px;
  color: rgba(245, 245, 245, 0.5);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.nav-item:hover {
  color: rgba(245, 245, 245, 0.8);
  background: rgba(255, 255, 255, 0.03);
}

.nav-item.active {
  color: rgba(245, 245, 245, 0.95);
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.1);
}

.nav-icon {
  opacity: 0.7;
}

.nav-item.active .nav-icon {
  opacity: 1;
}

/* 移动端横向排列 */
@media (max-width: 768px) {
  .settings-nav {
    flex-direction: row;
    min-width: unset;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 8px;
  }

  .nav-item {
    padding: 10px 14px;
    font-size: 14px;
    white-space: nowrap;
  }
}
</style>
