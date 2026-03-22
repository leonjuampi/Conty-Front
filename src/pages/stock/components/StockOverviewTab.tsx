import { useState, useEffect } from 'react';
import { getStockOverview, searchStockProducts, type StockOverview, type StockProduct } from '../../../services/stock.service';
import { listBranches, type Branch } from '../../../services/branches.service';
import { type CurrentUser } from '../../../context/AuthContext';

interface Props {
  currentUser: CurrentUser | null;
}

const LOW_STOCK_KEY = 'conty_low_stock_threshold';
function getLowStockThreshold(): number {
  const v = localStorage.getItem(LOW_STOCK_KEY);
  return v ? parseInt(v) : 5;
}

function stockStatus(qty: number, threshold: number): { label: string; cls: string } {
  if (qty === 0) return { label: 'Sin stock', cls: 'bg-red-100 text-red-700' };
  if (threshold > 0 && qty <= threshold) return { label: 'Stock bajo', cls: 'bg-brand-100 text-brand-700' };
  return { label: 'OK', cls: 'bg-green-100 text-green-700' };
}

export default function StockOverviewTab({ currentUser }: Props) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<number | undefined>(
    currentUser?.branchId ?? undefined
  );
  const [overview, setOverview] = useState<StockOverview | null>(null);
  const [products, setProducts] = useState<StockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lowStockThreshold = getLowStockThreshold();

  useEffect(() => {
    listBranches()
      .then(res => {
        setBranches(res.items);
        if (!selectedBranch && res.items.length === 1) {
          setSelectedBranch(res.items[0].id);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      getStockOverview({ branchId: selectedBranch }),
      searchStockProducts({ branchId: selectedBranch }),
    ])
      .then(([ov, prod]) => {
        setOverview(ov);
        setProducts(prod.items ?? []);
      })
      .catch(err => {
        setError(err?.response?.data?.message ?? 'Error al cargar datos');
      })
      .finally(() => setLoading(false));
  }, [selectedBranch]);

  return (
    <div className="space-y-6">
      {/* Branch selector */}
      {branches.length > 1 && (
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Sucursal:</label>
          <select
            value={selectedBranch ?? ''}
            onChange={e => setSelectedBranch(e.target.value ? Number(e.target.value) : undefined)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            <option value="">Todas</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      {loading ? (
        <div className="flex justify-center py-10">
          <i className="ri-loader-4-line animate-spin text-brand-500 text-3xl"></i>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center">
                <i className="ri-stack-line text-brand-500 text-2xl"></i>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Productos en Stock</p>
                <p className="text-2xl font-bold text-gray-800">{products.length}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                <i className="ri-alert-line text-yellow-500 text-2xl"></i>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Stock Bajo</p>
                <p className="text-2xl font-bold text-gray-800">
                  {lowStockThreshold > 0
                    ? products.filter(p => p.qty > 0 && p.qty <= lowStockThreshold).length
                    : overview?.lowStock ?? 0}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <i className="ri-time-line text-red-500 text-2xl"></i>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Sin Movimiento</p>
                <p className="text-2xl font-bold text-gray-800">{overview?.noMovement ?? 0}</p>
              </div>
            </div>
          </div>

          {/* Products table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Productos con Stock</h2>
            </div>
            {products.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <i className="ri-inbox-line text-4xl block mb-2"></i>
                <p className="text-sm">No hay productos para mostrar</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
                      <th className="px-4 py-3 text-left">Producto</th>
                      <th className="px-4 py-3 text-left">SKU</th>
                      <th className="px-4 py-3 text-right">Stock</th>
                      <th className="px-4 py-3 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {products.map(p => {
                      const status = stockStatus(p.qty, lowStockThreshold);
                      const displayName = p.variantName ? `${p.productName} — ${p.variantName}` : p.productName;
                      const displaySku = p.variantSku || p.productSku || '—';
                      return (
                        <tr key={p.variantId} className="hover:bg-brand-50/40 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-800">{displayName}</td>
                          <td className="px-4 py-3 text-gray-500 font-mono text-xs">{displaySku}</td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-700">{p.qty}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.cls}`}>
                              {status.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
