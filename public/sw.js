self.addEventListener('push', (event) => {
  let payload = {
    title: 'TableHub',
    body: 'Seu pedido recebeu uma atualização.',
    url: '/',
    tag: 'tablehub',
  }

  if (event.data) {
    try {
      payload = {
        ...payload,
        ...event.data.json(),
      }
    } catch {
      payload.body = event.data.text()
    }
  }

  const showNotification = self.registration.showNotification(
    payload.title,
    {
      body: payload.body,
      tag: payload.tag,
      renotify: true,
      data: {
        url: payload.url || '/',
      },
    },
  )

  const notifyOpenTableHub = self.clients
    .matchAll({
      type: 'window',
      includeUncontrolled: true,
    })
    .then((clientList) => {
      clientList.forEach((client) => {
        client.postMessage({
          type: 'TABLEHUB_NOTIFICATION',
          payload,
        })
      })
    })

  event.waitUntil(
    Promise.all([
      showNotification,
      notifyOpenTableHub,
    ]),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = new URL(
    event.notification.data?.url || '/',
    self.location.origin,
  ).href

  event.waitUntil(
    self.clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            client.navigate(targetUrl)
            return client.focus()
          }
        }

        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl)
        }

        return undefined
      }),
  )
})
