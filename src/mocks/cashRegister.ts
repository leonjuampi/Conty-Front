export interface CashSession {
  id: string;
  userId: string;
  userName: string;
  openedAt: string;
  closedAt: string | null;
  initialCash: number;
  totalCash: number;
  totalCard: number;
  totalMercadoPago: number;
  totalSales: number;
  status: 'open' | 'closed';
}

export interface PaymentSummary {
  efectivo: number;
  tarjetaCredito: number;
  tarjetaDebito: number;
  mercadoPago: number;
  total: number;
}

export interface ClosedCashSession {
  id: string;
  userId: string;
  userName: string;
  openedAt: string;
  closedAt: string;
  initialCash: number;
  totalCash: number;
  totalCard: number;
  totalMercadoPago: number;
  totalSales: number;
  expectedCash: number;
  actualCash: number;
  actualCard: number;
  actualMercadoPago: number;
  cashDifference: number;
  cardDifference: number;
  mpDifference: number;
  totalOrders: number;
}

export const mockCashSessions: CashSession[] = [
  {
    id: 'CASH-001',
    userId: '2',
    userName: 'Pedro García',
    openedAt: '2024-01-15T09:00:00',
    closedAt: '2024-01-15T22:00:00',
    initialCash: 5000,
    totalCash: 12000,
    totalCard: 8500,
    totalMercadoPago: 4300,
    totalSales: 24800,
    status: 'closed'
  },
  {
    id: 'CASH-002',
    userId: '3',
    userName: 'Laura Fernández',
    openedAt: '2024-01-16T09:00:00',
    closedAt: null,
    initialCash: 6000,
    totalCash: 0,
    totalCard: 0,
    totalMercadoPago: 0,
    totalSales: 0,
    status: 'open'
  }
];

export const mockClosedCashSessions: ClosedCashSession[] = [
  {
    id: 'CASH-HIST-001',
    userId: '2',
    userName: 'Pedro García',
    openedAt: '2024-01-20T09:00:00',
    closedAt: '2024-01-20T23:30:00',
    initialCash: 5000,
    totalCash: 14200,
    totalCard: 9800,
    totalMercadoPago: 5600,
    totalSales: 29600,
    expectedCash: 19200,
    actualCash: 19200,
    actualCard: 9800,
    actualMercadoPago: 5600,
    cashDifference: 0,
    cardDifference: 0,
    mpDifference: 0,
    totalOrders: 47
  },
  {
    id: 'CASH-HIST-002',
    userId: '3',
    userName: 'Laura Fernández',
    openedAt: '2024-01-21T09:15:00',
    closedAt: '2024-01-21T22:45:00',
    initialCash: 5000,
    totalCash: 11500,
    totalCard: 7200,
    totalMercadoPago: 4100,
    totalSales: 22800,
    expectedCash: 16500,
    actualCash: 16350,
    actualCard: 7200,
    actualMercadoPago: 4100,
    cashDifference: -150,
    cardDifference: 0,
    mpDifference: 0,
    totalOrders: 38
  },
  {
    id: 'CASH-HIST-003',
    userId: '2',
    userName: 'Pedro García',
    openedAt: '2024-01-22T08:45:00',
    closedAt: '2024-01-22T23:00:00',
    initialCash: 6000,
    totalCash: 18300,
    totalCard: 12400,
    totalMercadoPago: 7800,
    totalSales: 38500,
    expectedCash: 24300,
    actualCash: 24500,
    actualCard: 12400,
    actualMercadoPago: 7800,
    cashDifference: 200,
    cardDifference: 0,
    mpDifference: 0,
    totalOrders: 62
  },
  {
    id: 'CASH-HIST-004',
    userId: '4',
    userName: 'Martín Suárez',
    openedAt: '2024-01-23T09:00:00',
    closedAt: '2024-01-23T22:30:00',
    initialCash: 5000,
    totalCash: 9800,
    totalCard: 6500,
    totalMercadoPago: 3200,
    totalSales: 19500,
    expectedCash: 14800,
    actualCash: 14800,
    actualCard: 6500,
    actualMercadoPago: 3200,
    cashDifference: 0,
    cardDifference: 0,
    mpDifference: 0,
    totalOrders: 31
  },
  {
    id: 'CASH-HIST-005',
    userId: '3',
    userName: 'Laura Fernández',
    openedAt: '2024-01-24T09:00:00',
    closedAt: '2024-01-24T23:15:00',
    initialCash: 5000,
    totalCash: 16700,
    totalCard: 10200,
    totalMercadoPago: 6300,
    totalSales: 33200,
    expectedCash: 21700,
    actualCash: 21700,
    actualCard: 10200,
    actualMercadoPago: 6300,
    cashDifference: 0,
    cardDifference: 0,
    mpDifference: 0,
    totalOrders: 54
  },
  {
    id: 'CASH-HIST-006',
    userId: '2',
    userName: 'Pedro García',
    openedAt: '2024-01-25T08:30:00',
    closedAt: '2024-01-25T23:45:00',
    initialCash: 6000,
    totalCash: 21400,
    totalCard: 14800,
    totalMercadoPago: 9200,
    totalSales: 45400,
    expectedCash: 27400,
    actualCash: 27100,
    actualCard: 14800,
    actualMercadoPago: 9200,
    cashDifference: -300,
    cardDifference: 0,
    mpDifference: 0,
    totalOrders: 71
  },
  {
    id: 'CASH-HIST-007',
    userId: '4',
    userName: 'Martín Suárez',
    openedAt: '2024-01-26T09:00:00',
    closedAt: '2024-01-26T22:00:00',
    initialCash: 5000,
    totalCash: 13200,
    totalCard: 8900,
    totalMercadoPago: 4700,
    totalSales: 26800,
    expectedCash: 18200,
    actualCash: 18200,
    actualCard: 8900,
    actualMercadoPago: 4700,
    cashDifference: 0,
    cardDifference: 0,
    mpDifference: 0,
    totalOrders: 43
  },
  {
    id: 'CASH-HIST-008',
    userId: '3',
    userName: 'Laura Fernández',
    openedAt: '2024-01-27T09:00:00',
    closedAt: '2024-01-27T23:30:00',
    initialCash: 5000,
    totalCash: 17900,
    totalCard: 11600,
    totalMercadoPago: 7100,
    totalSales: 36600,
    expectedCash: 22900,
    actualCash: 23050,
    actualCard: 11600,
    actualMercadoPago: 7100,
    cashDifference: 150,
    cardDifference: 0,
    mpDifference: 0,
    totalOrders: 58
  }
];