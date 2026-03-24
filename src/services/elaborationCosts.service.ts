import { api } from './api';

export interface ElaborationCostItem {
  id: number;
  cost_id: number;
  item_type: 'RAW_MATERIAL' | 'ELABORATION_COST';
  raw_material_id: number | null;
  raw_material_name: string | null;
  raw_material_price: number | null;
  sub_cost_id: number | null;
  sub_cost_name: string | null;
  formula: string;
  sort_order: number;
}

export interface ElaborationCost {
  id: number;
  name: string;
  product_id: number | null;
  items: ElaborationCostItem[];
  created_at: string;
  updated_at: string;
}

export interface ItemInput {
  item_type: 'RAW_MATERIAL' | 'ELABORATION_COST';
  raw_material_id?: number | null;
  sub_cost_id?: number | null;
  formula: string;
}

export async function listElaborationCosts(): Promise<ElaborationCost[]> {
  const { data } = await api.get('/elaboration-costs');
  return data;
}

export async function createElaborationCost(body: { name: string; items: ItemInput[]; productId?: number }) {
  const { data } = await api.post('/elaboration-costs', body);
  return data as { id: number };
}

export async function updateElaborationCost(id: number, body: { name?: string; items?: ItemInput[] }) {
  const { data } = await api.put(`/elaboration-costs/${id}`, body);
  return data;
}

export async function deleteElaborationCost(id: number) {
  const { data } = await api.delete(`/elaboration-costs/${id}`);
  return data;
}

export async function getElaborationSettings(): Promise<{ monthly_local_cost: number }> {
  const { data } = await api.get('/elaboration-costs/settings');
  return data;
}

export async function updateElaborationSettings(monthly_local_cost: number) {
  const { data } = await api.put('/elaboration-costs/settings', { monthly_local_cost });
  return data;
}
