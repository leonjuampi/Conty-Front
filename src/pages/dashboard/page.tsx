import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../../components/feature/AppLayout';
import { StatCard } from './components/StatCard';
import { SalesChart } from './components/SalesChart';
import { RecentOrders } from './components/RecentOrders';
import { TopProducts } from './components/TopProducts';
import { StockAlerts } from './components/StockAlerts';
import { PlatformSummary } from './components/PlatformSummary';
import { useCash } from '../../context/CashContext';
import { useAuth } from '../../context/AuthContext';
import { getDashboard } from '../../services/dashboard.service';

interface ChartEntry { date: string; total: number }
interface AlertEntry { productName: string; variantName: string; branchName: string; stock: number; minStock: number }
interface RecentSaleEntry { id: number; doc_number: string; total_amount: number; created_at: string; status: string; customerName: string | null }
interface TopProductEntry { productName: string; quantity: number; total: number }
interface PlatformEntry { platform: string; salesCount: number; total: number }
interface DashData {
  kpis?: { totalSales?: number; salesCount?: number; averageTicket?: number; unitsSold?: number };
  chart?: ChartEntry[];
  alerts?: AlertEntry[];
  recentSales?: RecentSaleEntry[];
  topProducts?: TopProductEntry[];
  platformStats?: PlatformEntry[];
}

const LOW_STOCK_KEY = 'conty_low_stock_threshold';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { hasCashOpen, activeSession } = useCash();
  const { currentUser } = useAuth();
  const [dashData, setDashData] = useState<DashData | null>(null);

  const lowStockThreshold = (() => {
    const v = localStorage.getItem(LOW_STOCK_KEY);
    return v ? parseInt(v) : 5;
  })();

  useEffect(() => {
    getDashboard({ branchId: currentUser?.branchId ?? undefined, minQty: lowStockThreshold })
      .then(data => setDashData(data))
      .catch(() => setDashData(null));
  }, [currentUser?.branchId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  };

  const cashTotal = activeSession
    ? Object.values(activeSession.totalsPerMethod || {}).reduce((a, b) => a + b, 0)
    : 0;
  const cashEfectivo = activeSession?.totalsPerMethod?.['CASH'] || 0;
  const efectivoEnCaja = (activeSession?.initialCash || 0) + cashEfectivo;
  const kpis = dashData?.kpis;

  const clearAllStorage = () => {
    if (!confirm('¿Borrar todas las cookies y datos del navegador? Se cerrará la sesión.')) return;
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(';').forEach(c => {
      document.cookie = c.trim().split('=')[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
    });
    window.location.reload();
  };

  return (
    <AppLayout>
      <button
        onClick={clearAllStorage}
        title="Borrar cookies y datos del navegador"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gray-700 hover:bg-red-600 text-white text-xs px-3 py-2 rounded-full shadow-lg transition-colors cursor-pointer opacity-60 hover:opacity-100"
      >
        <i className="ri-delete-bin-line text-sm"></i>
        Borrar cookies
      </button>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">Resumen general del sistema</p>
        </div>
        <button
          onClick={() => navigate('/pos')}
          className="flex items-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-md transition-all whitespace-nowrap cursor-pointer shrink-0"
        >
          <i className="ri-store-2-line text-lg"></i>
          Punto de Venta
        </button>
      </div>

      {/* Estado de Caja */}
      <div className="mb-6">
        <div className={`p-4 rounded-xl border-2 ${hasCashOpen ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 flex items-center justify-center rounded-xl ${hasCashOpen ? 'bg-green-500' : 'bg-red-500'}`}>
                <i className="ri-safe-line text-white text-2xl"></i>
              </div>
              <div>
                <h3 className={`font-bold text-base md:text-lg ${hasCashOpen ? 'text-green-700' : 'text-red-700'}`}>
                  {hasCashOpen ? 'Caja Abierta' : 'Caja Cerrada'}
                </h3>
                {hasCashOpen && activeSession && (
                  <p className="text-sm text-gray-600">
                    Desde: {formatTime(activeSession.openedAt)} • Monto inicial: {formatCurrency(activeSession.initialCash)}
                  </p>
                )}
              </div>
            </div>
            {hasCashOpen && activeSession && (
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <div className="bg-white px-4 py-2 rounded-lg border border-green-200">
                  <p className="text-xs text-gray-600">Efectivo en caja</p>
                  <p className="text-lg font-bold text-gray-800">{formatCurrency(efectivoEnCaja)}</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-lg border border-green-200">
                  <p className="text-xs text-gray-600">Ventas del turno</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(cashTotal)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6">
        {[
          { title: 'Ventas del Mes', value: kpis?.totalSales != null ? formatCurrency(kpis.totalSales) : '—', icon: 'ri-money-dollar-circle-line', color: 'from-green-400 to-emerald-500' },
          { title: 'Pedidos Totales', value: kpis?.salesCount != null ? String(kpis.salesCount) : '—', icon: 'ri-shopping-cart-line', color: 'from-brand-400 to-brand-600' },
          { title: 'Ticket Promedio', value: kpis?.averageTicket != null ? formatCurrency(kpis.averageTicket) : '—', icon: 'ri-bar-chart-box-line', color: 'from-teal-400 to-cyan-500' },
          { title: 'Unidades Vendidas', value: kpis?.unitsSold != null ? String(kpis.unitsSold) : '—', icon: 'ri-shopping-bag-line', color: 'from-brand-400 to-brand-600' }
        ].map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Gráfico y Resumen */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
        <div className="lg:col-span-2">
          <SalesChart data={dashData?.chart ?? []} />
        </div>
        <div className="space-y-4 md:space-y-6">
          <TopProducts data={dashData?.topProducts ?? []} />
        </div>
      </div>

      {/* Sección inferior */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2">
          <RecentOrders data={dashData?.recentSales ?? []} />
        </div>
        <div className="space-y-4 md:space-y-6">
          <PlatformSummary data={dashData?.platformStats ?? []} />
          <StockAlerts data={dashData?.alerts ?? []} />
        </div>
      </div>
    </AppLayout>
  );
}
