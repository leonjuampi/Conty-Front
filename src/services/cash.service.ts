import { api } from './api';

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
  totalsPerMethod: Record<string, number>;
  totalSales: number;
  totalOrders: number;
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
  note?: string
): Promise<{ ok: boolean; totalsPerMethod: Record<string, number>; totalSales: number }> {
  const { data } = await api.post(`/cash/${sessionId}/close`, { actualJson, note });
  return data;
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
