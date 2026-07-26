import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/styles/global.css'
import { initDefaultSettings, db } from './core/db'
import { startProactiveLoop } from './core/proactive'
import { registerPeriodicSync } from './core/background-sync'

const app = createApp(App)
app.use(router)
app.mount('#app')

// 初始化
async function bootstrap() {
  // 确保默认设置存在
  await initDefaultSettings()

  // 读取设置，启动前台心跳
  const settings = await db.appSettings.get('global')
  if (settings?.proactivePushEnabled) {
    startProactiveLoop(settings.proactiveCheckInterval || 300)
  }

  // 注册后台周期性同步（页面关闭后的保活）
  await registerPeriodicSync()
}

bootstrap()
