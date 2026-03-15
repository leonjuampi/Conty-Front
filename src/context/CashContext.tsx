import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
  getActiveSession,
  openSession,
  closeSession,
  CashSession,
} from '../services/cash.service';

interface CashContextType {
  activeSession: CashSession | null;
  isLoadingSession: boolean;
  hasCashOpen: boolean;
  openCash: (initialAmount: number) => Promise<void>;
  closeCash: (actualJson: Record<string, number>, note?: string) => Promise<void>;
  refreshSession: () => Promise<void>;
}

const CashContext = createContext<CashContextType | undefined>(undefined);

export function CashProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const [activeSession, setActiveSession] = useState<CashSession | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);

  const refreshSession = useCallback(async () => {
    if (!currentUser?.branchId) {
      setActiveSession(null);
      return;
    }
    setIsLoadingSession(true);
    try {
      const session = await getActiveSession();
      setActiveSession(session);
    } catch {
      setActiveSession(null);
    } finally {
      setIsLoadingSession(false);
    }
  }, [currentUser?.branchId]);

  // Cargar sesión activa cuando cambia el usuario/sucursal
  useEffect(() => {
    if (currentUser) {
      refreshSession();
    } else {
      setActiveSession(null);
    }
  }, [currentUser, refreshSession]);

  const openCash = async (initialAmount: number): Promise<void> => {
    await openSession(initialAmount);
    await refreshSession();
  };

  const closeCash = async (actualJson: Record<string, number>, note?: string): Promise<void> => {
    if (!activeSession) throw new Error('No hay sesión abierta');
    await closeSession(activeSession.id, actualJson, note);
    setActiveSession(null);
  };

  const hasCashOpen = activeSession !== null && activeSession.status === 'OPEN';

  return (
    <CashContext.Provider value={{ activeSession, isLoadingSession, hasCashOpen, openCash, closeCash, refreshSession }}>
      {children}
    </CashContext.Provider>
  );
}

export function useCash() {
  const context = useContext(CashContext);
  if (context === undefined) {
    throw new Error('useCash must be used within a CashProvider');
  }
  return context;
}
