const SOUND_URL = '/sounds/tablehub-notification.mp3'
const LAST_SOUND_KEY = 'tablehub_last_sound_event'
const SOUND_DEDUP_MS = 8000

let audio = null
let unlocked = false
let unlocking = false

const getAudio = () => {
  if (typeof window === 'undefined') return null

  if (!audio) {
    audio = new Audio(SOUND_URL)
    audio.preload = 'auto'
    audio.volume = 0.7
  }

  return audio
}

export const unlockNotificationSound = async () => {
  if (typeof window === 'undefined' || unlocked || unlocking) return

  const player = getAudio()
  if (!player) return

  unlocking = true

  try {
    const previousVolume = player.volume
    player.volume = 0
    await player.play()
    player.pause()
    player.currentTime = 0
    player.volume = previousVolume
    unlocked = true
  } catch {
    // Alguns navegadores só liberam o áudio após outra interação.
  } finally {
    unlocking = false
  }
}

const wasRecentlyPlayed = (eventId) => {
  if (!eventId || typeof window === 'undefined') return false

  try {
    const raw = localStorage.getItem(LAST_SOUND_KEY)
    if (!raw) return false

    const last = JSON.parse(raw)

    return (
      last?.id === eventId &&
      Date.now() - Number(last?.at || 0) < SOUND_DEDUP_MS
    )
  } catch {
    return false
  }
}

const rememberEvent = (eventId) => {
  if (!eventId || typeof window === 'undefined') return

  try {
    localStorage.setItem(
      LAST_SOUND_KEY,
      JSON.stringify({ id: eventId, at: Date.now() }),
    )
  } catch {
    // O som continua funcionando mesmo sem localStorage.
  }
}

export const playNotificationSound = async (eventId = null) => {
  if (typeof window === 'undefined' || wasRecentlyPlayed(eventId)) return false

  if (!unlocked) {
    await unlockNotificationSound()
  }

  if (!unlocked) return false

  const player = getAudio()
  if (!player) return false

  try {
    rememberEvent(eventId)
    player.pause()
    player.currentTime = 0
    await player.play()
    return true
  } catch {
    return false
  }
}
