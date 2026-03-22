import { useState } from 'react';
import { AppLayout } from '../../components/feature/AppLayout';
import { useAuth } from '../../context/AuthContext';
import StockOverviewTab from './components/StockOverviewTab';
import MovementsTab from './components/MovementsTab';
import TransfersTab from './components/TransfersTab';
import InventoryTab from './components/InventoryTab';

type TabId = 'overview' | 'movements' | 'transfers' | 'inventory';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'overview', label: 'Stock Actual', icon: 'ri-stack-line' },
  { id: 'movements', label: 'Movimientos', icon: 'ri-arrow-up-down-line' },
  { id: 'transfers', label: 'Transferencias', icon: 'ri-truck-line' },
  { id: 'inventory', label: 'Inventario Físico', icon: 'ri-clipboard-check-line' },
];

export default function StockPage() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Stock</h1>
          <p className="text-sm text-gray-500 mt-1">Control de inventario, movimientos y transferencias</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex overflow-x-auto border-b border-gray-100 no-scrollbar">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap transition-colors cursor-pointer border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? 'border-brand-500 text-brand-600 bg-brand-50/40'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <i className={`${tab.icon} text-base`}></i>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div>
          {activeTab === 'overview' && <StockOverviewTab currentUser={currentUser} />}
          {activeTab === 'movements' && <MovementsTab currentUser={currentUser} />}
          {activeTab === 'transfers' && <TransfersTab currentUser={currentUser} />}
          {activeTab === 'inventory' && <InventoryTab currentUser={currentUser} />}
        </div>
      </div>
    </AppLayout>
  );
}
