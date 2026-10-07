import api from './api.js'

const pushStorageKey = (backendId) =>
  `tablehub_push_order_${backendId}`

const STAFF_PUSH_KEY = 'tablehub_push_staff_enabled'

const getBackendId = (order) => {
  if (order?.backendId != null) {
    return Number(order.backendId)
  }

  const parsed = Number(String(order?.id || '').replace('#', ''))
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  return Uint8Array.from(
    [...rawData].map((character) => character.charCodeAt(0)),
  )
}

export const supportsPushNotifications = () =>
  typeof window !== 'undefined' &&
  window.isSecureContext &&
  'Notification' in window &&
  'serviceWorker' in navigator &&
  'PushManager' in window

export const isOrderPushEnabled = (order) => {
  const backendId = getBackendId(order)
  if (!backendId) return false

  return sessionStorage.getItem(pushStorageKey(backendId)) === '1'
}

const getOrCreatePushSubscription = async () => {
  const { subscription, serialized } = await getOrCreatePushSubscription()

  return { subscription, serialized }
}

export const enableOrderPush = async (order) => {
  const backendId = getBackendId(order)

  if (!backendId) {
    throw new Error('Este pedido não possui um ID válido no backend.')
  }

  if (!supportsPushNotifications()) {
    throw new Error(
      'Este navegador não oferece suporte a notificações push ou a página não está em um contexto seguro.',
    )
  }

  const permission = await Notification.requestPermission()

  if (permission !== 'granted') {
    throw new Error(
      'A permissão de notificações não foi concedida no navegador.',
    )
  }

  const registration = await navigator.serviceWorker.register('/sw.js')
  await navigator.serviceWorker.ready

  const { data } = await api.get('/api/push/public-key')

  if (!data?.publicKey) {
    throw new Error('O servidor não forneceu a chave pública de notificações.')
  }

  let subscription = await registration.pushManager.getSubscription()

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(data.publicKey),
    })
  }

  const serialized = subscription.toJSON()

  if (
    !serialized.endpoint ||
    !serialized.keys?.p256dh ||
    !serialized.keys?.auth
  ) {
    throw new Error('A inscrição push retornada pelo navegador é inválida.')
  }

  await api.post('/api/push/subscriptions', {
    pedidoId: backendId,
    endpoint: serialized.endpoint,
    keys: {
      p256dh: serialized.keys.p256dh,
      auth: serialized.keys.auth,
    },
  })

  sessionStorage.setItem(pushStorageKey(backendId), '1')

  return subscription
}


export const isStaffPushEnabled = () =>
  localStorage.getItem(STAFF_PUSH_KEY) === '1'

export const enableStaffPush = async () => {
  const { subscription, serialized } = await getOrCreatePushSubscription()

  await api.post('/api/push/staff-subscriptions', {
    endpoint: serialized.endpoint,
    keys: {
      p256dh: serialized.keys.p256dh,
      auth: serialized.keys.auth,
    },
  })

  localStorage.setItem(STAFF_PUSH_KEY, '1')

  return subscription
}
