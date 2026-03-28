
import { useState, useEffect } from 'react';
import { useCash } from '../../../context/CashContext';
import { createCashMovement, type CashMovement } from '../../../services/cash.service';

interface PaymentRow {
  key: string;
  label: string;
  icon: string;
  expected: number;
}

export function CloseCashModal() {
  const { activeSession, closeCash, refreshSession } = useCash();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Movements
  const [movements, setMovements] = useState<CashMovement[]>(activeSession?.movements ?? []);
  const [showMovementForm, setShowMovementForm] = useState(false);
  const [movType, setMovType] = useState<'INGRESO' | 'RETIRO'>('RETIRO');
  const [movAmount, setMovAmount] = useState('');
  const [movDesc, setMovDesc] = useState('');
  const [savingMov, setSavingMov] = useState(false);
  const [movError, setMovError] = useState('');

  useEffect(() => {
    setMovements(activeSession?.movements ?? []);
  }, [activeSession?.id]);

  const netMovements = movements.reduce(
    (sum, m) => (m.type === 'INGRESO' ? sum + m.amount : sum - m.amount),
    0
  );

  const totals = activeSession?.totalsPerMethod || {};
  const initialCash = activeSession?.initialCash || 0;

  const getExpected = (key: string): number => {
    const salesTotal = totals[key] || 0;
    if (key === 'CASH') return initialCash + salesTotal + netMovements;
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
    : [{ key: 'CASH', label: 'Efectivo', icon: 'ri-cash-line', expected: getExpected('CASH') }];

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
  }, [activeSession?.id, paymentMethodKeys, netMovements]);

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

  const handleSaveMovement = async () => {
    const amt = parseFloat(movAmount);
    if (!movAmount || isNaN(amt) || amt <= 0) {
      setMovError('Ingresá un monto válido');
      return;
    }
    if (!activeSession) return;
    setSavingMov(true);
    setMovError('');
    try {
      await createCashMovement(activeSession.id, movType, amt, movDesc.trim() || undefined);
      await refreshSession();
      setShowMovementForm(false);
      setMovAmount('');
      setMovDesc('');
    } catch {
      setMovError('Error al registrar el movimiento');
    } finally {
      setSavingMov(false);
    }
  };

  const handleCancelMovement = () => {
    setShowMovementForm(false);
    setMovAmount('');
    setMovDesc('');
    setMovError('');
  };

  const getOpenDuration = () => {
    if (!activeSession?.openedAt) return '';
    const diff = Date.now() - new Date(activeSession.openedAt).getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  const fmt = (n: number) => n.toLocaleString('es-AR', { minimumFractionDigits: 2 });
  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

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
          <p className="text-2xl md:text-3xl font-bold">${fmt(initialCash)}</p>
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

        <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl p-5 md:p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-brand-100">Total de Ventas</span>
            <i className="ri-money-dollar-circle-line text-2xl text-brand-200"></i>
          </div>
          <p className="text-2xl md:text-3xl font-bold">
            ${fmt(activeSession?.totalSales || 0)}
          </p>
        </div>
      </div>

      {/* Movimientos de caja */}
      <div className="bg-white rounded-xl border-2 border-gray-100 mb-4 md:mb-6">
        <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <i className="ri-swap-line text-brand-600"></i>
            Movimientos de Caja
            {movements.length > 0 && (
              <span className="text-sm font-normal text-gray-500">
                ({movements.length})
              </span>
            )}
          </h2>
          {!showMovementForm && (
            <div className="flex gap-2">
              <button
                onClick={() => { setMovType('INGRESO'); setShowMovementForm(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors cursor-pointer"
              >
                <i className="ri-arrow-down-line"></i>
                Ingreso
              </button>
              <button
                onClick={() => { setMovType('RETIRO'); setShowMovementForm(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors cursor-pointer"
              >
                <i className="ri-arrow-up-line"></i>
                Retiro
              </button>
            </div>
          )}
        </div>

        {showMovementForm && (
          <div className="px-4 md:px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => setMovType('INGRESO')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                  movType === 'INGRESO'
                    ? 'bg-green-500 text-white'
                    : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <i className="ri-arrow-down-line"></i>
                Ingreso
              </button>
              <button
                onClick={() => setMovType('RETIRO')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                  movType === 'RETIRO'
                    ? 'bg-red-500 text-white'
                    : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <i className="ri-arrow-up-line"></i>
                Retiro
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative w-36 shrink-0">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={movAmount}
                  onChange={e => setMovAmount(e.target.value)}
                  placeholder="0"
                  autoFocus
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <input
                type="text"
                value={movDesc}
                onChange={e => setMovDesc(e.target.value)}
                placeholder="Descripción (opcional)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                onClick={handleSaveMovement}
                disabled={savingMov}
                className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-semibold hover:bg-brand-600 transition-colors disabled:opacity-60 cursor-pointer whitespace-nowrap"
              >
                {savingMov ? <i className="ri-loader-4-line animate-spin"></i> : 'Guardar'}
              </button>
              <button
                onClick={handleCancelMovement}
                className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
            {movError && <p className="text-xs text-red-600 mt-2">{movError}</p>}
          </div>
        )}

        {movements.length === 0 ? (
          <p className="px-4 md:px-6 py-4 text-sm text-gray-400 italic">
            Sin movimientos registrados en esta sesión.
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {movements.map(m => (
              <div key={m.id} className="flex items-center justify-between px-4 md:px-6 py-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    m.type === 'INGRESO' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <i className={`text-sm ${
                      m.type === 'INGRESO'
                        ? 'ri-arrow-down-line text-green-600'
                        : 'ri-arrow-up-line text-red-600'
                    }`}></i>
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${m.type === 'INGRESO' ? 'text-green-700' : 'text-red-700'}`}>
                      {m.type === 'INGRESO' ? 'Ingreso' : 'Retiro'}
                    </p>
                    {m.description && (
                      <p className="text-xs text-gray-500">{m.description}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${m.type === 'INGRESO' ? 'text-green-700' : 'text-red-700'}`}>
                    {m.type === 'INGRESO' ? '+' : '-'}${fmt(m.amount)}
                  </p>
                  <p className="text-xs text-gray-400">{fmtTime(m.createdAt)}</p>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between px-4 md:px-6 py-3 bg-gray-50">
              <span className="text-sm font-semibold text-gray-600">Neto movimientos</span>
              <span className={`text-sm font-bold ${netMovements >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {netMovements >= 0 ? '+' : ''}${fmt(netMovements)}
              </span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
          <i className="ri-error-warning-line"></i>
          {error}
        </div>
      )}

      <div className="space-y-4 mb-4 md:mb-6">
        <h2 className="text-lg md:text-xl font-bold text-gray-800 flex items-center">
          <i className="ri-bank-card-line mr-2 text-brand-600"></i>
          Verificación de Montos por Método de Pago
        </h2>

        {paymentRows.map(row => {
          const actual = parseFloat(actualAmounts[row.key]) || 0;
          const difference = actual - row.expected;
          const isConfirmed = confirmed[row.key];

          return (
            <div key={row.key} className="bg-white rounded-xl p-4 md:p-6 border-2 border-gray-100 hover:border-brand-200 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-600 rounded-lg flex items-center justify-center mr-3">
                    <i className={`${row.icon} text-xl text-white`}></i>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm md:text-base">{row.label}</h3>
                    <p className="text-xs text-gray-500">Monto esperado</p>
                  </div>
                </div>
                <p className="text-xl md:text-2xl font-bold text-gray-800">
                  ${fmt(row.expected)}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {row.key === 'CASH' ? 'Monto Real + Efectivo Inicial incluido' : 'Monto Real'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">$</span>
                    <input
                      type="text"
                      value={actualAmounts[row.key]}
                      onChange={(e) => handleAmountChange(row.key, e.target.value)}
                      disabled={isConfirmed}
                      className={`w-full pl-8 pr-4 py-3 md:py-4 border-2 rounded-lg text-base font-bold focus:outline-none transition-colors min-h-[52px] ${
                        isConfirmed ? 'bg-gray-50 border-gray-200 text-gray-500' : 'border-gray-200 focus:border-brand-500 text-gray-800'
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
                      : 'bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:from-brand-600 hover:to-brand-700 cursor-pointer'
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
              ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:from-brand-600 hover:to-brand-700 shadow-lg cursor-pointer'
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
