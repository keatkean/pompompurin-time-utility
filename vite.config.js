import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: '/pompompurin-time-utility/',
  plugins: [
    react(),
    VitePWA({
      disable: mode === 'test',
      registerType: 'autoUpdate',
      includeAssets: ['pompompurin.svg', 'beep-07a.wav'],
      manifest: {
        name: 'Pompompurin Time Utility',
        short_name: 'PompomTime',
        description: 'Cute world clock, countdown timer, stopwatch and pomodoro, themed after Pompompurin.',
        theme_color: '#A67C52',
        background_color: '#FFF8DC',
        display: 'standalone',
        icons: [
          { src: 'pompompurin.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'pompompurin.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,wav,png}'],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
  },
}))
