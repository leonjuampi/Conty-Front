
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CashGuard } from './CashGuard';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

interface RoleRouteProps {
  children: React.ReactNode;
  allowedRoleIds: number[];
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) return null;

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Owner sin org → onboarding
  if (currentUser.roleId === 2 && !currentUser.orgId) {
    return <Navigate to="/setup" replace />;
  }

  // Redirigir a selección de sucursal si el usuario tiene varias y no tiene ninguna seleccionada
  if (!currentUser.branchId && currentUser.branchIds.length > 1) {
    return <Navigate to="/select-branch" replace />;
  }

  return (
    <CashGuard>
      {children}
    </CashGuard>
  );
}

export function RoleRoute({ children, allowedRoleIds }: RoleRouteProps) {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) return null;

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoleIds.includes(currentUser.roleId)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <CashGuard>
      {children}
    </CashGuard>
  );
}
