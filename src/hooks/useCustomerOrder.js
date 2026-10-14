import { useCallback, useEffect, useRef, useState } from 'react'
import api from '../services/api.js'
import { loadOrderPayment } from '../services/orderPayments.js'
import { orderAccessError, validOrderId } from '../services/orderAccess.js'
import { playNotificationSound } from '../services/notificationSound.js'
import { getActiveCustomerOrder, getCustomerOrder, saveCustomerOrderSnapshot } from '../utils/customerSession.js'

export default function useCustomerOrder(requestedId, { includeItems = false, pollMs = 0 } = {}) {
  const localOrder = requestedId ? getCustomerOrder(requestedId) : getActiveCustomerOrder()
  const backendId = validOrderId(localOrder?.backendId ?? requestedId ?? localOrder?.id)
  const [order, setOrder] = useState(localOrder)
  const [payment, setPayment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const previousStatus = useRef(null)
  const inFlight = useRef(null)
  const currentId = useRef(backendId)
  currentId.current = backendId

  const refresh = useCallback(async ({ signal } = {}) => {
    if (!backendId) { setOrder(null); setLoading(false); return }
    if (inFlight.current && !inFlight.current.signal?.aborted) return inFlight.current.request
    setRefreshing(true)
    const request = (async () => {
      try {
        const [response, currentPayment, itemsResponse] = await Promise.all([
          api.get(`/api/pedidos/${backendId}`, { signal }),
          loadOrderPayment(backendId, { signal }),
          includeItems ? api.get(`/api/itens-pedido/pedido/${backendId}`, { signal }) : Promise.resolve(null),
        ])
        if (signal?.aborted || currentId.current !== backendId) return
        const current = saveCustomerOrderSnapshot(response.data, itemsResponse?.data, currentPayment)
        if (previousStatus.current && previousStatus.current !== current.status) {
          playNotificationSound(`pedido-${backendId}-${current.backendStatus.toLowerCase().replace(/\s+/g, '-')}`)
        }
        previousStatus.current = current.status
        setOrder(current)
        setPayment(currentPayment)
        setError('')
      } catch (requestError) {
        if (signal?.aborted || currentId.current !== backendId) return
        if ([401, 403].includes(requestError.response?.status)) setOrder(null)
        setError(orderAccessError(requestError))
      } finally {
        if (!signal?.aborted) { setLoading(false); setRefreshing(false) }
      }
    })()
    inFlight.current = { request, signal }
    try { await request } finally { if (inFlight.current?.request === request) inFlight.current = null }
  }, [backendId, includeItems])

  useEffect(() => {
    let active = true
    let timer
    const controller = new AbortController()
    const run = async () => {
      if (!active) return
      if (document.visibilityState !== 'hidden') await refresh({ signal: controller.signal })
      if (active && pollMs) { window.clearTimeout(timer); timer = window.setTimeout(run, pollMs) }
    }
    run()
    const onVisible = () => {
      if (document.visibilityState === 'visible') { window.clearTimeout(timer); run() }
    }
    if (pollMs) document.addEventListener('visibilitychange', onVisible)
    return () => {
      active = false
      controller.abort()
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refresh, pollMs])

  return { order, payment, backendId, loading, refreshing, error, refresh }
}
