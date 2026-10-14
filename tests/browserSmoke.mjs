// Real browser smoke test with an intercepted synthetic API; never touches a database.
import assert from 'node:assert/strict'
import http from 'node:http'
import { readFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import path from 'node:path'

const root = path.resolve('dist')
const origin = 'http://127.0.0.1:8691'
const browserPath = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find(existsSync)
assert.ok(browserPath, 'A Chromium browser is required')
const profile = path.resolve('.browser-tests', `profile-${Date.now()}`)
await mkdir(profile, { recursive: true })
const contentTypes = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.mp3': 'audio/mpeg' }
const server = http.createServer(async (request, response) => {
  try {
    const relative = decodeURIComponent(new URL(request.url, origin).pathname)
    let target = path.resolve(root, '.' + relative)
    if (!target.startsWith(root + path.sep) && target !== root) { response.writeHead(403).end(); return }
    if (!path.extname(target)) target = path.join(root, 'index.html')
    const body = await readFile(target)
    response.writeHead(200, { 'Content-Type': contentTypes[path.extname(target)] || 'application/octet-stream' }).end(body)
  } catch { response.writeHead(404).end() }
})
await new Promise((resolve) => server.listen(8691, '127.0.0.1', resolve))
const browser = spawn(browserPath, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore', windowsHide: true })
let socket
let sequence = 0
const pending = new Map()
const failures = []
const pause = (duration) => new Promise((resolve) => setTimeout(resolve, duration))
const product = { id: 101, name: 'Hambúrguer com Bacon', category: { id: 1, name: 'Hambúrgueres' }, price: 39.90, stockQuantity: 10, active: true, available: true }
const table = { id: 1, number: 4, active: true }
let order
let payment
let apiCalls = 0
const capability = 'synthetic-order-capability-1'
const syntheticStaff = (email) => {
  const claims = { sub: email, usuarioId: 7, perfil: 'Administrador', purpose: 'staff', exp: Math.floor(Date.now() / 1000) + 600 }
  const token = `${Buffer.from('{}').toString('base64url')}.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.synthetic-signature`
  return { id: 7, nome: 'Operador de teste', email, perfilId: 1, perfil: 'Administrador', token }
}
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++sequence
  const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)) }, 15000)
  pending.set(id, { resolve, reject, timeout })
  socket.send(JSON.stringify({ id, method, params }))
})

const apiResponse = (request) => {
  const uri = new URL(request.url).pathname
  const method = request.method
  const header = (name) => Object.entries(request.headers).find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1]
  const staff = Boolean(header('Authorization'))
  if (method === 'OPTIONS') return [204, null]
  apiCalls++
  const body = request.postData ? JSON.parse(request.postData) : {}
  if (uri === '/api/auth/login') return [200, syntheticStaff(body.email)]
  if (uri === '/api/v1/produtos') return [200, [product]]
  if (uri === '/api/mesas') return [200, [table]]
  if (uri === '/api/push/public-key') return [200, { enabled: false, publicKey: '' }]
  if (uri === '/api/dashboard/resumo') return staff ? [200, { pedidosHoje: order ? 1 : 0, faturamentoHoje: payment?.status === 'PAGO' ? 39.90 : 0, ticketMedio: 0, mesasOcupadas: 1, totalMesas: 1, pedidosPorStatus: [], pedidosRecentes: [], movimentoPorHora: [], mesas: [{ numero: 4, status: 'Ocupada' }] }] : [401, {}]
  if (uri === '/api/pedidos' && method === 'POST') {
    assert.equal(body.itens[0].produtoId, 101, 'Checkout must use the server product ID')
    order = { id: 1, mesa: table, status: { id: 1, name: 'Recebido', flowOrder: 1 }, totalValue: 39.90, confirmed: true, createdAt: '2026-10-13T12:00:00' }
    product.stockQuantity = 9
    return [201, { ...order, accessToken: capability }]
  }
  if (uri === '/api/pedidos') return staff ? [200, order ? [order] : []] : [401, {}]
  if (uri === '/api/v1/produtos/101/estoque' && method === 'PATCH') {
    assert.ok(staff)
    assert.equal(body.expectedStockQuantity, product.stockQuantity)
    assert.equal(body.delta, 1)
    product.stockQuantity += body.delta
    return [200, product]
  }
  const isOwned = staff || header('X-Order-Token') === capability
  if (/^\/api\/(pedidos\/\d+|itens-pedido\/pedido\/\d+|payments\/\d+)/.test(uri)) {
    if (!isOwned || !uri.includes('/1')) return [403, { message: 'Acesso não permitido.' }]
    if (uri === '/api/pedidos/1') return [200, order]
    if (uri === '/api/itens-pedido/pedido/1') return [200, [{ id: 1, produto: { id: 101, name: product.name }, quantidade: 1, precoUnitario: 39.90, subtotal: 39.90 }]]
    if (uri === '/api/payments/1/process') {
      payment ||= { id: 1, orderId: 1, amount: 39.90, method: body.method, status: 'PENDENTE', createdAt: '2026-10-13T12:00:00' }
      return [200, payment]
    }
    if (uri === '/api/payments/1/confirm') {
      assert.ok(staff, 'Only a staff request can confirm receipt')
      assert.equal(payment.status, 'PENDENTE')
      payment = { ...payment, status: 'PAGO', processedAt: '2026-10-13T13:00:00' }
      return [200, payment]
    }
    if (uri === '/api/payments/1') return [200, payment || null]
  }
  return [404, { message: 'Synthetic endpoint not configured.' }]
}

const evaluate = async (expression) => {
  const value = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (value.exceptionDetails) throw new Error(value.exceptionDetails.text)
  return value.result.value
}
const waitFor = async (expression, description) => {
  const deadline = Date.now() + 15000
  while (Date.now() < deadline) { if (await evaluate(`Boolean(${expression})`)) return; await pause(150) }
  throw new Error(`UI timeout: ${description}`)
}
const click = (label) => evaluate(`Array.from(document.querySelectorAll('button')).find(button => button.textContent.includes(${JSON.stringify(label)}))?.click()`)
const navigate = async (route) => { await send('Page.navigate', { url: origin + route }); await waitFor("document.readyState === 'complete'", route) }

try {
  let port
  for (let attempt = 0; attempt < 100; attempt++) {
    try { port = Number((await readFile(path.join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]); break } catch { await pause(100) }
  }
  assert.ok(port, 'Browser did not start')
  const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
  socket = new WebSocket(pages.find((page) => page.type === 'page').webSocketDebuggerUrl)
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }) })
  socket.addEventListener('message', async ({ data }) => {
    const event = JSON.parse(data)
    if (event.id) {
      const promise = pending.get(event.id)
      if (!promise) return
      pending.delete(event.id); clearTimeout(promise.timeout)
      event.error ? promise.reject(new Error(event.error.message)) : promise.resolve(event.result)
    } else if (event.method === 'Fetch.requestPaused') {
      try {
        const [status, body] = apiResponse(event.params.request)
        await send('Fetch.fulfillRequest', { requestId: event.params.requestId, responseCode: status,
          responseHeaders: [{ name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: origin }, { name: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Order-Token' }, { name: 'Access-Control-Allow-Methods', value: 'GET, POST, PATCH, OPTIONS' }],
          body: body == null ? '' : Buffer.from(JSON.stringify(body)).toString('base64') })
      } catch (error) { failures.push(error.message); await send('Fetch.failRequest', { requestId: event.params.requestId, errorReason: 'Failed' }).catch(() => {}) }
    } else if (event.method === 'Runtime.exceptionThrown') failures.push(event.params.exceptionDetails.exception?.description || event.params.exceptionDetails.text)
  })
  await send('Runtime.enable')
  await send('Page.enable')
  await send('Fetch.enable', { patterns: [{ urlPattern: 'http://localhost:8080/api/*', requestStage: 'Request' }] })

  await navigate('/dashboard')
  await waitFor("location.pathname === '/login'", 'anonymous management redirect')
  console.log('PASS: anonymous management route redirects to login')
  await navigate('/menu?mesa=04')
  await waitFor("document.querySelector('.customer-product-card button') && !document.querySelector('.customer-product-card button').disabled", 'menu availability')
  assert.ok((await evaluate('document.body.innerText')).includes('39,90'))
  await click('Adicionar')
  await evaluate("document.querySelector('.customer-cart-bar').click()")
  await waitFor("location.pathname === '/carrinho'", 'cart')
  await waitFor("!Array.from(document.querySelectorAll('button')).find(button => button.textContent.includes('Continuar pedido'))?.disabled", 'cart price refresh')
  await click('Continuar pedido')
  await waitFor("location.pathname === '/confirmar-pedido'", 'checkout')
  await waitFor("!Array.from(document.querySelectorAll('button')).find(button => button.textContent.includes('Confirmar pedido'))?.disabled", 'checkout ready')
  await click('Confirmar pedido')
  await waitFor("location.pathname === '/pedido-confirmado'", 'order creation')
  console.log('PASS: menu → cart → checkout uses official ID and price')

  await navigate('/pagamento?id=%231&mesa=04')
  await waitFor("Array.from(document.querySelectorAll('button')).some(button => button.textContent.trim() === 'PIX')", 'payment methods')
  await click('PIX')
  await click('Solicitar pagamento')
  await waitFor("document.body.innerText.includes('Solicitação enviada.')", 'pending payment')
  assert.equal(payment.status, 'PENDENTE')
  await navigate('/comprovante?id=%231&mesa=04')
  await waitFor("document.body.innerText.includes('Recebimento ainda não confirmado.')", 'receipt blocked')
  console.log('PASS: guest payment is pending and cannot produce a confirmed receipt')

  await navigate('/login')
  await waitFor("document.getElementById('email')", 'login inputs')
  await evaluate(`for (const [id, value] of [['email','operator@example.invalid'],['senha','synthetic-password-12']]) { const element=document.getElementById(id); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(element,value); element.dispatchEvent(new Event('input',{bubbles:true})); }`)
  await click('Entrar')
  await waitFor("location.pathname === '/dashboard'", 'staff login')
  await navigate('/pedidos')
  await waitFor("document.querySelector('.order-card')", 'management orders')
  await click('Ver detalhes')
  await waitFor("document.body.innerText.includes('Conferi o recebimento integral')", 'staff payment approval')
  await evaluate("document.querySelector('.order-drawer input[type=checkbox]').click()")
  await click('Confirmar recebimento')
  await waitFor("document.body.innerText.includes('Confirmado pela equipe')", 'confirmed manual receipt')
  assert.equal(payment.status, 'PAGO')
  await navigate('/comprovante?id=%231&mesa=04')
  await waitFor("document.body.innerText.includes('39,90') && !document.body.innerText.includes('Recebimento ainda não confirmado.')", 'confirmed receipt')
  console.log('PASS: staff confirms receipt and guest sees the persisted receipt')

  await navigate('/estoque')
  await waitFor("document.querySelector('.inventory-actions button:last-child')", 'stock UI')
  await evaluate("document.querySelector('.inventory-actions button:last-child').click()")
  await waitFor("document.querySelector('.inventory-stock strong')?.textContent === '10'", 'atomic stock update')
  assert.equal(product.stockQuantity, 10)
  console.log('PASS: stock adjustment uses delta and expected quantity')
  await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 1, mobile: true })
  await navigate('/menu?mesa=04')
  await waitFor("document.querySelector('.customer-product-card')", 'mobile menu')
  assert.ok(await evaluate('document.documentElement.scrollWidth <= 377'), 'Mobile menu overflows horizontally')
  console.log('PASS: menu at 375px has no horizontal overflow')
  assert.deepEqual(failures, [], 'Browser console or synthetic API failures')
  assert.ok(apiCalls > 10)
  console.log('Browser smoke completed: 6 scenarios passed; synthetic API, no real database.')
} finally {
  if (socket?.readyState === WebSocket.OPEN) { await send('Browser.close').catch(() => {}); socket.close() }
  if (!browser.killed) browser.kill()
  server.closeAllConnections()
  await new Promise((resolve) => server.close(resolve))
}
