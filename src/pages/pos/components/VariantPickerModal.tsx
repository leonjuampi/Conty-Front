import { useState, useEffect } from 'react';
import { getProductDetail } from '../../../services/products.service';

interface VariantOption {
  id: number;
  name: string | null;
  stock: number;
}

interface VariantPickerModalProps {
  productId: number;
  productName: string;
  productPrice: number;
  productImage: string | null;
  branchId?: number | null;
  onSelect: (variantId: number, variantName: string, stock: number) => void;
  onClose: () => void;
}

export function VariantPickerModal({
  productId,
  productName,
  productPrice,
  productImage,
  branchId,
  onSelect,
  onClose,
}: VariantPickerModalProps) {
  const [variants, setVariants] = useState<VariantOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    getProductDetail(productId, branchId ?? undefined)
      .then((data: any) => {
        // Filter out the "default" variant — only show named variants
        const allVariants: VariantOption[] = (data.variants || [])
          .filter((v: any) => !v.is_default)
          .map((v: any) => {
            const stockEntry = (data.stock || []).find((s: any) => s.variant_id === v.id);
            return {
              id: v.id,
              name: v.name,
              stock: stockEntry?.qty ?? 0,
            };
          });
        setVariants(allVariants);
      })
      .catch(() => setVariants([]))
      .finally(() => setLoading(false));
  }, [productId, branchId]);

  const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-5 pb-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-brand-500 uppercase tracking-wider">Seleccionar variante</p>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer w-8 h-8 flex items-center justify-center">
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>
          <div className="flex items-center gap-3">
            {productImage ? (
              <img src={productImage} alt={productName} className="w-12 h-12 rounded-lg object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                <i className="ri-store-2-line text-gray-400 text-xl"></i>
              </div>
            )}
            <div>
              <h3 className="text-base font-bold text-gray-900">{productName}</h3>
              <div className="flex items-center gap-2">
                <span className="text-brand-600 font-bold">${productPrice.toLocaleString('es-AR')}</span>
                <span className="text-xs text-gray-400">
                  <i className="ri-archive-line mr-0.5"></i>
                  {totalStock} en total
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Variants list */}
        <div className="px-5 pb-2 max-h-64 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <i className="ri-loader-4-line animate-spin text-2xl text-gray-400"></i>
            </div>
          ) : variants.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500">No hay variantes disponibles</p>
            </div>
          ) : (
            <div className="space-y-2">
              {variants.map(v => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelected(v.id)}
                  disabled={v.stock === 0}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all cursor-pointer text-left ${
                    selected === v.id
                      ? 'border-brand-500 bg-brand-50'
                      : v.stock === 0
                        ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                        : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    selected === v.id ? 'border-brand-500' : 'border-gray-300'
                  }`}>
                    {selected === v.id && <div className="w-2.5 h-2.5 rounded-full bg-brand-500" />}
                  </div>
                  <span className="flex-1 text-sm font-medium text-gray-800">{v.name || 'Sin nombre'}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    v.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                  }`}>
                    {v.stock}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Confirm button */}
        <div className="p-5 pt-3">
          <button
            type="button"
            onClick={() => {
              const v = variants.find(x => x.id === selected);
              if (v) onSelect(v.id, v.name || '', v.stock);
            }}
            disabled={!selected}
            className="w-full py-3 bg-brand-500 text-white rounded-xl font-semibold text-sm hover:bg-brand-600 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Selecciona una variante
          </button>
        </div>
      </div>
    </div>
  );
}
