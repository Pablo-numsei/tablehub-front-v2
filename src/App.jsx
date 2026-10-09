import { useEffect } from 'react'
import AppRoutes from './routes/AppRoutes.jsx'
import {
  playNotificationSound,
  unlockNotificationSound,
} from './services/notificationSound.js'
import './styles/theme-2.1.css'
import './styles/home-background.css'
import './styles/theme-mode.css'

export default function App() {
  useEffect(() => {
    const unlock = () => {
      unlockNotificationSound()
    }

    const handleServiceWorkerMessage = (event) => {
      const message = event.data

      if (message?.type !== 'TABLEHUB_NOTIFICATION') return

      playNotificationSound(message.payload?.tag || null)
    }

    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener(
        'message',
        handleServiceWorkerMessage,
      )
    }

    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener(
          'message',
          handleServiceWorkerMessage,
        )
      }
    }
  }, [])

  return <AppRoutes />
}
