import { api } from './api';

export interface OrgUser {
  id: number;
  name: string;
  email: string | null;
  username: string;
  roleId: number;
  status: 'ACTIVE' | 'INVITED' | string;
  createdAt: string;
}

export async function listUsers(params?: { search?: string; page?: number; pageSize?: number }) {
  const { data } = await api.get('/users', { params });
  return data as { items: OrgUser[]; total: number; page: number; pageSize: number };
}

export async function getUserBranches(userId: number): Promise<{ items: { id: number; name: string; address: string | null }[] }> {
  const { data } = await api.get(`/users/${userId}/branches`);
  return data;
}

export async function replaceUserBranches(userId: number, branches: number[]): Promise<void> {
  await api.put(`/users/${userId}/branches`, { branches });
}

export async function createUser(body: {
  name: string;
  email: string;
  username: string;
  password: string;
  roleId: number;
  orgId?: number | null;
  branches?: number[];
}) {
  const { data } = await api.post('/users', body);
  return data as { id: number };
}
