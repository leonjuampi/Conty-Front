import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCash } from '../../context/CashContext';
import { ChangePasswordModal } from './ChangePasswordModal';
import { MFASetupModal } from './MFASetupModal';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// roleId: 1=Admin, 2=Owner, 3=Vendedor
const ALL_MENU_ITEMS = [
  { path: '/dashboard', icon: 'ri-dashboard-line', label: 'Dashboard', roleIds: [1, 2, 3] },
  { path: '/orders', icon: 'ri-shopping-cart-line', label: 'Panel de Pedidos', roleIds: [1, 2, 3] },
  { path: '/clients', icon: 'ri-group-line', label: 'Clientes', roleIds: [1, 2, 3] },
  { path: '/cash', icon: 'ri-safe-line', label: 'Módulo de Caja', roleIds: [1, 2, 3] },
  { path: '/reports', icon: 'ri-bar-chart-box-line', label: 'Reportes', roleIds: [1, 2, 3] },
  { path: '/products', icon: 'ri-product-hunt-line', label: 'Productos', roleIds: [1, 2] },
  { path: '/stock', icon: 'ri-stack-line', label: 'Stock', roleIds: [1, 2, 3] },
  { path: '/inventory', icon: 'ri-box-3-line', label: 'Mercadería y Costos', roleIds: [1, 2] },
  { path: '/audit', icon: 'ri-file-list-3-line', label: 'Auditoría', roleIds: [1, 2] },
  { path: '/settings', icon: 'ri-settings-3-line', label: 'Configuración', roleIds: [1, 2] },
  { path: '/superadmin', icon: 'ri-shield-star-line', label: 'Super Admin', roleIds: [1] },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { hasCashOpen, activeSession } = useCash();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showMFA, setShowMFA] = useState(false);

  const menuItems = ALL_MENU_ITEMS.filter(
    item => currentUser && item.roleIds.includes(currentUser.roleId)
  );

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  const roleLabel: Record<number, string> = {
    1: 'Administrador',
    2: 'Owner',
    3: 'Vendedor',
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  };

  const nameInitial = currentUser?.name?.charAt(0)?.toUpperCase() ?? 'U';

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        ></div>
      )}

      <div className={`
        fixed top-0 left-0 z-50
        w-64 h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white
        flex flex-col shadow-2xl
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/LOGO-BYN-COMPLETO.png" alt="Conty" className="h-14 brightness-0 invert" />
            </div>
            <button
              onClick={onClose}
              className="md:hidden w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>
        </div>

        {/* Estado de Caja */}
        <div className="px-4 pt-4 pb-2">
          <div className={`px-3 py-2 rounded-lg ${hasCashOpen ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'}`}>
            <div className="flex items-center gap-2">
              <i className={`ri-safe-line text-sm ${hasCashOpen ? 'text-green-400' : 'text-red-400'}`}></i>
              <span className={`text-xs font-semibold ${hasCashOpen ? 'text-green-400' : 'text-red-400'}`}>
                {hasCashOpen ? 'Caja Abierta' : 'Caja Cerrada'}
              </span>
            </div>
            {hasCashOpen && activeSession && (
              <p className="text-xs text-gray-400 mt-1">
                Desde: {formatTime(activeSession.openedAt)}
              </p>
            )}
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map(item => (
              <li key={item.path}>
                <button
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${
                    location.pathname === item.path
                      ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <i className={`${item.icon} text-xl`}></i>
                  <span className="font-medium text-sm">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-700 space-y-2">
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-700/50 rounded-lg">
            <div className="w-9 h-9 flex items-center justify-center bg-gradient-to-r from-brand-500 to-brand-600 rounded-full text-white font-bold text-sm shrink-0">
              {nameInitial}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{currentUser?.name ?? 'Usuario'}</p>
              <p className="text-xs text-gray-400">
                {currentUser?.roleId ? roleLabel[currentUser.roleId] : ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowChangePassword(true)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-gray-600/50 hover:text-white transition-all cursor-pointer whitespace-nowrap text-sm"
          >
            <i className="ri-lock-password-line text-lg"></i>
            <span className="font-medium">Cambiar contraseña</span>
          </button>
          <button
            onClick={() => setShowMFA(true)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-gray-600/50 hover:text-white transition-all cursor-pointer whitespace-nowrap text-sm"
          >
            <i className="ri-shield-keyhole-line text-lg"></i>
            <span className="font-medium">Autenticación MFA</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-red-500/20 hover:text-red-400 transition-all cursor-pointer whitespace-nowrap text-sm"
          >
            <i className="ri-logout-box-r-line text-lg"></i>
            <span className="font-medium">Cerrar sesión</span>
          </button>
          {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} />}
          {showMFA && <MFASetupModal onClose={() => setShowMFA(false)} />}
        </div>
      </div>
    </>
  );
}
