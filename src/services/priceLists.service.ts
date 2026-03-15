import { api } from './api';

export interface PriceList {
  id: number;
  org_id: number;
  name: string;
  description: string | null;
  is_default: boolean;
}

export async function listPriceLists(): Promise<{ items: PriceList[] }> {
  const { data } = await api.get('/price-lists');
  return data;
}

export async function createPriceList(body: { name: string; description?: string | null; is_default?: boolean }): Promise<{ id: number }> {
  const { data } = await api.post('/price-lists', body);
  return data;
}

export async function updatePriceList(id: number, body: { name?: string; description?: string | null; is_default?: boolean }): Promise<void> {
  await api.put(`/price-lists/${id}`, body);
}

export async function deletePriceList(id: number): Promise<void> {
  await api.delete(`/price-lists/${id}`);
}
