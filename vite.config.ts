import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'
import packageJson from './package.json' with { type: 'json' }

const POSTER_CACHE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60

const POSTER_CACHE_MAX_ENTRIES = 1000

const POSTER_HOSTS = /^https:\/\/(image\.tmdb\.org|covers\.openlibrary\.org|images\.igdb\.com)\//

export default defineConfig(({ mode }) => ({
  base: '/finished-titles/',
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  resolve: mode === 'test' ? { conditions: ['browser'] } : {},
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'כותרים',
        short_name: 'כותרים',
        lang: 'he',
        dir: 'rtl',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        scope: '.',
        theme_color: '#eef0fa',
        background_color: '#eef0fa',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: POSTER_HOSTS,
            handler: 'CacheFirst',
            options: {
              cacheName: 'posters',
              cacheableResponse: { statuses: [200] },
              expiration: {
                maxAgeSeconds: POSTER_CACHE_MAX_AGE_SECONDS,
                maxEntries: POSTER_CACHE_MAX_ENTRIES,
              },
            },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['test/setup.ts'],
    include: ['test/**/*.test.{ts,tsx}'],
    server: {
      deps: { inline: ['@ionic/react', '@ionic/core', 'ionicons', '@stencil/react-output-target', '@lit/react'] },
    },
  },
}))
