import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as apiLogin, switchContext as apiSwitchContext } from '../services/auth.service';
import { TOKEN_STORAGE_KEY, getOrCreateDeviceId } from '../services/api';
import { decodeToken, isTokenExpired, JwtPayload } from '../utils/jwt';

export interface CurrentUser {
  id: number;
  name: string;
  email: string;
  username: string;
  roleId: number;
  orgId: number | null;
  branchId: number | null;
  branchIds: number[];
}

interface AuthContextType {
  currentUser: CurrentUser | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  switchBranch: (branchId: number) => Promise<void>;
  updateAuth: (token: string, user: CurrentUser) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function userFromPayload(payload: JwtPayload): CurrentUser {
  return {
    id: payload.uid,
    name: payload.name,
    email: payload.email,
    username: payload.username || '',
    roleId: payload.roleId,
    orgId: payload.orgId,
    branchId: payload.branchId,
    branchIds: payload.branchIds || [],
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Inicializar desde localStorage al montar
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (stored) {
      const payload = decodeToken(stored);
      if (payload && !isTokenExpired(payload)) {
        setToken(stored);
        setCurrentUser(userFromPayload(payload));
      } else {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<void> => {
    const deviceId = getOrCreateDeviceId();
    const deviceLabel = `${navigator.platform} – ${navigator.userAgent.split(' ').slice(-1)[0]}`;
    const resp = await apiLogin(username, password, deviceId, deviceLabel);

    // Si el backend requiere MFA, lanzar error especial para que el login page lo maneje
    if (resp.requiresMFA && resp.mfaToken) {
      const err = new Error('MFA_REQUIRED') as Error & { mfaToken: string };
      err.mfaToken = resp.mfaToken;
      throw err;
    }

    localStorage.setItem(TOKEN_STORAGE_KEY, resp.token);
    setToken(resp.token);
    setCurrentUser({
      id: resp.user.id,
      name: resp.user.name,
      email: resp.user.email,
      username: resp.user.username,
      roleId: resp.user.roleId,
      orgId: resp.user.orgId,
      branchId: resp.user.branchId,
      branchIds: resp.user.branchIds,
    });
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setCurrentUser(null);
  };

  const updateAuth = (newToken: string, user: CurrentUser): void => {
    localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
    setToken(newToken);
    setCurrentUser(user);
  };

  const switchBranch = async (branchId: number): Promise<void> => {
    const resp = await apiSwitchContext(branchId);
    localStorage.setItem(TOKEN_STORAGE_KEY, resp.token);
    setToken(resp.token);
    setCurrentUser({
      id: resp.user.id,
      name: resp.user.name,
      email: resp.user.email,
      username: resp.user.username,
      roleId: resp.user.roleId,
      orgId: resp.user.orgId,
      branchId: resp.user.branchId,
      branchIds: resp.user.branchIds,
    });
  };

  return (
    <AuthContext.Provider value={{ currentUser, token, isLoading, login, logout, switchBranch, updateAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
