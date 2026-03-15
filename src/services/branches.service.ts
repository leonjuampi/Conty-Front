import { api } from './api';

export interface Branch {
  id: number;
  orgId: number;
  name: string;
  address: string | null;
  phone: string | null;
  channel: 'LOCAL' | 'ONLINE';
  printerName: string | null;
  printerCode: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}

export async function listBranches(params?: { orgId?: number; status?: string }): Promise<{ items: Branch[] }> {
  const { data } = await api.get('/branches', { params });
  return data;
}

export async function createBranch(body: Omit<Branch, 'id' | 'orgId'>): Promise<{ id: number }> {
  const { data } = await api.post('/branches', body);
  return data;
}

export async function updateBranch(id: number, body: Partial<Omit<Branch, 'id' | 'orgId'>>): Promise<void> {
  await api.put(`/branches/${id}`, body);
}

export async function deleteBranch(id: number): Promise<void> {
  await api.delete(`/branches/${id}`);
}
