import { createECDH } from 'node:crypto'

const ecdh = createECDH('prime256v1')
ecdh.generateKeys()

const publicKey = ecdh.getPublicKey().toString('base64url')
const privateKey = ecdh.getPrivateKey().toString('base64url')

console.log('')
console.log('VAPID_PUBLIC_KEY=' + publicKey)
console.log('VAPID_PRIVATE_KEY=' + privateKey)
console.log('')
console.log('PowerShell:')
console.log(`$env:VAPID_PUBLIC_KEY="${publicKey}"`)
console.log(`$env:VAPID_PRIVATE_KEY="${privateKey}"`)
console.log('$env:VAPID_SUBJECT="mailto:tablehub@localhost"')
console.log('')
console.log('Não publique a chave privada no GitHub.')
