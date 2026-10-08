// Coloque o arquivo de áudio em public/sounds/tablehub-notification.mp3.
const SOUND_URL = '/sounds/tablehub-notification.mp3'
let audio = null
let unlocked = false

export const unlockNotificationSound = () => {
  if (typeof window === 'undefined') return
  if (!audio) {
    audio = new Audio(SOUND_URL)
    audio.preload = 'auto'
    audio.volume = 0.7
  }
  // Navegadores só permitem reprodução automática após interação do usuário.
  unlocked = true
}

export const playNotificationSound = () => {
  if (!unlocked || typeof window === 'undefined') return
  try {
    if (!audio) unlockNotificationSound()
    audio.pause()
    audio.currentTime = 0
    audio.play().catch(() => {})
  } catch {
    // O som nunca deve bloquear as operações do sistema.
  }
}
