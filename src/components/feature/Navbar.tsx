import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

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
    <div className="md:hidden bg-white border-b border-gray-200 px-4 py-4 shadow-sm safe-top">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Botón hamburguesa para mobile */}
          <button
            onClick={onMenuClick}
            className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <i className="ri-menu-line text-2xl"></i>
          </button>

          {/* Logo */}
          <img src="/LOGO-COLOR-COMPLETO.png" alt="Conty" className="h-8" />
        </div>
      </div>
    </div>
  );
}