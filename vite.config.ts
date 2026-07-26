import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

export default defineConfig({
  base: '/Whisperbox/',
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Whisperbox',
        short_name: 'Whisperbox',
        description: '陪伴型数字空间',
        theme_color: '#080808',
        background_color: '#080808',
        display: 'standalone',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  // Tauri 开发模式需要的配置
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true
  },
  envPrefix: ['VITE_', 'TAURI_']
})
