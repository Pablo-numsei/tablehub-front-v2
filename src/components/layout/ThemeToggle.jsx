import { useEffect, useState } from 'react'
import { FiMoon, FiSun } from 'react-icons/fi'
import './ThemeToggle.css'

const STORAGE_KEY = 'tablehub_theme'

function readTheme() {
  return document.documentElement.dataset.theme === 'dracula' ? 'dracula' : 'light'
}

export default function ThemeToggle({ compact = false }) {
  const [theme, setTheme] = useState(readTheme)
  const isDracula = theme === 'dracula'

  useEffect(() => {
    const syncTheme = () => setTheme(readTheme())

    window.addEventListener('tablehub-theme-change', syncTheme)
    window.addEventListener('storage', syncTheme)

    return () => {
      window.removeEventListener('tablehub-theme-change', syncTheme)
      window.removeEventListener('storage', syncTheme)
    }
  }, [])

  function toggleTheme() {
    const nextTheme = isDracula ? 'light' : 'dracula'

    document.documentElement.dataset.theme = nextTheme
    window.localStorage.setItem(STORAGE_KEY, nextTheme)
    window.dispatchEvent(new CustomEvent('tablehub-theme-change'))
    setTheme(nextTheme)
  }

  return (
    <button
      type="button"
      className={`theme-toggle ${compact ? 'is-compact' : ''}`}
      onClick={toggleTheme}
      aria-label={isDracula ? 'Ativar tema claro' : 'Ativar tema Dracula'}
      title={isDracula ? 'Ativar tema claro' : 'Ativar tema Dracula'}
    >
      {isDracula ? <FiSun /> : <FiMoon />}
      <span>{isDracula ? 'Claro' : 'Dracula'}</span>
    </button>
  )
}
