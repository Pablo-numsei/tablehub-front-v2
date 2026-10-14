import { useEffect, useState } from 'react'
import api from '../services/api.js'
import { getTableContextByNumber, saveTableContext, tableNumber } from '../services/tableAccess.js'

export default function useTableContext(number, qrToken = null) {
  const requested = tableNumber(number)
  const [state, setState] = useState({ context: null, loading: true, error: '' })
  useEffect(() => {
    const controller = new AbortController()
    let active = true
    setState({ context: null, loading: true, error: '' })
    const resolve = async () => {
      try {
        if (number && !requested) throw new Error('O número da mesa é inválido. Escaneie o QR Code novamente.')
        if (qrToken) {
          const { data } = await api.post('/api/mesas/contexto', { qrToken }, { signal: controller.signal })
          if (requested && Number(data?.mesa?.number) !== requested) {
            throw new Error('O QR Code não corresponde à mesa informada. Escaneie o QR Code da sua mesa.')
          }
          if (active) setState({ context: saveTableContext(data), loading: false, error: '' })
          return
        }
        if (!requested) {
          if (active) setState({ context: null, loading: false, error: '' })
          return
        }
        const cached = getTableContextByNumber(requested)
        const { data } = await api.get('/api/mesas', { signal: controller.signal })
        const mesa = (Array.isArray(data) ? data : []).find((item) => Number(item.number) === requested && item.active !== false)
        if (!mesa) throw new Error('Esta mesa não está disponível. Peça ajuda à equipe.')
        const context = cached && Number(cached.mesa.id) === Number(mesa.id) ? cached : null
        if (active) setState({ context, loading: false, error: '' })
      } catch (error) {
        if (!active || controller.signal.aborted) return
        setState({ context: null, loading: false, error: error?.response?.data?.message || error?.message || 'Não foi possível validar a mesa.' })
      }
    }
    resolve()
    return () => { active = false; controller.abort() }
  }, [number, requested, qrToken])
  const matches = state.context && (!requested || state.context.mesa.number === requested)
  return { ...state, context: matches ? state.context : null, ready: !!matches && !state.loading && !state.error }
}
