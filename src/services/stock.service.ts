import { api } from './api';

// ── Interfaces ──────────────────────────────────────────────────────

export interface StockOverview {
  lowStock: number;
  inventoryValue: number;
  noMovement: number;
  noMovementDays: number;
}

export interface StockMovement {
  id: number;
  type: 'ENTRY' | 'SALE' | 'ADJUSTMENT' | 'TRANSFER_OUT' | 'TRANSFER_IN' | 'INVENTORY';
  productName: string;
  sku: string;
  quantity: number;
  branchId: number;
  branchName: string;
  refCode?: string;
  note?: string;
  createdAt: string;
  userName?: string;
}

export interface TransferItem {
  variant_id: number;
  quantity: number;
  productName?: string;
  sku?: string;
}

export interface StockTransfer {
  id: number;
  transferRef: string;
  originBranchId: number;
  originBranchName: string;
  destBranchId: number;
  destBranchName: string;
  status: 'PENDING' | 'RECEIVED';
  items: TransferItem[];
  createdAt: string;
  note?: string;
}

export interface InventorySession {
  id: number;
  branchId: number;
  branchName: string;
  status: 'OPEN' | 'APPROVED' | 'CANCELLED';
  createdAt: string;
  itemCount?: number;
}

export interface InventorySessionItem {
  variantId: number;
  productName: string;
  variantName: string;
  productSku: string;
  variantSku: string;
  expectedQty: number;
  countedQty: number | null;
  difference: number | null;
}

export interface InventorySessionDetail extends InventorySession {
  items: InventorySessionItem[];
}

export interface StockProduct {
  variantId: number;
  productId: number;
  productName: string;
  variantName: string;
  variantSku: string;
  productSku: string;
  price: number;
  qty: number;
}

// ── Overview ────────────────────────────────────────────────────────

export async function getStockOverview(params?: {
  branchId?: number;
  noMovementDays?: number;
}): Promise<StockOverview> {
  const { data } = await api.get('/stock/overview', { params });
  return data;
}

// ── Movements ───────────────────────────────────────────────────────

export async function listMovements(params?: {
  from?: string;
  to?: string;
  type?: string;
  branchId?: number;
  q?: string;
  limit?: number;
  offset?: number;
}): Promise<{ items: StockMovement[]; total: number }> {
  const { data } = await api.get('/stock/movements', { params });
  return data;
}

export async function createMovement(body: {
  type: 'ENTRY' | 'ADJUSTMENT';
  branchId: number;
  items: { variant_id: number; quantity: number }[];
  refCode?: string;
  note?: string;
}): Promise<{ id: number }> {
  const { data } = await api.post('/stock/movements', body);
  return data;
}

// ── Transfers ───────────────────────────────────────────────────────

export async function listTransfers(params?: {
  branchId?: number;
}): Promise<{ items: StockTransfer[] }> {
  const { data } = await api.get('/stock/transfers', { params });
  return data;
}

export async function createTransfer(body: {
  originBranchId: number;
  destBranchId: number;
  items: { variant_id: number; quantity: number }[];
  transferRef?: string;
  note?: string;
}): Promise<{ id: number; transferRef: string }> {
  const { data } = await api.post('/stock/transfers', body);
  return data;
}

export async function receiveTransfer(ref: string, body?: { branchId?: number }): Promise<void> {
  await api.post(`/stock/transfers/${ref}/receive`, body ?? {});
}

export async function getTransfer(id: number): Promise<StockTransfer> {
  const { data } = await api.get(`/stock/transfers/${id}`);
  return data;
}

// ── Inventory Sessions ──────────────────────────────────────────────

export async function listInventorySessions(params?: {
  branchId?: number;
  status?: string;
}): Promise<{ items: InventorySession[] }> {
  const { data } = await api.get('/stock/inventory/sessions', { params });
  return data;
}

export async function createInventorySession(body: {
  branchId: number;
  onlyDifferences?: boolean;
}): Promise<{ id: number }> {
  const { data } = await api.post('/stock/inventory/sessions', body);
  return data;
}

export async function getInventorySession(id: number): Promise<InventorySessionDetail> {
  const { data } = await api.get(`/stock/inventory/sessions/${id}`);
  return data;
}

export async function countInventoryItem(
  sessionId: number,
  body: { variantId: number; countedQty: number }
): Promise<void> {
  await api.post(`/stock/inventory/sessions/${sessionId}/count`, body);
}

export async function approveInventorySession(id: number): Promise<void> {
  await api.post(`/stock/inventory/sessions/${id}/approve`);
}

export async function cancelInventorySession(id: number): Promise<void> {
  await api.post(`/stock/inventory/sessions/${id}/cancel`);
}

// ── Products search ─────────────────────────────────────────────────

export async function searchStockProducts(params?: {
  q?: string;
  branchId?: number;
}): Promise<{ items: StockProduct[] }> {
  const { data } = await api.get('/stock/products', { params });
  return data;
}
