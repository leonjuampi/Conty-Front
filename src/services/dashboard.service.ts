import { api } from './api';

export async function getDashboard(params?: { branchId?: number; minQty?: number }) {
  const { data } = await api.get('/dashboard', { params });
  return data;
}
