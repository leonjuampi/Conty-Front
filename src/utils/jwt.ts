export interface JwtPayload {
  uid: number;
  roleId: number;
  orgId: number | null;
  branchId: number | null;
  branchIds: number[];
  name: string;
  email: string;
  username?: string;
  exp: number;
  iat: number;
}

export function decodeToken(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    // Padding para base64
    const padded = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(padded);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(payload: JwtPayload): boolean {
  return Date.now() / 1000 > payload.exp;
}
