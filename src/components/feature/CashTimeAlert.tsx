
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCash } from '../../context/CashContext';
import { getCashAlertLimitMinutes } from '../../hooks/useCashAlertLimit';

const DISMISS_KEY = 'cash_alert_dismissed_at';

export function CashTimeAlert() {
  const { hasCashOpen, activeSession: currentCashSession } = useCash();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [hoursOpen, setHoursOpen] = useState(0);
  const [minutesOpen, setMinutesOpen] = useState(0);
  const [limitLabel, setLimitLabel] = useState('8h');

  useEffect(() => {
    if (!hasCashOpen || !currentCashSession) {
      setVisible(false);
      return;
    }

    const check = () => {
      const limitMinutes = getCashAlertLimitMinutes();
      const lh = Math.floor(limitMinutes / 60);
      const lm = limitMinutes % 60;
      setLimitLabel(lm > 0 ? `${lh}h ${lm}m` : `${lh}h`);

      const openedAt = new Date(currentCashSession.openedAt).getTime();
      const now = Date.now();
      const diffMs = now - openedAt;
      const diffMinutes = diffMs / (1000 * 60);
      const hours = Math.floor(diffMinutes / 60);
      const minutes = Math.floor(diffMinutes % 60);

      setHoursOpen(hours);
      setMinutesOpen(minutes);

      if (diffMinutes >= limitMinutes) {
        const dismissedSession = localStorage.getItem('cash_alert_dismissed_session');
        if (dismissedSession === String(currentCashSession.id)) {
          setVisible(false);
          return;
        }
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    check();
    const interval = setInterval(check, 60 * 1000);
    return () => clearInterval(interval);
  }, [hasCashOpen, currentCashSession]);

  const handleDismiss = () => {
    if (currentCashSession) {
      localStorage.setItem(DISMISS_KEY, new Date().toISOString());
      localStorage.setItem('cash_alert_dismissed_session', String(currentCashSession.id));
    }
    setVisible(false);
  };

  const handleGoToCash = () => {
    handleDismiss();
    navigate('/cash');
  };

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex justify-center px-4 pt-3 pointer-events-none">
      <div
        className="pointer-events-auto w-full max-w-2xl bg-amber-50 border border-amber-300 rounded-xl shadow-lg px-4 py-3 flex items-start gap-3"
        style={{ animation: 'slideDown 0.4s ease-out' }}
      >
        <div className="w-9 h-9 flex items-center justify-center shrink-0 mt-0.5">
          <span className="relative flex h-9 w-9">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-50"></span>
            <span className="relative inline-flex rounded-full h-9 w-9 bg-amber-400 items-center justify-center">
              <i className="ri-alarm-warning-line text-white text-lg"></i>
            </span>
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-800">
            ¡La caja lleva más de {hoursOpen}h {minutesOpen}m abierta!
          </p>
          <p className="text-xs text-amber-700 mt-0.5">
            El límite configurado es de <strong>{limitLabel}</strong>. Se recomienda cerrar el turno actual y abrir uno nuevo.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleGoToCash}
            className="text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            Ir a Caja
          </button>
          <button
            onClick={handleDismiss}
            className="w-7 h-7 flex items-center justify-center text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
            title="Descartar alerta"
          >
            <i className="ri-close-line text-base"></i>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
