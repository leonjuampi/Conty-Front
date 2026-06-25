import { api } from './api';

export interface PriceList {
  id: number;
  org_id: number;
  branch_id: number | null;
  name: string;
  description: string | null;
  is_default: boolean;
}

export interface PriceListItem {
  id: number;
  variant_id: number;
  price: number;
  variant_name: string | null;
  sku: string | null;
  product_id: number;
  product_name: string;
  updated_at: string;
}

export async function listPriceLists(params?: { branchId?: number | null }): Promise<{ items: PriceList[] }> {
  const { data } = await api.get('/price-lists', { params });
  return data;
}

export async function createPriceList(body: {
  name: string;
  description?: string | null;
  is_default?: boolean;
  branchId?: number | null;
}): Promise<{ id: number }> {
  const { data } = await api.post('/price-lists', body);
  return data;
}

export async function updatePriceList(id: number, body: {
  name?: string;
  description?: string | null;
  is_default?: boolean;
  branch_id?: number | null;
}): Promise<void> {
  await api.put(`/price-lists/${id}`, body);
}

export async function deletePriceList(id: number): Promise<void> {
  await api.delete(`/price-lists/${id}`);
}

// ─── Items ─────────────────────────────────────────────────────────────────

export async function listPriceListItems(priceListId: number): Promise<{ items: PriceListItem[] }> {
  const { data } = await api.get(`/price-lists/${priceListId}/items`);
  return data;
}

export async function upsertPriceListItems(
  priceListId: number,
  items: { variantId: number; price: number }[]
): Promise<{ updated: number }> {
  const { data } = await api.put(`/price-lists/${priceListId}/items`, { items });
  return data;
}

export async function deletePriceListItem(priceListId: number, variantId: number): Promise<void> {
  await api.delete(`/price-lists/${priceListId}/items/${variantId}`);
}
