import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface NavbarProps {
  onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const roleLabel: Record<string, string> = {
    admin: 'Administrador',
    vendedor: 'Vendedor',
    cajero: 'Cajero'
  };

  return (
    <div className="md:hidden bg-white border-b border-gray-200 px-4 py-4 shadow-sm safe-top fixed top-0 left-0 right-0 z-40">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Botón hamburguesa para mobile */}
          <button
            onClick={onMenuClick}
            className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <i className="ri-menu-line text-2xl"></i>
          </button>

          {/* Logo y título para mobile */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-brand-400 to-brand-600 rounded-lg shadow">
              <i className={`${theme.storeIcon} text-white text-lg`}></i>
            </div>
            <h2 className="text-lg font-semibold text-gray-800">
              Sistema de Gestión
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
}