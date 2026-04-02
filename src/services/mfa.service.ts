import { api } from './api';

export interface MfaSetupResponse {
  secret: string;
  qrDataUrl: string;
}

export interface MfaVerifySetupResponse {
  backupCodes: string[];
}

export interface MfaStatusResponse {
  enabled: boolean;
  backupCodesRemaining: number;
}

export interface MfaVerifyLoginResponse {
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
    plan: string;
  };
}

export async function mfaSetup(): Promise<MfaSetupResponse> {
  const { data } = await api.post<MfaSetupResponse>('/auth/mfa/setup');
  return data;
}

export async function mfaVerifySetup(token: string): Promise<MfaVerifySetupResponse> {
  const { data } = await api.post<MfaVerifySetupResponse>('/auth/mfa/verify-setup', { token });
  return data;
}

export async function mfaVerifyLogin(token: string, mfaToken: string): Promise<MfaVerifyLoginResponse> {
  const { data } = await api.post<MfaVerifyLoginResponse>('/auth/mfa/verify', { token }, {
    headers: { Authorization: `Bearer ${mfaToken}` },
  });
  return data;
}

export async function mfaStatus(): Promise<MfaStatusResponse> {
  const { data } = await api.get<MfaStatusResponse>('/auth/mfa/status');
  return data;
}

export async function mfaDisable(password: string): Promise<void> {
  await api.post('/auth/mfa/disable', { password });
}

export async function mfaRegenerateCodes(): Promise<MfaVerifySetupResponse> {
  const { data } = await api.post<MfaVerifySetupResponse>('/auth/mfa/regenerate-codes');
  return data;
}
