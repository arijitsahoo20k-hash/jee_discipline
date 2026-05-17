'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        })

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (!newWorker) return

          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // A new version is available — optionally notify the user
              console.log('[PWA] New version available. Reload to update.')
            }
          })
        })

        console.log('[PWA] Service worker registered:', registration.scope)
      } catch (err) {
        console.error('[PWA] Service worker registration failed:', err)
      }
    }

    // Defer registration until after first paint
    if (document.readyState === 'complete') {
      register()
    } else {
      window.addEventListener('load', register)
    }

    return () => {
      window.removeEventListener('load', register)
    }
  }, [])

  return null
}
