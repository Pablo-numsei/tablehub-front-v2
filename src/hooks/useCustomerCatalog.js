import { useEffect, useState } from 'react'
import api from '../services/api.js'
import { mapCustomerCatalog, readCatalog, saveCatalog } from '../services/customerCatalog.js'

export default function useCustomerCatalog() {
  const [products, setProducts] = useState(readCatalog)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    let requestInProgress = false

    const refreshCatalog = async () => {
      if (controller.signal.aborted || requestInProgress) return
      requestInProgress = true

      try {
        const { data } = await api.get('/api/v1/produtos', { signal: controller.signal })
        if (controller.signal.aborted) return
        const current = mapCustomerCatalog(data)
        saveCatalog(current)
        setProducts(current)
        setError('')
      } catch (failure) {
        if (!controller.signal.aborted) {
          setError(failure.response?.data?.message || 'Não foi possível consultar os preços e a disponibilidade. Tente novamente.')
        }
      } finally {
        requestInProgress = false
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    refreshCatalog()
    const intervalId = window.setInterval(refreshCatalog, 10000)
    const handleFocus = () => refreshCatalog()
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refreshCatalog()
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      controller.abort()
      window.clearInterval(intervalId)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  return { products, loading, error, setProducts }
}
