import { useEffect, useState } from 'react';
import { X, Minus, Plus, ShoppingCart } from 'lucide-react';
import { getStoreProductDetail, type StoreProductDetail } from '../../services/publicStore.service';
import { useCart } from './cartStore';

function moneyAR(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n);
}

interface Props {
  slug: string;
  productId: number;
  primary: string;
  onClose: () => void;
  closed?: boolean;
  closedReason?: string;
}

export default function ProductQuickView({ slug, productId, primary, onClose, closed, closedReason }: Props) {
  const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/api$/, '');
  const { addItem } = useCart(slug);

  const [product, setProduct] = useState<StoreProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [variantId, setVariantId] = useState<number | null>(null);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getStoreProductDetail(slug, productId)
      .then((p) => {
        if (!alive) return;
        setProduct(p);
        if (p.variants.length === 1) setVariantId(p.variants[0].id);
      })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [slug, productId]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const img = product?.image_url
    ? (product.image_url.startsWith('http') ? product.image_url : `${apiBase}${product.image_url}`)
    : null;

  const selectedVariant = variantId && product ? product.variants.find((v) => v.id === variantId) : null;
  const price = Number(selectedVariant?.price ?? product?.price ?? 0);
  const stock = selectedVariant?.stock ?? product?.stock ?? 0;
  const hasVariants = (product?.variants.length ?? 0) > 0;
  const canAdd = stock > 0 && (!hasVariants || variantId);
  const total = price * qty;

  function handleAdd() {
    if (!canAdd || !product) return;
    addItem({
      product_id: product.id,
      variant_id: variantId,
      qty,
      unit_price: price,
      product_name: product.name + (selectedVariant?.name ? ` - ${selectedVariant.name}` : ''),
      image_url: product.image_url,
    });
    setAdding(true);
    setTimeout(() => { onClose(); }, 500);
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/90 shadow hover:bg-white"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>

        {loading ? (
          <div className="flex items-center justify-center h-80 text-gray-400">Cargando…</div>
        ) : !product ? (
          <div className="flex items-center justify-center h-80 text-gray-400">Producto no encontrado</div>
        ) : (
          <div className="flex flex-col max-h-[90vh]">
            <div className="bg-gray-100 shrink-0 h-56 md:h-64 flex items-center justify-center">
              {img ? (
                <img src={img} alt={product.name} className="max-h-full max-w-full object-contain" />
              ) : (
                <div className="text-gray-300 text-6xl">📦</div>
              )}
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              {product.category_name && <div className="text-xs text-gray-400 mb-1">{product.category_name}</div>}
              <h2 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h2>
              <div className="flex items-baseline gap-2 mb-3">
                <div className="text-2xl font-bold" style={{ color: primary }}>{moneyAR(price)}</div>
                <div className="text-sm text-gray-400">/ Unidad</div>
              </div>

              {product.description && (
                <p className="text-sm text-gray-600 whitespace-pre-line mb-4">{product.description}</p>
              )}

              {hasVariants && (
                <div className="mb-4">
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Variante</label>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => setVariantId(v.id)}
                        disabled={v.stock <= 0}
                        className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                          variantId === v.id ? 'text-white border-transparent' : 'bg-white border-gray-200 text-gray-700'
                        } ${v.stock <= 0 ? 'opacity-40 cursor-not-allowed line-through' : ''}`}
                        style={variantId === v.id ? { backgroundColor: primary } : {}}
                      >
                        {v.name || v.sku}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-2">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Cantidad</div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="font-bold text-lg w-10 text-center">{qty}</span>
                  <button
                    onClick={() => setQty(Math.min(stock, qty + 1))}
                    disabled={qty >= stock}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <span className="text-xs text-gray-400 ml-2">Stock: {stock}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-white">
              {closed ? (
                <div className="bg-gray-100 text-gray-500 text-center py-3 rounded-xl font-semibold">
                  {closedReason || 'Cerrado momentáneamente'}
                </div>
              ) : stock <= 0 ? (
                <div className="bg-gray-100 text-gray-500 text-center py-3 rounded-xl font-semibold">Sin stock</div>
              ) : (
                <button
                  onClick={handleAdd}
                  disabled={!canAdd || adding}
                  className="w-full py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ backgroundColor: primary }}
                >
                  <ShoppingCart className="h-5 w-5" />
                  <div className="flex flex-col items-center leading-tight">
                    <span>{adding ? '¡Agregado!' : hasVariants && !variantId ? 'Seleccioná una variante' : 'Agregar'}</span>
                    {canAdd && !adding && <span className="text-xs opacity-90">TOTAL {moneyAR(total)}</span>}
                  </div>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
