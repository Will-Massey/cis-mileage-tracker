---
name: react-pwa-builder
description: Build and optimize React Progressive Web Apps (PWA) with Vite. Use when creating service workers, configuring manifests, implementing offline mode, or optimizing mobile-first React applications for production deployment.
---

# React PWA Builder

Build production-ready Progressive Web Apps with React and Vite.

## Quick Start

### Service Worker Setup

Use Workbox with Vite PWA plugin:

```bash
npm install vite-plugin-pwa -D
```

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'My App',
        short_name: 'App',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#000000',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.example\.com\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 86400 }
            }
          }
        ]
      }
    })
  ]
})
```

### Register Service Worker

```javascript
// main.jsx or main.tsx
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New version available. Reload?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline')
  }
})
```

### Mobile-First Patterns

**Touch-friendly buttons:**
```css
.btn-touch {
  min-height: 48px;
  min-width: 48px;
  padding: 12px 24px;
}
```

**Safe areas for notches:**
```css
.safe-area {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}
```

**Viewport meta:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

## Offline Mode

### Cache API Responses

```javascript
// services/cache.js
const CACHE_NAME = 'mileage-cache-v1'

export const cacheApiResponse = async (key, data) => {
  const cache = await caches.open(CACHE_NAME)
  await cache.put(key, new Response(JSON.stringify(data)))
}

export const getCachedResponse = async (key) => {
  const cache = await caches.open(CACHE_NAME)
  const response = await cache.match(key)
  return response ? response.json() : null
}
```

### Detect Online/Offline

```javascript
// hooks/useNetworkStatus.js
import { useState, useEffect } from 'react'

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
```

## Icons & Manifest

**Required icon sizes:**
- 72x72 (Android)
- 96x96 (Android)
- 128x128 (Chrome)
- 144x144 (Android)
- 152x152 (iOS)
- 192x192 (Android/Chrome)
- 384x384 (Chrome)
- 512x512 (Splash screen)

**Generate icons:** Use `npx pwa-asset-generator` or online tools like pwa-builder.com

## Build & Test

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Audit PWA
npx lighthouse http://localhost:5173 --preset=desktop
```

## Checklist

- [ ] manifest.json valid
- [ ] Service worker registered
- [ ] Icons all sizes
- [ ] Works offline
- [ ] Responsive design
- [ ] Touch targets 48x48px
- [ ] Performance optimized
