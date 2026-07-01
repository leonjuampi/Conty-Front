import { useState, useEffect } from 'react';
import { AppLayout } from '../../components/feature/AppLayout';
import MercaderiaTab from './components/MercaderiaTab';
import { CostosTab } from '../mercaderia-costos/components/CostosTab';
import { TotalesTab } from '../mercaderia-costos/components/TotalesTab';
import { useAuth } from '../../context/AuthContext';
import { listBranches, type Branch } from '../../services/branches.service';

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<'mercaderia' | 'costos' | 'totales'>('mercaderia');
  const { currentUser } = useAuth();
  const [branchList, setBranchList] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(currentUser?.branchId ?? null);

  useEffect(() => {
    if ((currentUser?.branchIds?.length ?? 0) > 1) {
      listBranches({ status: 'ACTIVE' }).then(r => setBranchList(r.items)).catch(() => {});
    }
    setSelectedBranchId(currentUser?.branchId ?? null);
  }, [currentUser?.branchId, currentUser?.branchIds?.length]);

  const userBranches = branchList.filter(b => currentUser?.branchIds?.includes(b.id));
  const activeBranchName = branchList.find(b => b.id === selectedBranchId)?.name;
  const hasMultiple = (currentUser?.branchIds?.length ?? 0) > 1;

  return (
    <AppLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mercadería y Costos</h1>
          <p className="text-gray-600 mt-1">Gestión de insumos, preparaciones y precios finales</p>
        </div>

        {/* Selector de sucursal */}
        {selectedBranchId && (
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm self-start">
            <i className="ri-store-2-line text-brand-500 text-base shrink-0"></i>
            {hasMultiple ? (
              <select
                value={selectedBranchId}
                onChange={e => setSelectedBranchId(Number(e.target.value))}
                className="text-sm font-semibold text-gray-800 bg-transparent outline-none cursor-pointer"
              >
                {userBranches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            ) : (
              <span className="text-sm font-semibold text-gray-800">{activeBranchName ?? 'Sucursal'}</span>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200">
          {([
            { id: 'mercaderia', icon: 'ri-shopping-basket-line', label: 'Mercadería' },
            { id: 'costos',     icon: 'ri-calculator-line',       label: 'Costos' },
            { id: 'totales',    icon: 'ri-money-dollar-circle-line', label: 'Totales' },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-brand-500 border-b-2 border-brand-500 bg-brand-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <i className={`${tab.icon} text-lg`}></i>
                <span>{tab.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        {activeTab === 'mercaderia' && <MercaderiaTab branchId={selectedBranchId ?? undefined} />}
        {activeTab === 'costos'     && <CostosTab     branchId={selectedBranchId ?? undefined} />}
        {activeTab === 'totales'    && <TotalesTab    branchId={selectedBranchId ?? undefined} />}
      </div>
    </AppLayout>
  );
}
