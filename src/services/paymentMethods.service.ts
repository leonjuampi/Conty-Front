import { api } from './api';

export interface PaymentMethod {
  id: number;
  orgId: number;
  name: string;
  kind: 'CASH' | 'DEBIT' | 'CREDIT' | 'TRANSFER' | 'MIXED';
  max_installments: number;
  surcharge_pct: number;
  discount_pct: number;
  ticket_note: string | null;
  active: boolean;
}

export async function listPaymentMethods(): Promise<{ items: PaymentMethod[] }> {
  const { data } = await api.get('/payment-methods');
  return data;
}

export async function createPaymentMethod(body: Omit<PaymentMethod, 'id' | 'orgId'>): Promise<{ id: number }> {
  const { data } = await api.post('/payment-methods', body);
  return data;
}

export async function updatePaymentMethod(id: number, body: Partial<Omit<PaymentMethod, 'id' | 'orgId'>>): Promise<void> {
  await api.put(`/payment-methods/${id}`, body);
}

export async function deletePaymentMethod(id: number): Promise<void> {
  await api.delete(`/payment-methods/${id}`);
}
