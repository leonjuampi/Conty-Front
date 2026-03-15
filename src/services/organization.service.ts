import { api } from './api';

export interface Organization {
  id: number;
  legalName: string;
  taxId: string | null;
  taxCondition: string | null;
  address: string | null;
  timezone: string | null;
  logoUrl: string | null;
  currency: string | null;
  senderEmail: string | null;
}

export async function getOrganization(id: number): Promise<Organization> {
  const { data } = await api.get(`/organizations/${id}`);
  return data;
}

export async function updateOrganization(id: number, payload: Partial<Organization>): Promise<void> {
  await api.put(`/organizations/${id}`, payload);
}

export async function createOrganization(payload: {
  legalName: string;
  taxId?: string;
  taxCondition?: string;
  address?: string;
  timezone?: string;
  currency?: string;
  senderEmail?: string;
}): Promise<{ id: number; token: string; user: { id: number; roleId: number; orgId: number; branchId: number | null; branchIds: number[]; username: string; email: string; name: string } }> {
  const { data } = await api.post('/organizations', payload);
  return data;
}
