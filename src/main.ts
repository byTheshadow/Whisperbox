import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initAppData } from './core/db'
import './assets/styles/global.css'
import { startProactiveLoop } from './core/proactive'
import { registerPeriodicSync } from './core/background-sync'

async function bootstrap() {
  // 初始化应用数据，确保启动时有默认 Persona / 默认数据
  await initAppData()

  // 读取设置，启动前台心跳
  // 如果 initAppData 内部已经完成默认设置创建，这里直接读取即可
  // 若你的设置存储结构不同，请按实际字段调整
  const appData = await import('./core/db')
  const settings = await appData.db.appSettings.get('global')

  if (settings?.proactivePushEnabled) {
    startProactiveLoop(settings.proactiveCheckInterval || 300)
  }

  // 注册后台周期性同步（页面关闭后的保活）
  await registerPeriodicSync()

  createApp(App)
    .use(router)
    .mount('#app')
}

bootstrap()