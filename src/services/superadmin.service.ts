import { api } from './api';

export interface OrgItem {
  id: number;
  name: string;
  legal_name: string | null;
  plan: 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE';
  plan_expires_at: string | null;
  max_licenses: number;
  created_at: string;
  product_count: number;
  branch_count: number;
  active_devices: number;
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

export async function updateOrgPlan(orgId: number, plan: string, max_licenses: number, plan_expires_at: string | null) {
  const { data } = await api.put(`/superadmin/orgs/${orgId}/plan`, { plan, max_licenses, plan_expires_at });
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
