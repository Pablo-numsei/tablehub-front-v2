export const customerProducts = [
  { id: 1, name: 'Smash Table', category: 'Hambúrgueres', price: 24, available: true },
  { id: 2, name: 'Burger Especial', category: 'Hambúrgueres', price: 31.9, available: true },
  { id: 3, name: 'Batata Crocante', category: 'Acompanhamentos', price: 18, available: true },
  { id: 4, name: 'Onion Rings', category: 'Acompanhamentos', price: 20, available: false },
  { id: 5, name: 'Refrigerante', category: 'Bebidas', price: 12.9, available: true },
  { id: 6, name: 'Brownie', category: 'Sobremesas', price: 16, available: true },
]

export const customerCategories = [
  'Todos',
  'Hambúrgueres',
  'Acompanhamentos',
  'Bebidas',
  'Sobremesas',
]

export const money = (value) =>
  Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
