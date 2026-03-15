import { api } from './api';

export async function listAuditLogs(params?: {
  actionType?: string;
  entityType?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}) {
  const { data } = await api.get('/audit-logs', { params });
  return data;
}
