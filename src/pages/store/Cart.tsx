import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, Trash2, Tag } from 'lucide-react';
import PublicStoreLayout from './PublicStoreLayout';
import { validateStoreCoupon, type StoreInfo } from '../../services/publicStore.service';
import { useCart } from './cartStore';

function moneyAR(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n);
}

function CartInner({ info }: { info: StoreInfo }) {
  const { slug = '' } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const primary = info.settings?.primary_color || '#10b981';
  const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/api$/, '');
  const minOrder = Number(info.settings?.min_order_amount || 0);

  const { items, updateQty, removeItem, subtotal } = useCart(slug);

  const [coupon, setCoupon] = useState('');
  const [couponResult, setCouponResult] = useState<{ valid: boolean; discount?: number; code?: string; error?: string } | null>(null);
  const [validating, setValidating] = useState(false);

  async function applyCoupon() {
    if (!coupon.trim()) return;
    setValidating(true);
    const r = await validateStoreCoupon(slug, coupon.trim(), subtotal);
    setCouponResult(
      r.valid
        ? { valid: true, discount: r.discount, code: r.coupon?.code }
        : { valid: false, error: r.error || 'Cupón inválido' },
    );
    setValidating(false);
  }

  const discount = couponResult?.valid ? (couponResult.discount || 0) : 0;
  const total = Math.max(0, subtotal - discount);
  const belowMin = minOrder > 0 && subtotal < minOrder;

  function goCheckout() {
    if (items.length === 0 || belowMin) return;
    const params = new URLSearchParams();
    if (couponResult?.valid && couponResult.code) params.set('coupon', couponResult.code);
    navigate(`/s/${slug}/checkout${params.toString() ? `?${params.toString()}` : ''}`);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft className="h-4 w-4" /> Seguir comprando
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-4">Tu carrito</h1>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <div className="text-5xl mb-3">🛒</div>
          <p className="text-gray-500 mb-4">Todavía no agregaste productos.</p>
          <Link
            to={`/s/${slug}`}
            className="inline-block px-5 py-2 rounded-lg text-white font-semibold"
            style={{ backgroundColor: primary }}
          >
            Ver catálogo
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100 mb-4">
            {items.map((item, idx) => {
              const img = item.image_url
                ? (item.image_url.startsWith('http') ? item.image_url : `${apiBase}${item.image_url}`)
                : null;
              return (
                <div key={`${item.product_id}-${item.variant_id ?? 'base'}-${idx}`} className="p-4 flex gap-3 items-center">
                  <div className="h-16 w-16 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                    {img ? <img src={img} alt={item.product_name} className="w-full h-full object-cover" /> : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm line-clamp-2">{item.product_name}</div>
                    <div className="text-sm text-gray-500">{moneyAR(item.unit_price)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(idx, item.qty - 1)} className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="font-semibold w-6 text-center">{item.qty}</span>
                    <button onClick={() => updateQty(idx, item.qty + 1)} className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="font-bold text-gray-900 w-24 text-right">{moneyAR(item.qty * item.unit_price)}</div>
                  <button onClick={() => removeItem(idx)} className="p-2 text-gray-400 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Tag className="h-4 w-4" /> Cupón de descuento
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                placeholder="Ingresá tu código"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2"
                style={{ ['--tw-ring-color' as any]: primary }}
              />
              <button
                onClick={applyCoupon}
                disabled={validating || !coupon.trim()}
                className="px-4 py-2 rounded-lg text-white font-semibold disabled:opacity-50"
                style={{ backgroundColor: primary }}
              >
                {validating ? '…' : 'Aplicar'}
              </button>
            </div>
            {couponResult && (
              <div className={`text-sm mt-2 ${couponResult.valid ? 'text-green-600' : 'text-red-500'}`}>
                {couponResult.valid
                  ? `✓ Cupón ${couponResult.code} aplicado: -${moneyAR(couponResult.discount || 0)}`
                  : `✗ ${couponResult.error}`}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-4">
            <div className="flex justify-between text-gray-600 mb-1">
              <span>Subtotal</span><span>{moneyAR(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600 mb-1">
                <span>Descuento</span><span>-{moneyAR(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t">
              <span>Total</span><span>{moneyAR(total)}</span>
            </div>

            {belowMin && (
              <div className="text-sm text-amber-600 mt-3">
                El monto mínimo de pedido es {moneyAR(minOrder)}.
              </div>
            )}

            <button
              onClick={goCheckout}
              disabled={belowMin}
              className="w-full mt-4 py-3 rounded-xl text-white font-bold disabled:opacity-50"
              style={{ backgroundColor: primary }}
            >
              Continuar con el pedido
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function Cart() {
  return <PublicStoreLayout>{(info) => <CartInner info={info} />}</PublicStoreLayout>;
}
