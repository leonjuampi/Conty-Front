import { api } from './api';

export interface NumberingRule {
  id: number;
  orgId: number;
  docType: string;
  format: string;
  nextNumber: number;
  padding: number;
  resetPolicy: 'NEVER' | 'YEARLY' | 'MONTHLY';
}

export async function listNumberingRules(): Promise<{ items: NumberingRule[] }> {
  const { data } = await api.get('/numbering/rules');
  return data;
}

export async function upsertNumberingRule(body: {
  docType: string;
  format: string;
  nextNumber?: number;
  padding?: number;
  resetPolicy?: 'NEVER' | 'YEARLY' | 'MONTHLY';
}): Promise<void> {
  await api.post('/numbering/rules', body);
}

export async function deleteNumberingRule(docType: string): Promise<void> {
  await api.delete(`/numbering/rules/${docType}`);
}
