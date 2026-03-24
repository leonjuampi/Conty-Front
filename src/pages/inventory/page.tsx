import { useState } from 'react';
import { AppLayout } from '../../components/feature/AppLayout';
import MercaderiaTab from './components/MercaderiaTab';
import { CostosTab } from '../mercaderia-costos/components/CostosTab';
import { TotalesTab } from '../mercaderia-costos/components/TotalesTab';

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<'mercaderia' | 'costos' | 'totales'>('mercaderia');

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Mercadería y Costos</h1>
        <p className="text-gray-600 mt-1">Gestión de insumos, preparaciones y precios finales</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('mercaderia')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'mercaderia'
                ? 'text-[#E8650A] border-b-2 border-[#E8650A] bg-brand-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <i className="ri-shopping-basket-line text-lg"></i>
              <span>Mercadería</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('costos')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'costos'
                ? 'text-[#E8650A] border-b-2 border-[#E8650A] bg-brand-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <i className="ri-calculator-line text-lg"></i>
              <span>Costos</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('totales')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'totales'
                ? 'text-[#E8650A] border-b-2 border-[#E8650A] bg-brand-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <i className="ri-money-dollar-circle-line text-lg"></i>
              <span>Totales</span>
            </div>
          </button>
        </div>
      </div>

      <div>
        {activeTab === 'mercaderia' && <MercaderiaTab />}
        {activeTab === 'costos' && <CostosTab />}
        {activeTab === 'totales' && <TotalesTab />}
      </div>
    </AppLayout>
  );
}