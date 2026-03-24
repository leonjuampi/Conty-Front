
import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useCash } from '../../../context/CashContext';

export function OpenCashModal() {
  const { currentUser } = useAuth();
  const { openCash } = useCash();
  const [initialAmount, setInitialAmount] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleOpenCash = async () => {
    const amount = parseFloat(initialAmount);
    if (!initialAmount || isNaN(amount) || amount < 0) {
      setError('Por favor ingresá un monto válido');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await openCash(amount);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Error al abrir la caja');
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setInitialAmount(value);
    setError('');
  };

  const currentDate = new Date().toLocaleDateString('es-AR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const currentTime = new Date().toLocaleTimeString('es-AR', {
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-120px)] p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 md:p-8 border border-gray-100">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-brand-500 to-brand-600 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
            <i className="ri-safe-line text-3xl md:text-4xl text-white"></i>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Apertura de Caja</h1>
          <p className="text-gray-500 text-sm">Ingresá el monto inicial en efectivo para comenzar la jornada</p>
        </div>

        {/* Info */}
        <div className="bg-gradient-to-r from-brand-50 to-brand-100 rounded-xl p-4 mb-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Vendedor</span>
            <span className="font-semibold text-gray-800 text-sm md:text-base">{currentUser?.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Fecha</span>
            <span className="font-semibold text-gray-800 capitalize text-sm md:text-base">{currentDate}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Hora</span>
            <span className="font-semibold text-gray-800 text-sm md:text-base">{currentTime}</span>
          </div>
        </div>

        {/* Monto */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Monto Inicial en Efectivo
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-lg md:text-xl">$</span>
            <input
              type="text"
              value={initialAmount}
              onChange={handleAmountChange}
              placeholder="0.00"
              className="w-full pl-9 pr-4 py-4 md:py-5 border-2 border-gray-200 rounded-xl text-xl md:text-2xl font-bold text-gray-800 focus:outline-none focus:border-brand-500 transition-colors min-h-[56px]"
            />
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
              <i className="ri-error-warning-line"></i>
              {error}
            </p>
          )}
        </div>

        <button
          onClick={handleOpenCash}
          disabled={loading}
          className="w-full bg-gradient-to-r from-brand-500 to-brand-600 text-white py-4 md:py-5 rounded-xl font-bold text-base md:text-lg hover:from-brand-600 hover:to-brand-700 transition-all shadow-lg hover:shadow-xl whitespace-nowrap cursor-pointer flex items-center justify-center gap-2 min-h-[56px] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <><i className="ri-loader-4-line animate-spin text-xl"></i> Abriendo...</>
          ) : (
            <><i className="ri-lock-unlock-line text-xl"></i> Abrir Caja</>
          )}
        </button>

        <p className="mt-4 text-center text-xs text-gray-400">
          <i className="ri-information-line mr-1"></i>
          Debés abrir caja para poder registrar ventas
        </p>
      </div>
    </div>
  );
}
