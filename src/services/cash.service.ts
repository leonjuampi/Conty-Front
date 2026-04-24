import { api } from './api';

export interface CashMovement {
  id: number;
  sessionId: number;
  type: 'INGRESO' | 'RETIRO_GASTO' | 'RETIRO_OWNER';
  amount: number;
  description: string | null;
  createdAt: string;
}

export interface CashSession {
  id: number;
  orgId: number;
  branchId: number;
  userId: number;
  userName: string;
  openedAt: string;
  closedAt: string | null;
  initialCash: number;
  status: 'OPEN' | 'CLOSED';
  totalsJson: Record<string, number> | null;
  actualJson: Record<string, number> | null;
  cashLeftForNext: number | null;
  totalsPerMethod: Record<string, number>;
  totalSales: number;
  totalOrders: number;
  netMovements: number;
  movements?: CashMovement[];
}

export interface SuggestedInitial {
  amount: number | null;
  closedAt: string | null;
}

export async function getActiveSession(): Promise<CashSession | null> {
  const { data } = await api.get<{ session: CashSession | null }>('/cash/active');
  return data.session;
}

export async function openSession(initialCash: number): Promise<{ id: number }> {
  const { data } = await api.post<{ id: number }>('/cash/open', { initialCash });
  return data;
}

export async function closeSession(
  sessionId: number,
  actualJson: Record<string, number>,
  note?: string,
  cashLeftForNext?: number | null
): Promise<{ ok: boolean; totalsPerMethod: Record<string, number>; totalSales: number; cashLeftForNext: number | null }> {
  const { data } = await api.post(`/cash/${sessionId}/close`, { actualJson, note, cashLeftForNext });
  return data;
}

export async function getSuggestedInitial(): Promise<SuggestedInitial> {
  const { data } = await api.get<SuggestedInitial>('/cash/suggested-initial');
  return data;
}

export async function listCashMovements(sessionId: number): Promise<CashMovement[]> {
  const { data } = await api.get<{ items: CashMovement[] }>(`/cash/${sessionId}/movements`);
  return data.items;
}

export async function createCashMovement(
  sessionId: number,
  type: 'INGRESO' | 'RETIRO_GASTO' | 'RETIRO_OWNER',
  amount: number,
  description?: string
): Promise<{ id: number }> {
  const { data } = await api.post(`/cash/${sessionId}/movements`, { type, amount, description });
  return data;
}

export async function deleteCashMovement(sessionId: number, movementId: number): Promise<void> {
  await api.delete(`/cash/${sessionId}/movements/${movementId}`);
}

export async function listSessions(params?: {
  branchId?: number;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}): Promise<{ items: CashSession[] }> {
  const { data } = await api.get('/cash', { params });
  return data;
}
