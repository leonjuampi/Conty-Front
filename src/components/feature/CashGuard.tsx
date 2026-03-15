
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCash } from '../../context/CashContext';
import { needsCashOpen } from '../../utils/roles';

interface CashGuardProps {
  children: React.ReactNode;
}

export function CashGuard({ children }: CashGuardProps) {
  const { currentUser } = useAuth();
  const { hasCashOpen } = useCash();
  const navigate = useNavigate();
  const location = useLocation();
  const [showAlert, setShowAlert] = useState(false);

  const requiresCash =
    currentUser !== null && needsCashOpen(currentUser.roleId);

  useEffect(() => {
    if (requiresCash && !hasCashOpen && location.pathname !== '/cash') {
      setShowAlert(true);
    } else {
      setShowAlert(false);
    }
  }, [requiresCash, hasCashOpen, location.pathname]);

  const handleGoToCash = () => {
    setShowAlert(false);
    navigate('/cash');
  };

  const handleDismiss = () => {
    setShowAlert(false);
  };

  return (
    <>
      {children}

      {showAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-fade-in">
            {/* Ícono */}
            <div className="flex justify-center mb-5">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                <i className="ri-safe-line text-4xl text-white"></i>
              </div>
            </div>

            {/* Título */}
            <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
              Caja no abierta
            </h2>
            <p className="text-gray-500 text-center text-sm mb-6 leading-relaxed">
              No tenés una caja abierta. Debés abrir caja antes de poder realizar ventas u operar en el sistema.
            </p>

            {/* Info del usuario */}
            <div className="bg-orange-50 rounded-xl p-4 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="ri-user-line text-white text-lg"></i>
              </div>
              <div>
                <p className="text-sm text-gray-500">Usuario</p>
                <p className="font-semibold text-gray-800">{currentUser?.name}</p>
              </div>
              <div className="ml-auto">
                <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full">
                  Caja cerrada
                </span>
              </div>
            </div>

            {/* Botones */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleGoToCash}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 rounded-xl font-bold text-base hover:from-orange-600 hover:to-red-700 transition-all shadow-md hover:shadow-lg whitespace-nowrap cursor-pointer flex items-center justify-center gap-2"
              >
                <i className="ri-lock-unlock-line text-lg"></i>
                Ir a abrir caja
              </button>
              <button
                onClick={handleDismiss}
                className="w-full bg-gray-100 text-gray-600 py-3 rounded-xl font-semibold text-base hover:bg-gray-200 transition-all whitespace-nowrap cursor-pointer"
              >
                Cerrar
              </button>
            </div>

            <p className="text-center text-xs text-gray-400 mt-4">
              <i className="ri-information-line mr-1"></i>
              Sin caja abierta no se pueden registrar ventas
            </p>
          </div>
        </div>
      )}
    </>
  );
}
