import { useState } from 'react';
import { AppLayout } from '../../components/feature/AppLayout';
import TiendaOnlineConfig from './components/TiendaOnlineConfig';
import TiendaOnlineCatalog from './components/TiendaOnlineCatalog';
import TiendaOnlineCoupons from './components/TiendaOnlineCoupons';
import TiendaOnlineOrders from './components/TiendaOnlineOrders';
import TiendaOnlineReports from './components/TiendaOnlineReports';
import DashboardStats from './components/DashboardStats';

type Tab = 'config' | 'catalog' | 'coupons' | 'orders' | 'reports';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'config',  label: 'Configuración', icon: 'ri-settings-3-line' },
  { id: 'catalog', label: 'Catálogo',      icon: 'ri-shopping-bag-line' },
  { id: 'coupons', label: 'Cupones',       icon: 'ri-coupon-3-line' },
  { id: 'orders',  label: 'Pedidos',       icon: 'ri-inbox-archive-line' },
  { id: 'reports', label: 'Reportes',      icon: 'ri-bar-chart-2-line' },
];

export default function TiendaOnlinePage() {
  const [tab, setTab] = useState<Tab>('config');

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Tienda Online</h1>
          <p className="text-gray-500 text-sm">Administrá tu tienda, productos, cupones y pedidos online.</p>
        </div>

        <DashboardStats />

        <div className="flex gap-2 overflow-x-auto border-b border-gray-200 mb-6">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-3 font-semibold text-sm whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${
                tab === t.id
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <i className={t.icon}></i>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'config'  && <TiendaOnlineConfig />}
        {tab === 'catalog' && <TiendaOnlineCatalog />}
        {tab === 'coupons' && <TiendaOnlineCoupons />}
        {tab === 'orders'  && <TiendaOnlineOrders />}
        {tab === 'reports' && <TiendaOnlineReports />}
      </div>
    </AppLayout>
  );
}
