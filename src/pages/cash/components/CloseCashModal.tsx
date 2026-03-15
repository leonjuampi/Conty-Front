
import { useState, useEffect } from 'react';
import { useCash } from '../../../context/CashContext';

interface PaymentRow {
  key: string;
  label: string;
  icon: string;
  expected: number;
}

export function CloseCashModal() {
  const { activeSession, closeCash } = useCash();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totals = activeSession?.totalsPerMethod || {};
  const initialCash = activeSession?.initialCash || 0;

  const getExpected = (key: string): number => {
    const salesTotal = totals[key] || 0;
    if (key === 'CASH') return initialCash + salesTotal;
    return salesTotal;
  };

  const paymentRows: PaymentRow[] = Object.keys(totals).length > 0
    ? Object.keys(totals).map(key => ({
        key,
        label: key === 'CASH' ? 'Efectivo'
          : key === 'CREDIT_CARD' ? 'Tarjeta de Crédito'
          : key === 'BANK_TRANSFER' ? 'Transferencia'
          : key === 'MERCADO_PAGO' ? 'Mercado Pago'
          : key,
        icon: key === 'CASH' ? 'ri-cash-line'
          : key === 'CREDIT_CARD' ? 'ri-bank-card-line'
          : key === 'BANK_TRANSFER' ? 'ri-bank-line'
          : key === 'MERCADO_PAGO' ? 'ri-smartphone-line'
          : 'ri-wallet-line',
        expected: getExpected(key),
      }))
    : [{ key: 'CASH', label: 'Efectivo', icon: 'ri-cash-line', expected: initialCash }];

  const [actualAmounts, setActualAmounts] = useState<Record<string, string>>(() =>
    Object.fromEntries(paymentRows.map(r => [r.key, r.expected.toFixed(2)]))
  );
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(paymentRows.map(r => [r.key, false]))
  );

  const paymentMethodKeys = paymentRows.map(r => r.key).sort().join(',');

  useEffect(() => {
    setActualAmounts(Object.fromEntries(paymentRows.map(r => [r.key, r.expected.toFixed(2)])));
    setConfirmed(Object.fromEntries(paymentRows.map(r => [r.key, false])));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSession?.id, paymentMethodKeys]);

  const handleAmountChange = (key: string, value: string) => {
    setActualAmounts(prev => ({ ...prev, [key]: value.replace(/[^0-9.]/g, '') }));
    setConfirmed(prev => ({ ...prev, [key]: false }));
  };

  const allConfirmed = paymentRows.every(r => confirmed[r.key]);

  const handleCloseCash = async () => {
    const actualJson: Record<string, number> = {};
    for (const row of paymentRows) {
      actualJson[row.key] = parseFloat(actualAmounts[row.key]) || 0;
    }
    setLoading(true);
    setError('');
    try {
      await closeCash(actualJson);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Error al cerrar la caja');
    } finally {
      setLoading(false);
    }
  };

  const getOpenDuration = () => {
    if (!activeSession?.openedAt) return '';
    const diff = Date.now() - new Date(activeSession.openedAt).getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="mb-4 md:mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Cierre de Caja</h1>
        <p className="text-sm md:text-base text-gray-600">Verifica los montos y confirma el cierre de tu jornada</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 md:p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-green-100">Efectivo Inicial</span>
            <i className="ri-safe-line text-2xl text-green-200"></i>
          </div>
          <p className="text-2xl md:text-3xl font-bold">
            ${initialCash.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-5 md:p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-red-100">Hora de Apertura</span>
            <i className="ri-time-line text-2xl text-red-200"></i>
          </div>
          <p className="text-xl md:text-2xl font-bold">
            {activeSession?.openedAt
              ? new Date(activeSession.openedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
              : '-'}
          </p>
          <p className="text-xs text-red-100 mt-1">Tiempo transcurrido: {getOpenDuration()}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 md:p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-orange-100">Total de Ventas</span>
            <i className="ri-money-dollar-circle-line text-2xl text-orange-200"></i>
          </div>
          <p className="text-2xl md:text-3xl font-bold">
            ${(activeSession?.totalSales || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
          <i className="ri-error-warning-line"></i>
          {error}
        </div>
      )}

      <div className="space-y-4 mb-4 md:mb-6">
        <h2 className="text-lg md:text-xl font-bold text-gray-800 flex items-center">
          <i className="ri-bank-card-line mr-2 text-orange-600"></i>
          Verificación de Montos por Método de Pago
        </h2>

        {paymentRows.map(row => {
          const actual = parseFloat(actualAmounts[row.key]) || 0;
          const difference = actual - row.expected;
          const isConfirmed = confirmed[row.key];

          return (
            <div key={row.key} className="bg-white rounded-xl p-4 md:p-6 border-2 border-gray-100 hover:border-orange-200 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center mr-3">
                    <i className={`${row.icon} text-xl text-white`}></i>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm md:text-base">{row.label}</h3>
                    <p className="text-xs text-gray-500">Monto esperado</p>
                  </div>
                </div>
                <p className="text-xl md:text-2xl font-bold text-gray-800">
                  ${row.expected.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Monto Real</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">$</span>
                    <input
                      type="text"
                      value={actualAmounts[row.key]}
                      onChange={(e) => handleAmountChange(row.key, e.target.value)}
                      disabled={isConfirmed}
                      className={`w-full pl-8 pr-4 py-3 md:py-4 border-2 rounded-lg text-base font-bold focus:outline-none transition-colors min-h-[52px] ${
                        isConfirmed ? 'bg-gray-50 border-gray-200 text-gray-500' : 'border-gray-200 focus:border-orange-500 text-gray-800'
                      }`}
                    />
                  </div>
                </div>
                <button
                  onClick={() => setConfirmed(prev => ({ ...prev, [row.key]: true }))}
                  disabled={isConfirmed}
                  className={`px-4 md:px-6 py-3 md:py-4 rounded-lg font-bold whitespace-nowrap transition-all text-sm min-h-[52px] ${
                    isConfirmed
                      ? 'bg-green-500 text-white cursor-default'
                      : 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700 cursor-pointer'
                  }`}
                >
                  {isConfirmed ? <><i className="ri-check-line mr-1"></i>Confirmado</> : 'Confirmar'}
                </button>
              </div>

              {isConfirmed && difference !== 0 && (
                <div className={`mt-3 p-3 rounded-lg flex items-center ${difference > 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <i className={`${difference > 0 ? 'ri-arrow-up-line text-green-600' : 'ri-arrow-down-line text-red-600'} text-xl mr-2`}></i>
                  <span className={`font-semibold text-sm ${difference > 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {difference > 0 ? 'Sobrante' : 'Faltante'}: ${Math.abs(difference).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl p-4 md:p-6 border-2 border-gray-200">
        <button
          onClick={handleCloseCash}
          disabled={!allConfirmed || loading}
          className={`w-full py-4 md:py-5 rounded-xl font-bold text-base md:text-lg whitespace-nowrap transition-all min-h-[56px] ${
            allConfirmed && !loading
              ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700 shadow-lg cursor-pointer'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <><i className="ri-loader-4-line animate-spin mr-2"></i>Cerrando caja...</>
          ) : allConfirmed ? (
            <><i className="ri-lock-line mr-2"></i>Cerrar Caja</>
          ) : (
            'Confirma todos los montos para cerrar'
          )}
        </button>
        {!allConfirmed && (
          <p className="text-center text-xs text-gray-500 mt-3">
            <i className="ri-information-line mr-1"></i>
            Debes confirmar todos los métodos de pago antes de cerrar la caja
          </p>
        )}
      </div>
    </div>
  );
}
