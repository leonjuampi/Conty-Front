import { api } from './api';

export interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  taxId: string | null;
  taxCondition: string | null;
  notes: string | null;
  status: string;
  balance: number;
  lastPurchaseAt: string | null;
  createdAt: string;
}

export interface CustomerSale {
  id: number;
  doc_number: string;
  total_amount: number;
  created_at: string;
  status: string;
}

export async function listCustomers(params?: {
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ items: Customer[] }> {
  const { data } = await api.get('/customers', { params });
  return data;
}

export async function getCustomer(id: number): Promise<Customer> {
  const { data } = await api.get(`/customers/${id}`);
  return data;
}

export async function createCustomer(payload: Partial<Customer>): Promise<{ id: number }> {
  const { data } = await api.post('/customers', payload);
  return data;
}

export async function updateCustomer(id: number, payload: Partial<Customer>): Promise<void> {
  await api.put(`/customers/${id}`, payload);
}

export async function deleteCustomer(id: number): Promise<void> {
  await api.delete(`/customers/${id}`);
}

export async function getSalesByCustomer(id: number): Promise<{ items: CustomerSale[] }> {
  const { data } = await api.get(`/customers/${id}/sales`);
  return data;
}
