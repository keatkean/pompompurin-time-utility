import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import process from 'node:process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

// Short commit hash baked into the build so the deployed footer identifies
// exactly which commit is live (the PWA can serve a cached older build, so
// "is this the latest?" must be answerable from the page itself).
function commitHash() {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    // No git (e.g. a bare source download) — CI still provides the SHA.
    return process.env.GITHUB_SHA?.slice(0, 7) ?? 'dev'
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: '/pompompurin-time-utility/',
  define: {
    'import.meta.env.APP_VERSION': JSON.stringify(pkg.version),
    'import.meta.env.APP_COMMIT': JSON.stringify(commitHash()),
    'import.meta.env.APP_BUILD_TIME': JSON.stringify(
      new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC'
    ),
  },
  plugins: [
    react(),
    VitePWA({
      disable: mode === 'test',
      registerType: 'autoUpdate',
      // No includeAssets: workbox.globPatterns below already precaches the svg
      // favicon and the wav, and includeManifestIcons covers the PNG icons —
      // listing them here too produced duplicate precache entries.
      manifest: {
        name: 'Pompompurin Time Utility',
        short_name: 'PompomTime',
        description: 'Cute world clock, countdown timer, stopwatch and pomodoro, themed after Pompompurin.',
        theme_color: '#A67C52',
        background_color: '#FFF8DC',
        display: 'standalone',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,wav,png,woff2}'],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        // Split the MUI/Emotion vendor code into its own chunk so it caches
        // independently of app code and clears Vite's >500 kB chunk warning.
        manualChunks: {
          mui: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
  },
}))
