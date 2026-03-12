import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// @ts-expect-error -- virtual module provided by vite-plugin-pwa at build time
import { registerSW } from 'virtual:pwa-register'
// @ts-expect-error -- CSS-only font package has no type declarations
import '@fontsource-variable/noto-nastaliq-urdu'
import './index.css'
import App from './App.tsx'

// Auto-update: when a new SW is ready, activate it and reload immediately
registerSW({
  onNeedRefresh() {
    // New content available, reload to apply
    window.location.reload()
  },
  onOfflineReady() {
    console.log('App ready for offline use')
  },
  // Check for updates every 60 seconds
  onRegisteredSW(_url: string, registration: ServiceWorkerRegistration | undefined) {
    if (registration) {
      setInterval(() => registration.update(), 60 * 1000)
    }
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
