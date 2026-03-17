import { api } from './api';

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    username: string;
    roleId: number;
    orgId: number | null;
    branchId: number | null;
    branchIds: number[];
  };
}

export async function login(username: string, password: string, deviceId?: string, deviceLabel?: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', { username, password, deviceId, deviceLabel });
  return data;
}

export async function switchContext(branchId: number): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/switch-context', { branchId });
  return data;
}

export async function refreshToken(): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/refresh');
  return data;
}
