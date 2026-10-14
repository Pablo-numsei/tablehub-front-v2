import { customerProducts } from '../data/customerMenu.js'

const KEY = 'tablehub_customer_catalog_v2'
let cached = []
const normalize = (value = '') => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()

export const mapCustomerCatalog = (rows) => (Array.isArray(rows) ? rows : [])
  .filter((row) => Number.isSafeInteger(row?.id) && row.id > 0 && row.active !== false && Number.isFinite(Number(row.price)) && Number(row.price) > 0)
  .map((row) => {
    const photo = customerProducts.find((product) => normalize(product.name) === normalize(row.name))
    const stock = Math.max(0, Number(row.stockQuantity) || 0)
    return { id: row.id, backendId: row.id, name: row.name, category: row.category?.name || 'Outros',
      price: Number(row.price), stock, available: row.available !== false && stock > 0,
      image: photo?.image || '/favicon.svg', imageFit: photo?.imageFit || (photo ? 'cover' : 'contain') }
  })

export const saveCatalog = (products) => {
  cached = products
  try { window.sessionStorage.setItem(KEY, JSON.stringify(products)) } catch { /* Keep this open tab working. */ }
}

export const readCatalog = () => {
  if (cached.length) return cached
  try {
    const value = JSON.parse(window.sessionStorage.getItem(KEY) || '[]')
    if (Array.isArray(value)) cached = value.filter((item) => Number.isSafeInteger(item?.id) && Number.isFinite(item.price))
  } catch { /* No usable cache. */ }
  return cached
}

export const cartItems = (catalog, cart) => catalog
  .filter((product) => Number.isInteger(cart?.[product.id]) && cart[product.id] > 0)
  .map((product) => ({ ...product, quantity: cart[product.id] }))

export const cartTotal = (items) => items.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0) / 100
