import { useEffect, useState } from 'react'
import api from '../services/api.js'
import { mapCustomerCatalog, readCatalog, saveCatalog } from '../services/customerCatalog.js'

export default function useCustomerCatalog() {
  const [products, setProducts] = useState(readCatalog)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    api.get('/api/v1/produtos', { signal: controller.signal }).then(({ data }) => {
      if (controller.signal.aborted) return
      const current = mapCustomerCatalog(data)
      saveCatalog(current)
      setProducts(current)
      setError('')
    }).catch((failure) => {
      if (!controller.signal.aborted) setError(failure.response?.data?.message || 'Não foi possível consultar os preços e a disponibilidade. Tente novamente.')
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [])
  return { products, loading, error, setProducts }
}
