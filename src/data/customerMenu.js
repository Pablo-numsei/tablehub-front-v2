export const customerProducts = [
  {
    id: 1,
    name: 'Hambúrguer com Bacon',
    category: 'Hambúrgueres',
    price: 31.9,
    available: true,
    image: '/images/menu/hamburguer-bacon.webp',
  },
  {
    id: 2,
    name: 'Hambúrguer de Frango',
    category: 'Hambúrgueres',
    price: 24,
    available: true,
    image: '/images/menu/hamburguer-frango.webp',
  },
  {
    id: 3,
    name: 'Batata Frita',
    category: 'Acompanhamentos',
    price: 18,
    available: true,
    image: '/images/menu/batata-frita.webp',
  },
  {
    id: 4,
    name: 'Batata Rústica',
    category: 'Acompanhamentos',
    price: 20,
    available: true,
    image: '/images/menu/batata-rustica.webp',
  },
  {
    id: 5,
    name: 'Onion Rings',
    category: 'Acompanhamentos',
    price: 20,
    available: true,
    image: '/images/menu/onion-rings.webp',
  },
  {
    id: 6,
    name: 'Nuggets de Frango',
    category: 'Acompanhamentos',
    price: 18,
    available: true,
    image: '/images/menu/nuggets.webp',
  },
  {
    id: 7,
    name: 'Mini Pastéis',
    category: 'Acompanhamentos',
    price: 22,
    available: true,
    image: '/images/menu/mini-pasteis.webp',
  },
  {
    id: 8,
    name: 'Coca-Cola 350 ml',
    category: 'Bebidas',
    price: 12.9,
    available: true,
    image: '/images/menu/coca-cola.webp',
  },
  {
    id: 9,
    name: 'Banoffee',
    category: 'Sobremesas',
    price: 16,
    available: true,
    image: '/images/menu/banoffee.webp',
  },
  {
    id: 10,
    name: 'Petit Gâteau',
    category: 'Sobremesas',
    price: 22,
    available: true,
    image: '/images/menu/petit-gateau.webp',
  },
  {
    id: 11,
    name: 'Pudim de Leite',
    category: 'Sobremesas',
    price: 14,
    available: true,
    image: '/images/menu/pudim.webp',
  },
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
