export type Order = {
  id: string;
  date: string;
  clientId: string;
  clientName: string;
  items: { productId: string; productName: string; quantity: number; price: number }[];
  subtotal: number;
  total: number;
  paymentMethod: string;
  orderType: string;
  appSource?: 'Pedidos Ya' | 'Rappi';
  seller: string;
  cashReceived?: number;
  change?: number;
  notes: string;
};

export const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    date: '2024-01-16T14:30:00',
    clientId: '1',
    clientName: 'Juan Pérez',
    items: [
      { productId: '1', productName: 'Pizza Muzzarella', quantity: 2, price: 2500 },
      { productId: '6', productName: 'Coca Cola 1.5L', quantity: 1, price: 800 }
    ],
    subtotal: 5800,
    total: 5800,
    paymentMethod: 'Efectivo',
    orderType: 'Particular',
    seller: 'Pedro García',
    cashReceived: 6000,
    change: 200,
    notes: 'Sin cebolla en la pizza. Entregar en puerta trasera.'
  },
  {
    id: 'ORD-002',
    date: '2024-01-16T15:45:00',
    clientId: '3',
    clientName: 'Carlos Rodríguez',
    items: [
      { productId: '3', productName: 'Pizza Calabresa', quantity: 1, price: 3200 },
      { productId: '4', productName: 'Empanada de Carne', quantity: 6, price: 450 }
    ],
    subtotal: 5900,
    total: 5900,
    paymentMethod: 'Tarjeta Débito',
    orderType: 'Aplicación',
    appSource: 'Pedidos Ya',
    seller: 'Laura Fernández',
    notes: 'Pedido urgente, cliente espera en local.'
  },
  {
    id: 'ORD-003',
    date: '2024-01-16T16:20:00',
    clientId: '2',
    clientName: 'María González',
    items: [
      { productId: '2', productName: 'Pizza Napolitana', quantity: 1, price: 2800 },
      { productId: '7', productName: 'Fanta 1.5L', quantity: 2, price: 750 }
    ],
    subtotal: 4300,
    total: 4300,
    paymentMethod: 'Mercado Pago',
    orderType: 'Particular',
    seller: 'Pedro García',
    notes: ''
  },
  {
    id: 'ORD-004',
    date: '2024-01-15T19:30:00',
    clientId: '5',
    clientName: 'Roberto López',
    items: [
      { productId: '8', productName: 'Pizza Fugazzeta', quantity: 2, price: 3000 },
      { productId: '5', productName: 'Empanada de Jamón y Queso', quantity: 4, price: 400 }
    ],
    subtotal: 7600,
    total: 7600,
    paymentMethod: 'Tarjeta Crédito',
    orderType: 'Aplicación',
    appSource: 'Rappi',
    seller: 'Laura Fernández',
    notes: 'Alergia al gluten — verificar ingredientes antes de preparar.'
  },
  {
    id: 'ORD-005',
    date: '2024-01-15T20:10:00',
    clientId: '4',
    clientName: 'Ana Martínez',
    items: [
      { productId: '1', productName: 'Pizza Muzzarella', quantity: 1, price: 2500 },
      { productId: '4', productName: 'Empanada de Carne', quantity: 4, price: 450 }
    ],
    subtotal: 4300,
    total: 4300,
    paymentMethod: 'Mercado Pago',
    orderType: 'Aplicación',
    appSource: 'Pedidos Ya',
    seller: 'Pedro García',
    notes: 'Sin picante.'
  },
  {
    id: 'ORD-006',
    date: '2024-01-14T13:00:00',
    clientId: '6',
    clientName: 'Sofía Torres',
    items: [
      { productId: '3', productName: 'Pizza Calabresa', quantity: 2, price: 3200 }
    ],
    subtotal: 6400,
    total: 6400,
    paymentMethod: 'Efectivo',
    orderType: 'Aplicación',
    appSource: 'Rappi',
    seller: 'Martín Suárez',
    notes: ''
  },
  {
    id: 'ORD-007',
    date: '2024-01-14T18:45:00',
    clientId: '7',
    clientName: 'Diego Ramírez',
    items: [
      { productId: '2', productName: 'Pizza Napolitana', quantity: 2, price: 2800 },
      { productId: '6', productName: 'Coca Cola 1.5L', quantity: 2, price: 800 }
    ],
    subtotal: 7200,
    total: 7200,
    paymentMethod: 'Tarjeta Débito',
    orderType: 'Particular',
    seller: 'Martín Suárez',
    cashReceived: 0,
    change: 0,
    notes: ''
  },
  {
    id: 'ORD-008',
    date: '2024-01-13T21:00:00',
    clientId: '1',
    clientName: 'Juan Pérez',
    items: [
      { productId: '8', productName: 'Pizza Fugazzeta', quantity: 1, price: 3000 },
      { productId: '5', productName: 'Empanada de Jamón y Queso', quantity: 6, price: 400 }
    ],
    subtotal: 5400,
    total: 5400,
    paymentMethod: 'Efectivo',
    orderType: 'Aplicación',
    appSource: 'Pedidos Ya',
    seller: 'Laura Fernández',
    notes: 'Entregar antes de las 21:30.'
  }
];
