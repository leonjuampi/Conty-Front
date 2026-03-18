import { api } from './api';

export interface SaleItem {
  variantId: number;
  qty: number;
  unitPrice: number;
  vatPercent?: number;
  discountPercent?: number;
}

export interface SalePayment {
  method: string;
  amount: number;
  note?: string;
}

export interface CreateSalePayload {
  branchId: number;
  posCode: string;
  docType: string;
  customerId?: number | null;
  items: SaleItem[];
  payments: SalePayment[];
  note?: string;
  deliveryPlatform?: string | null;
}

export interface Sale {
  id: number;
  docType: string;
  docText: string;
  docNumber: string;
  branchId: number;
  branchName: string;
  customerId: number | null;
  customerName: string | null;
  total: number;
  status: string;
  deliveryPlatform: string | null;
  createdAt: string;
  hasPendingPayment: boolean;
}

export async function listSales(params?: {
  branchId?: number;
  status?: string;
  from?: string;
  to?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ items: Sale[] }> {
  const { data } = await api.get('/sales', { params });
  return data;
}

export async function getSale(id: number): Promise<Sale & { items: SaleItem[]; payments: SalePayment[] }> {
  const { data } = await api.get(`/sales/${id}`);
  return data;
}

export async function createSale(payload: CreateSalePayload): Promise<{ id: number; docText: string; total: number }> {
  const { data } = await api.post('/sales', payload);
  return data;
}

export async function cancelSale(id: number, reason?: string): Promise<void> {
  await api.post(`/sales/${id}/cancel`, { reason });
}

export async function addPayments(id: number, payments: SalePayment[]): Promise<void> {
  await api.post(`/sales/${id}/payments`, { payments });
}

export async function listPaymentMethods(): Promise<{ items: { id: number; name: string; isActive: boolean }[] }> {
  const { data } = await api.get('/payment-methods');
  return data;
}
