import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

export default defineConfig({
  base: '/Whisperbox/',
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw-custom.ts',
      manifest: {
        name: 'Whisperbox',
        short_name: 'Whisperbox',
        description: '陪伴型数字空间',
        theme_color: '#080808',
        background_color: '#080808',
        display: 'standalone',
        icons: [
          { src: '/Whisperbox/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/Whisperbox/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}']
      }
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true
  },
  envPrefix: ['VITE_', 'TAURI_']
})

