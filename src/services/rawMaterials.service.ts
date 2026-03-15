import { api } from './api';

export interface RawMaterial {
  id: number;
  name: string;
  origin: string | null;
  unit_price: number;
  created_at: string;
  updated_at: string;
}

export async function listRawMaterials(params?: { search?: string; limit?: number; offset?: number }) {
  const { data } = await api.get('/raw-materials', { params });
  return data as { items: RawMaterial[]; total: number };
}

export async function createRawMaterial(body: { name: string; origin?: string; unitPrice: number }) {
  const { data } = await api.post('/raw-materials', body);
  return data as { id: number };
}

export async function updateRawMaterial(id: number, body: { name?: string; origin?: string; unitPrice?: number }) {
  const { data } = await api.put(`/raw-materials/${id}`, body);
  return data;
}

export async function deleteRawMaterial(id: number) {
  const { data } = await api.delete(`/raw-materials/${id}`);
  return data;
}
