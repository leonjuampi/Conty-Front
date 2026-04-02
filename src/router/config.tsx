import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import { ProtectedRoute, RoleRoute } from '../components/feature/ProtectedRoute';
import { CashGuard } from '../components/feature/CashGuard';
import { ROLE_IDS } from '../utils/roles';

const HomePage = lazy(() => import('../pages/home/page'));
const DashboardPage = lazy(() => import('../pages/dashboard/page'));
const OrdersPage = lazy(() => import('../pages/orders/page'));
const ProductsPage = lazy(() => import('../pages/products/page'));
const InventoryPage = lazy(() => import('../pages/inventory/page'));
const ReportsPage = lazy(() => import('../pages/reports/page'));
const AuditPage = lazy(() => import('../pages/audit/page'));
const SettingsPage = lazy(() => import('../pages/settings/page'));
const CashPage = lazy(() => import('../pages/cash/page'));
const LoginPage = lazy(() => import('../pages/login/page'));
const NotFoundPage = lazy(() => import('../pages/NotFound'));
const ClientsPage = lazy(() => import('../pages/clients/page'));
const SelectBranchPage = lazy(() => import('../pages/select-branch/page'));
const SetupPage = lazy(() => import('../pages/setup/page'));
const StockPage = lazy(() => import('../pages/stock/page'));
const SuperAdminPage = lazy(() => import('../pages/superadmin/page'));
const ForgotPasswordPage = lazy(() => import('../pages/forgot-password/page'));
const ResetPasswordPage = lazy(() => import('../pages/reset-password/page'));
const MfaVerifyPage = lazy(() => import('../pages/mfa-verify/page'));

const routes: RouteObject[] = [
  {
    path: '/',
    element: <ProtectedRoute><HomePage /></ProtectedRoute>,
  },
  {
    path: '/dashboard',
    element: <ProtectedRoute><DashboardPage /></ProtectedRoute>,
  },
  {
    path: '/orders',
    element: (
      <ProtectedRoute>
        <CashGuard>
          <OrdersPage />
        </CashGuard>
      </ProtectedRoute>
    ),
  },
  {
    path: '/clients',
    element: <ProtectedRoute><ClientsPage /></ProtectedRoute>,
  },
  {
    path: '/cash',
    element: <ProtectedRoute><CashPage /></ProtectedRoute>,
  },
  {
    path: '/products',
    element: (
      <RoleRoute allowedRoleIds={[ROLE_IDS.ADMIN, ROLE_IDS.OWNER]}>
        <ProductsPage />
      </RoleRoute>
    ),
  },
  {
    path: '/inventory',
    element: (
      <RoleRoute allowedRoleIds={[ROLE_IDS.ADMIN, ROLE_IDS.OWNER]}>
        <InventoryPage />
      </RoleRoute>
    ),
  },
  {
    path: '/stock',
    element: (
      <RoleRoute allowedRoleIds={[ROLE_IDS.ADMIN, ROLE_IDS.OWNER, ROLE_IDS.VENDEDOR]}>
        <StockPage />
      </RoleRoute>
    ),
  },
  {
    path: '/reports',
    element: (
      <RoleRoute allowedRoleIds={[ROLE_IDS.ADMIN, ROLE_IDS.OWNER, ROLE_IDS.VENDEDOR]}>
        <ReportsPage />
      </RoleRoute>
    ),
  },
  {
    path: '/audit',
    element: (
      <RoleRoute allowedRoleIds={[ROLE_IDS.ADMIN, ROLE_IDS.OWNER]}>
        <AuditPage />
      </RoleRoute>
    ),
  },
  {
    path: '/settings',
    element: (
      <RoleRoute allowedRoleIds={[ROLE_IDS.ADMIN, ROLE_IDS.OWNER]}>
        <SettingsPage />
      </RoleRoute>
    ),
  },
  {
    path: '/superadmin',
    element: (
      <RoleRoute allowedRoleIds={[ROLE_IDS.ADMIN]}>
        <SuperAdminPage />
      </RoleRoute>
    ),
  },
  {
    path: '/select-branch',
    element: <ProtectedRoute><SelectBranchPage /></ProtectedRoute>,
  },
  {
    path: '/setup',
    element: <SetupPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },
  {
    path: '/mfa-verify',
    element: <MfaVerifyPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
];

export default routes;
