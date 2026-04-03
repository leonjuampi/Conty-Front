import { api } from './api';

export interface OrgItem {
  id: number;
  name: string;
  legal_name: string | null;
  plan: 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE';
  plan_expires_at: string | null;
  max_licenses: number;
  org_type: 'FOOD' | 'RETAIL';
  created_at: string;
  product_count: number;
  branch_count: number;
  active_devices: number;
  user_count: number;
  limits: {
    max_products: number | null;
    max_branches: number | null;
    max_licenses_ceiling: number | null;
  };
}

export interface DeviceItem {
  id: number;
  device_id: string;
  device_label: string | null;
  ip_address: string | null;
  user_agent: string | null;
  last_seen: string;
  created_at: string;
  is_active: number;
  registered_by_name: string | null;
  registered_by_username: string | null;
}

export async function listOrgs(): Promise<OrgItem[]> {
  const { data } = await api.get<{ items: OrgItem[] }>('/superadmin/orgs');
  return data.items;
}

export async function updateOrgPlan(
  orgId: number,
  plan: string,
  max_licenses: number,
  plan_expires_at: string | null,
  org_type: 'FOOD' | 'RETAIL'
) {
  const { data } = await api.put(`/superadmin/orgs/${orgId}/plan`, { plan, max_licenses, plan_expires_at, org_type });
  return data;
}

export async function listDevices(orgId: number): Promise<DeviceItem[]> {
  const { data } = await api.get<{ items: DeviceItem[] }>(`/superadmin/orgs/${orgId}/devices`);
  return data.items;
}

export async function revokeDevice(orgId: number, deviceId: number) {
  const { data } = await api.delete(`/superadmin/orgs/${orgId}/devices/${deviceId}`);
  return data;
}

export interface UserItem {
  id: number;
  name: string;
  email: string | null;
  username: string;
  roleId: number;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
  failedAttempts: number;
  lockoutUntil: string | null;
}

export async function listOrgUsers(orgId: number): Promise<UserItem[]> {
  const { data } = await api.get<{ items: UserItem[] }>(`/superadmin/orgs/${orgId}/users`);
  return data.items;
}

export async function forceResetPassword(userId: number): Promise<void> {
  await api.post(`/superadmin/users/${userId}/force-reset-password`);
}

export async function setUserPassword(userId: number, password: string): Promise<void> {
  await api.post(`/superadmin/users/${userId}/set-password`, { password });
}

export async function toggleUserStatus(userId: number, status: 'ACTIVE' | 'DISABLED'): Promise<void> {
  await api.post(`/superadmin/users/${userId}/toggle-status`, { status });
}

export async function unlockUser(userId: number): Promise<void> {
  await api.post(`/superadmin/users/${userId}/unlock`);
}

export interface CreateOrgPayload {
  name: string;
  legal_name?: string;
  plan?: string;
  max_licenses?: number;
  plan_expires_at?: string | null;
  org_type?: 'FOOD' | 'RETAIL';
}

export async function createOrg(payload: CreateOrgPayload): Promise<{ ok: boolean; id: number }> {
  const { data } = await api.post<{ ok: boolean; id: number }>('/superadmin/orgs', payload);
  return data;
}
