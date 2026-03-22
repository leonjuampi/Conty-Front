import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getOrganization } from '../services/organization.service';

export type OrgType = 'FOOD' | 'RETAIL';

export interface Theme {
  orgType: OrgType;
  storeIcon: string;
}

const THEMES: Record<OrgType, Theme> = {
  FOOD:   { orgType: 'FOOD',   storeIcon: 'ri-store-2-line' },
  RETAIL: { orgType: 'RETAIL', storeIcon: 'ri-store-3-line' },
};

const DEFAULT_THEME = THEMES.RETAIL;

const ThemeContext = createContext<Theme>(DEFAULT_THEME);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);

  useEffect(() => {
    if (!currentUser?.orgId) {
      document.documentElement.setAttribute('data-theme', 'RETAIL');
      setTheme(DEFAULT_THEME);
      return;
    }
    getOrganization(currentUser.orgId)
      .then(org => {
        const type: OrgType = org.orgType === 'FOOD' ? 'FOOD' : 'RETAIL';
        document.documentElement.setAttribute('data-theme', type);
        setTheme(THEMES[type]);
      })
      .catch(() => {
        document.documentElement.setAttribute('data-theme', 'RETAIL');
        setTheme(DEFAULT_THEME);
      });
  }, [currentUser?.orgId]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
