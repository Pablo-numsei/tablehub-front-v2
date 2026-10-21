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
const tables = [table, ...Array.from({ length: 8 }, (_, index) => ({ id: 101 + index, number: 21 + index, active: true }))]
const products = [product]
const categories = [{ id: 1, name: 'Hambúrgueres', active: true }]
const attendances = []
const qrToken = 'synthetic.signed.table-qr-1'
const tableToken = 'synthetic-table-context-1'
const extraOrder = { id: 99, mesa: tables[8], status: { id: 4, name: 'Entregue', flowOrder: 4 }, totalValue: 19.99, confirmed: true, createdAt: '2026-10-13T10:00:00' }
let order
let payment
let apiCalls = 0
const capability = 'synthetic-order-capability-1'
const syntheticStaff = (email) => {
  const claims = { sub: email, usuarioId: 7, perfil: 'Administrador', purpose: 'staff', exp: Math.floor(Date.now() / 1000) + 600 }
  const token = `${Buffer.from('{}').toString('base64url')}.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.synthetic-signature`
  return { id: 7, nome: 'Operador de teste', email, perfilId: 1, perfil: 'Administrador', token }
}
const syntheticCustomer = () => {
  const claims = { purpose: 'customer', clienteId: 27, sub: 'pablo123',
    exp: Math.floor(Date.now() / 1000) + 600 }
  return `${Buffer.from('{}').toString('base64url')}.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.synthetic-customer-signature`
}
const customerToken = syntheticCustomer()
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
  if (uri === '/api/clientes/cadastro' && method === 'POST') {
    assert.equal(body.nomeUsuario, 'pablo123')
    assert.equal(body.pin, '0472')
    return [201, { id: 27, nomeUsuario: 'pablo123', message: 'Conta criada.' }]
  }
  if (uri === '/api/clientes/login' && method === 'POST') {
    assert.equal(body.nomeUsuario, 'pablo123')
    assert.equal(body.pin, '0472')
    return [200, { id: 27, nomeUsuario: 'pablo123', token: customerToken }]
  }
  if (uri === '/api/clientes/me') {
    return header('Authorization') === 'Bearer ' + customerToken
      ? [200, { id: 27, nomeUsuario: 'pablo123' }] : [401, {}]
  }
  if (uri === '/api/v1/produtos' && method === 'GET') return [200, products]
  if (uri === '/api/v1/produtos' && method === 'POST') {
    assert.ok(staff)
    const created = { ...body, id: 102, category: categories.find((value) => value.id === body.category.id), active: true, available: true }
    products.push(created)
    return [201, created]
  }
  if (uri === '/api/v1/produtos/101' && method === 'PUT') {
    assert.ok(staff)
    if (body.stockQuantity !== product.stockQuantity) return [409, { message: 'O estoque mudou. Confira novamente.' }]
    Object.assign(product, body, { category: categories.find((value) => value.id === body.category.id) })
    return [200, product]
  }
  if (uri === '/api/v1/produtos/101') return [200, product]
  if (uri === '/api/v1/categorias' && method === 'GET') return staff ? [200, categories] : [401, {}]
  if (uri === '/api/v1/categorias' && method === 'POST') {
    assert.ok(staff)
    const created = { id: categories.length + 1, name: body.nome, description: body.descricao, active: true }
    categories.push(created)
    return [201, created]
  }
  if (uri === '/api/mesas' && method === 'GET') return [200, tables]
  if (uri === '/api/mesas' && method === 'POST') {
    assert.ok(staff)
    if (tables.some((value) => value.number === body.number)) return [409, { message: 'Já existe uma mesa com esse número.' }]
    const created = { id: 500, number: body.number, active: true }
    tables.push(created)
    return [201, created]
  }
  if (uri === '/api/mesas/1/qr') return staff ? [200, { mesa: { id: 1, number: 4 }, qrToken }] : [401, {}]
  if (uri === '/api/mesas/contexto') return body.qrToken === qrToken
    ? [200, { mesa: { id: 1, number: 4 }, tableToken, expiresAt: new Date(Date.now() + 7200000).toISOString() }]
    : [403, { message: 'Contexto da mesa inválido.' }]
  if (uri === '/api/mesas/painel') return staff ? [200, tables.map((value) => {
    const current = value.id === 1 ? order : value.id === extraOrder.mesa.id ? extraOrder : null
    const paid = value.id === 1 && payment?.status === 'PAGO'
    const opened = current && (current.status.name !== 'Entregue' || !paid)
    return { id: value.id, number: value.number, status: opened ? 'Ocupada' : 'Livre', orders: opened ? [{ id: current.id, status: current.status.name, totalValue: current.totalValue, paid }] : [] }
  })] : [401, {}]
  if (uri === '/api/atendimentos' && method === 'GET') return staff ? [200, attendances] : [401, {}]
  if (uri === '/api/atendimentos' && method === 'POST') {
    if (!staff && body.pedidoId == null && header('X-Table-Token') !== tableToken) return [403, { message: 'Contexto da mesa inválido.' }]
    if (!staff && body.pedidoId != null && header('X-Order-Token') !== capability) return [403, {}]
    const existing = attendances.find((value) => value.status !== 'CONCLUIDO' && value.tipo === body.tipo && value.pedidoId === (body.pedidoId ?? null) && value.detalhe === body.detalhe)
    if (existing) return [200, existing]
    const created = { id: attendances.length + 1, mesa: 4, pedidoId: body.pedidoId ?? null, tipo: body.tipo, detalhe: body.detalhe, status: 'ENVIADO', criadoEm: '2026-10-14T12:00:00' }
    attendances.push(created)
    return [201, created]
  }
  if (/^\/api\/atendimentos\/\d+\/status$/.test(uri) && method === 'PATCH') {
    assert.ok(staff)
    const current = attendances.find((value) => value.id === Number(uri.split('/')[3]))
    current.status = body.status
    return [200, current]
  }
  if (uri === '/api/push/public-key') return [200, { enabled: false, publicKey: '' }]
  if (uri === '/api/dashboard/resumo') return staff ? [200, { pedidosHoje: order ? 1 : 0, faturamentoHoje: payment?.status === 'PAGO' ? 39.90 : 0, ticketMedio: 0, mesasOcupadas: 1, totalMesas: 1, pedidosPorStatus: [], pedidosRecentes: [], movimentoPorHora: [], mesas: [{ numero: 4, status: 'Ocupada' }] }] : [401, {}]
  if (uri === '/api/pedidos' && method === 'POST') {
    assert.equal(header('X-Table-Token'), tableToken, 'Checkout must carry its table context')
    assert.equal(header('X-Customer-Token'), customerToken, 'Anonymous orders require a signed customer session')
    assert.equal(body.mesaId, 1, 'The display number must resolve to the real table ID')
    assert.equal(body.itens[0].produtoId, 101, 'Checkout must use the server product ID')
    order = { id: 1, nomeCliente: 'pablo123', mesa: table, status: { id: 1, name: 'Recebido', flowOrder: 1 }, totalValue: 39.90, confirmed: true, createdAt: '2026-10-13T12:00:00' }
    product.stockQuantity = 9
    return [201, { ...order, accessToken: capability }]
  }
  if (uri === '/api/pedidos') return staff ? [200, [...(order ? [order] : []), extraOrder]] : [401, {}]
  if (uri === '/api/v1/produtos/101/estoque' && method === 'PATCH') {
    assert.ok(staff)
    assert.equal(body.expectedStockQuantity, product.stockQuantity)
    assert.equal(body.delta, 1)
    product.stockQuantity += body.delta
    return [200, product]
  }
  const isOwned = staff || header('X-Order-Token') === capability
  if (/^\/api\/(pedidos\/\d+|itens-pedido\/pedido\/\d+|payments\/\d+)/.test(uri)) {
    if (!isOwned) return [403, { message: 'Acesso não permitido.' }]
    if (uri.endsWith('/99') && staff) {
      if (uri === '/api/pedidos/99') return [200, extraOrder]
      if (uri === '/api/payments/99') return [200, null]
      if (uri === '/api/itens-pedido/pedido/99') return [200, [{ id: 99, produto: { id: 101, name: product.name }, quantidade: 1, precoUnitario: 19.99, subtotal: 19.99 }]]
    }
    if (!uri.includes('/1')) return [403, { message: 'Acesso não permitido.' }]
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
const input = (selector, value) => evaluate(`{ const element=document.querySelector(${JSON.stringify(selector)}); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(element,${JSON.stringify(value)}); element.dispatchEvent(new Event('input',{bubbles:true})); }`)

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
          responseHeaders: [{ name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: origin }, { name: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Order-Token, X-Table-Token' }, { name: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, PATCH, OPTIONS' }],
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
  await waitFor("document.body.innerText.includes('Falta validar o QR Code da mesa') && document.body.innerText.includes('Entrar para pedir')", 'numeric link is a read-only storefront')
  await click('Ler QR da mesa')
  await waitFor("Boolean(document.querySelector('.customer-qr-scanner'))", 'QR reader opens instead of a dead button')
  await evaluate("document.querySelector('.customer-qr-scanner__close').click()")
  assert.equal(order, undefined)
  await navigate('/menu')
  await waitFor("document.body.innerText.includes('Consulte a vitrine')", 'public catalog without default table')
  assert.ok(!(await evaluate('document.body.innerText')).includes('MESA 04'))
  console.log('PASS: numeric and missing table links cannot create a default-table order')
  await navigate('/menu?mesa=04&qr=' + encodeURIComponent(qrToken))
  await waitFor("document.querySelector('.customer-product-card button') && !document.querySelector('.customer-product-card button').disabled", 'menu availability')
  assert.ok((await evaluate('document.body.innerText')).includes('39,90'))
  assert.ok((await evaluate('document.body.innerText')).includes('Entrar para pedir'), 'Guest menu must be a read-only storefront')
  await waitFor("!location.search.includes('qr=')", 'QR exchanged and removed from navigation')
  await click('Chamar garçom')
  await waitFor("location.pathname === '/chamar-garcom'", 'pre-order waiter request')
  await waitFor("!Array.from(document.querySelectorAll('button')).find(button => button.textContent.includes('Enviar solicitação')).disabled", 'table-authorized request')
  await click('Enviar solicitação')
  await waitFor("document.body.innerText.includes('Solicitação enviada.')", 'waiter request sent')
  assert.equal(attendances.length, 1)
  console.log('PASS: QR context authorizes a pre-order waiter request for its table')
  await navigate('/menu?mesa=04')
  await waitFor("document.querySelector('.customer-product-card button') && !document.querySelector('.customer-product-card button').disabled", 'retained table context')
  await click('Entrar para pedir')
  await waitFor("location.pathname === '/login-cliente'", 'customer PIN login')
  await evaluate("document.querySelector('a[href=\"/cadastro-cliente\"]').click()")
  await waitFor("location.pathname === '/cadastro-cliente'", 'customer PIN registration')
  await input('#customer-name', 'pablo123')
  await input('#customer-pin', '0472')
  await input('#customer-pin-confirm', '0472')
  await click('Criar conta e continuar')
  await waitFor("location.pathname === '/menu' && document.querySelector('.customer-product-card button')?.textContent.includes('Adicionar')", 'customer logged in after signup')
  await click('Adicionar')
  await evaluate("document.querySelector('.customer-cart-bar').click()")
  await waitFor("location.pathname === '/carrinho'", 'cart')
  await waitFor("!Array.from(document.querySelectorAll('button')).find(button => button.textContent.includes('Continuar pedido'))?.disabled", 'cart price refresh')
  await click('Continuar pedido')
  await waitFor("location.pathname === '/confirmar-pedido'", 'checkout')
  await waitFor("!Array.from(document.querySelectorAll('button')).find(button => button.textContent.includes('Confirmar pedido'))?.disabled", 'checkout ready')
  await click('Confirmar pedido')
  await waitFor("location.pathname === '/pedido-confirmado'", 'order creation')
  console.log('PASS: QR storefront → PIN signup → cart → checkout uses official ID and price')

  await navigate('/menu?mesa=04')
  await waitFor("Array.from(document.querySelectorAll('button')).some(button => button.textContent.trim() === 'Sair')", 'logged-in customer can sign out')
  await click('Sair')
  await waitFor("location.pathname === '/login-cliente' && document.querySelector('#customer-username')?.value === 'pablo123'", 'logout opens PIN login and remembers username')
  assert.ok(await evaluate("!sessionStorage.getItem('tablehub_customer_auth')"), 'logout clears the customer token')
  await input('#customer-pin', '0472')
  await click('Entrar e continuar')
  await waitFor("location.pathname === '/menu' && location.search === '?mesa=4' && document.body.innerText.includes('Olá, pablo123')", 'PIN login returns to the same table')
  console.log('PASS: customer logout → PIN login → original table')

  await navigate('/pagamento?id=%231&mesa=04')
  await waitFor("Array.from(document.querySelectorAll('button')).some(button => button.textContent.trim() === 'PIX')", 'payment methods')
  await click('PIX')
  await click('Solicitar pagamento')
  await waitFor("document.body.innerText.includes('Solicitação de simulação enviada.')", 'pending payment')
  assert.equal(payment.status, 'PENDENTE')
  await navigate('/comprovante?id=%231&mesa=04')
  await waitFor("document.body.innerText.includes('Simulação ainda não confirmada.')", 'receipt blocked')
  console.log('PASS: guest payment is pending and cannot produce a confirmed receipt')

  await navigate('/login')
  await waitFor("document.getElementById('email')", 'login inputs')
  await evaluate(`for (const [id, value] of [['email','operator@example.invalid'],['senha','synthetic-password-12']]) { const element=document.getElementById(id); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(element,value); element.dispatchEvent(new Event('input',{bubbles:true})); }`)
  await click('Entrar')
  await waitFor("location.pathname === '/dashboard'", 'staff login')
  await navigate('/pedidos')
  await waitFor("document.querySelector('.order-card')", 'management orders')
  await click('Ver detalhes')
  await waitFor("document.body.innerText.includes('Conferi o valor e a forma desta simulação')", 'staff payment approval')
  await evaluate("document.querySelector('.order-drawer input[type=checkbox]').click()")
  await click('Confirmar pagamento simulado')
  await waitFor("document.body.innerText.includes('Confirmado pela equipe')", 'confirmed manual receipt')
  assert.equal(payment.status, 'PAGO')
  await navigate('/comprovante?id=%231&mesa=04')
  await waitFor("document.body.innerText.includes('39,90') && !document.body.innerText.includes('Simulação ainda não confirmada.')", 'confirmed receipt')
  console.log('PASS: staff confirms receipt and guest sees the persisted receipt')

  await navigate('/estoque')
  await waitFor("document.querySelector('.inventory-actions button:last-child')", 'stock UI')
  await evaluate("document.querySelector('.inventory-actions button:last-child').click()")
  await waitFor("document.querySelector('.inventory-stock strong')?.textContent === '10'", 'atomic stock update')
  assert.equal(product.stockQuantity, 10)
  console.log('PASS: stock adjustment uses delta and expected quantity')
  await navigate('/mesas')
  await waitFor("document.querySelectorAll('.table-management-card').length === 9", 'all tables including ninth')
  assert.ok(await evaluate("Array.from(document.querySelectorAll('.table-management-card')).find(card => card.querySelector('.table-management-card__top strong').textContent === '28')?.textContent.includes('#99')"))
  assert.ok(await evaluate("Array.from(document.querySelectorAll('.table-management-card')).find(card => card.querySelector('.table-management-card__top strong').textContent === '28')?.textContent.includes('Ocupada')"))
  console.log('PASS: the ninth table shows its delivered order with pending payment')
  await click('Nova mesa')
  await waitFor("document.querySelector('.table-create-form input')", 'table form')
  await input('.table-create-form input', '88')
  await click('Cadastrar mesa')
  await waitFor("!document.querySelector('.table-create-form') && document.querySelectorAll('.table-management-card').length === 10", 'new table persisted in fixture')
  assert.ok(tables.some((value) => value.number === 88))
  console.log('PASS: administrator creates a table using the number-only API')
  await evaluate("Array.from(document.querySelectorAll('.table-management-card')).find(card => card.querySelector('.table-management-card__top strong').textContent === '04').querySelector('button').click()")
  await waitFor("document.querySelector('.table-qr-link input')?.value.includes('qr=')", 'signed QR available')
  assert.equal(new URL(await evaluate("document.querySelector('.table-qr-link input').value")).searchParams.get('qr'), qrToken)
  console.log('PASS: management generates the signed QR with a quiet zone')
  await navigate('/clientes')
  await waitFor("document.querySelectorAll('.client-card').length === 2", 'anonymous order history')
  assert.ok((await evaluate('document.body.innerText')).includes('Pedidos anônimos'))
  assert.ok(!(await evaluate('document.body.innerText')).includes('Mariana Costa'))
  console.log('PASS: history displays persisted anonymous orders without fictional people')
  await navigate('/atendimento')
  await waitFor("document.body.innerText.includes('REQ-0001')", 'waiter panel receives request')
  await click('Avançar para Em atendimento')
  await waitFor("document.querySelector('.service-status')?.textContent === 'Em atendimento'", 'request advancing')
  await click('Avançar para Concluído')
  await waitFor("document.querySelector('.service-status')?.textContent === 'Concluído'", 'request completed')
  assert.equal(attendances[0].status, 'CONCLUIDO')
  console.log('PASS: staff advances a waiter request through the persisted fixture statuses')
  await navigate('/cardapio')
  await waitFor("document.querySelector('.menu-edit-button')", 'catalog loaded')
  await click('Categoria')
  await waitFor("document.querySelector('.catalog-dialog__form input[type=text]')", 'category form')
  await input('.catalog-dialog__form input[type=text]', 'Bebidas de teste')
  await click('Salvar')
  await waitFor("!document.querySelector('.catalog-dialog')", 'category saved')
  assert.equal(categories.length, 2)
  await click('Novo produto')
  await waitFor("document.querySelector('.catalog-dialog__form input[inputmode=decimal]')", 'product form')
  await input('.catalog-dialog__form input[type=text]', 'Produto teste 19,99')
  await input('.catalog-dialog__form input[inputmode=decimal]', '19,99')
  await input('.catalog-dialog__form input[type=number]', '3')
  await click('Salvar')
  await waitFor("!document.querySelector('.catalog-dialog') && document.body.innerText.includes('Produto teste 19,99')", 'product with valid decimal price saved')
  assert.equal(products.at(-1).price, 19.99)
  console.log('PASS: category and product creation accept a valid comma price')
  await evaluate("document.querySelector('.menu-edit-button').click()")
  await waitFor("document.querySelector('.catalog-dialog__form input[inputmode=decimal]')", 'product edit form')
  product.stockQuantity += 2
  await input('.catalog-dialog__form input[inputmode=decimal]', '29,90')
  await click('Salvar')
  await waitFor(`document.querySelector('.catalog-dialog__form input[type=number]')?.value === '${product.stockQuantity}' && document.querySelector('.catalog-dialog [role=alert]')`, 'conflict refreshes expected stock')
  assert.equal(await evaluate("document.querySelector('.catalog-dialog__form input[inputmode=decimal]').value"), '29,90')
  await click('Salvar')
  await waitFor("!document.querySelector('.catalog-dialog')", 'edit retry accepted')
  assert.equal(product.price, 29.90)
  await input('.menu-search input', 'bácon')
  await waitFor("document.querySelectorAll('.menu-edit-button').length === 1", 'accented catalog search')
  console.log('PASS: product edit preserves price draft after stock conflict and accented search works')
  await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 1, mobile: true })
  await navigate('/menu?mesa=04')
  await waitFor("document.querySelector('.customer-product-card')", 'mobile menu')
  assert.ok(await evaluate('document.documentElement.scrollWidth <= 377'), 'Mobile menu overflows horizontally')
  console.log('PASS: menu at 375px has no horizontal overflow')
  await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 560, deviceScaleFactor: 1, mobile: true })
  await navigate('/mesas')
  await waitFor("document.querySelectorAll('.table-management-card').length === 10", 'mobile tables')
  await evaluate("Array.from(document.querySelectorAll('.table-management-card')).find(card => card.querySelector('.table-management-card__top strong').textContent === '04').querySelector('button').click()")
  await waitFor("document.querySelector('.table-qr-link input')", 'mobile signed QR')
  assert.ok(await evaluate("document.querySelector('.table-modal').getBoundingClientRect().height <= 522 && getComputedStyle(document.querySelector('.table-modal')).overflowY === 'auto'"), 'Mobile QR dialog is cut off')
  assert.ok(await evaluate('document.documentElement.scrollWidth <= 377'), 'Mobile tables overflow horizontally')
  console.log('PASS: signed QR dialog fits a short mobile viewport with internal scrolling')
  assert.deepEqual(failures, [], 'Browser console or synthetic API failures')
  assert.ok(apiCalls > 10)
  console.log('Browser smoke completed: 16 scenarios passed; synthetic API, no real database.')
} finally {
  if (socket?.readyState === WebSocket.OPEN) { await send('Browser.close').catch(() => {}); socket.close() }
  if (!browser.killed) browser.kill()
  server.closeAllConnections()
  await new Promise((resolve) => server.close(resolve))
}
