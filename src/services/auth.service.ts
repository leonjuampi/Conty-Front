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

export async function forgotPassword(email: string): Promise<void> {
  await api.post('/auth/forgot-password', { email });
}

export async function checkResetToken(token: string): Promise<{ valid: boolean; email: string; username: string }> {
  const { data } = await api.get('/auth/check-reset-token', { params: { token } });
  return data;
}

export async function resetPassword(token: string, password: string): Promise<void> {
  await api.post('/auth/reset-password', { token, password });
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await api.post('/auth/change-password', { currentPassword, newPassword });
}
