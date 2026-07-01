import { useState, useEffect } from 'react';
import {
  getProductBranches,
  setProductBranchAvailability,
  type ProductBranch,
} from '../../../services/products.service';

interface Props {
  productId: number;
  productName: string;
  onClose: () => void;
  onSaved: () => void;
}

export function ProductBranchesModal({ productId, productName, onClose, onSaved }: Props) {
  const [branches, setBranches] = useState<ProductBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    getProductBranches(productId)
      .then(r => setBranches(r.items))
      .catch(() => setBranches([]))
      .finally(() => setLoading(false));
  }, [productId]);

  const toggle = async (b: ProductBranch) => {
    const newValue = !b.isAvailable;
    setSaving(b.branchId);
    // Optimistic update
    setBranches(prev => prev.map(x => x.branchId === b.branchId ? { ...x, isAvailable: newValue } : x));
    try {
      await setProductBranchAvailability(productId, b.branchId, newValue);
      onSaved();
    } catch {
      // Rollback
      setBranches(prev => prev.map(x => x.branchId === b.branchId ? { ...x, isAvailable: b.isAvailable } : x));
      alert('Error al cambiar visibilidad');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-white w-full h-full md:h-auto md:rounded-2xl shadow-2xl md:max-w-md overflow-y-auto safe-top">
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="min-w-0 flex-1 mr-3">
            <h3 className="text-lg font-bold text-gray-800 truncate">Disponibilidad por sucursal</h3>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{productName}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 cursor-pointer shrink-0">
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        <div className="p-4 md:p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <i className="ri-loader-4-line animate-spin text-3xl text-brand-500"></i>
            </div>
          ) : branches.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-6">Sin sucursales activas</p>
          ) : (
            <div className="space-y-2">
              {branches.map(b => (
                <div key={b.branchId} className="flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <i className="ri-store-2-line text-brand-500 text-base shrink-0"></i>
                    <span className="font-semibold text-gray-800 truncate">{b.branchName}</span>
                  </div>
                  <button
                    onClick={() => toggle(b)}
                    disabled={saving === b.branchId}
                    className="relative inline-flex items-center cursor-pointer disabled:opacity-60"
                  >
                    <div className={`w-11 h-6 rounded-full transition-colors ${b.isAvailable ? 'bg-brand-500' : 'bg-gray-300'}`}>
                      <div className={`absolute top-[2px] bg-white rounded-full h-5 w-5 transition-all shadow-sm ${b.isAvailable ? 'left-[22px]' : 'left-[2px]'}`}></div>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-4">Quitar el toggle oculta el producto del POS y del listado en esa sucursal. El producto y su stock no se eliminan.</p>
        </div>

        <div className="p-4 md:p-6 border-t border-gray-100 bg-gray-50">
          <button onClick={onClose} className="w-full py-3 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm cursor-pointer min-h-[48px]">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
