
import { useEffect } from 'react';
import { AppLayout } from '../../components/feature/AppLayout';
import { OpenCashModal } from './components/OpenCashModal';
import { CloseCashModal } from './components/CloseCashModal';
import { useCash } from '../../context/CashContext';

export default function CashPage() {
  const { hasCashOpen, isLoadingSession, refreshSession } = useCash();

  useEffect(() => {
    refreshSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoadingSession) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <i className="ri-loader-4-line animate-spin text-4xl text-orange-500"></i>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        {!hasCashOpen ? <OpenCashModal /> : <CloseCashModal />}
      </div>
    </AppLayout>
  );
}
