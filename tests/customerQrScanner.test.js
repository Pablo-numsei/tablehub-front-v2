import test from 'node:test'
import assert from 'node:assert/strict'
import { customerMenuRouteFromQr } from '../src/services/customerQrScanner.js'
import { tableQrUrl } from '../src/services/tableQr.js'

const origin = 'https://tablehub.example'
const token = 'header.payload.signature'

test('camera result opens the same table QR route used by the app', () => {
  const qr = tableQrUrl(4, token, origin)
  assert.equal(customerMenuRouteFromQr(qr, origin), '/menu?mesa=4&qr=header.payload.signature')
  assert.equal(customerMenuRouteFromQr(qr.replace('mesa=4', 'mesa=04'), origin),
    '/menu?mesa=4&qr=header.payload.signature')
})

test('scanning rejects foreign, malformed, or unscoped QR links', () => {
  const invalid = [
    'javascript:alert(1)',
    'https://evil.example/menu?mesa=4&qr=' + token,
    'https://tablehub.example/login?mesa=4&qr=' + token,
    'https://tablehub.example/menu?mesa=4',
    'https://tablehub.example/menu?mesa=4&qr=not-a-signed-token',
    'https://tablehub.example/menu?mesa=4&mesa=5&qr=' + token,
    'https://tablehub.example/menu?mesa=4&qr=' + token + '&qr=' + token,
    'https://tablehub.example/menu?mesa=0&qr=' + token,
    'https://tablehub.example/menu?mesa=4&qr=' + token + '#section',
    '',
  ]
  for (const value of invalid) assert.equal(customerMenuRouteFromQr(value, origin), null)
})
