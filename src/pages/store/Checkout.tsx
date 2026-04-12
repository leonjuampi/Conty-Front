import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Store, Truck } from 'lucide-react';
import PublicStoreLayout from './PublicStoreLayout';
import { createStoreOrder, type StoreInfo } from '../../services/publicStore.service';
import { useCart } from './cartStore';
import { parseSchedule, isStoreOpenNow } from './scheduleUtils';

function moneyAR(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n);
}

function CheckoutInner({ info }: { info: StoreInfo }) {
  const { slug = '' } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const primary = info.settings?.primary_color || '#10b981';
  const { items, subtotal, clear } = useCart(slug);

  const pickupEnabled = (info.settings?.pickup_enabled ?? 1) === 1;
  const deliveryEnabled = (info.settings?.delivery_enabled ?? 1) === 1;
  const deliveryCost = Number(info.settings?.delivery_cost || 0);
  const deliveryZones = info.settings?.delivery_zones;
  const openState = isStoreOpenNow(parseSchedule(info.settings?.schedule_json));

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState<'PICKUP' | 'DELIVERY'>(pickupEnabled ? 'PICKUP' : 'DELIVERY');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const couponCode = searchParams.get('coupon') || undefined;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;
    if (!name.trim() || !phone.trim()) {
      setError('Completá nombre y teléfono');
      return;
    }
    if (type === 'DELIVERY' && !address.trim()) {
      setError('Ingresá la dirección de entrega');
      return;
    }
    if (!openState.open) {
      setError(openState.reason || 'La tienda está cerrada, no podemos tomar pedidos ahora.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const r = await createStoreOrder(slug, {
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        customer_email: email.trim() || undefined,
        delivery_type: type,
        delivery_address: type === 'DELIVERY' ? address.trim() : undefined,
        delivery_notes: notes.trim() || undefined,
        coupon_code: couponCode,
        items: items.map((i) => ({
          product_id: i.product_id,
          variant_id: i.variant_id ?? null,
          qty: i.qty,
          unit_price: i.unit_price,
          notes: i.notes,
        })),
      });
      window.open(r.whatsappLink, '_blank');
      clear();
      navigate(`/s/${slug}/pedido/${r.orderId}`, { state: { orderNumber: r.orderNumber, total: r.total, whatsappLink: r.whatsappLink } });
    } catch (e: any) {
      setError(e?.response?.data?.message || 'No pudimos procesar tu pedido. Intentá de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft className="h-4 w-4" /> Volver al carrito
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-4">Finalizá tu pedido</h1>

      <form onSubmit={submit} className="space-y-4">
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
          <h2 className="font-bold text-gray-900 mb-1">Tus datos</h2>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Nombre completo *</label>
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2"
              style={{ ['--tw-ring-color' as any]: primary }}
              required
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Teléfono / WhatsApp *</label>
            <input
              type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2"
              style={{ ['--tw-ring-color' as any]: primary }}
              required
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Email (opcional)</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2"
              style={{ ['--tw-ring-color' as any]: primary }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
          <h2 className="font-bold text-gray-900 mb-1">¿Cómo lo querés recibir?</h2>
          <div className="grid grid-cols-2 gap-2">
            {pickupEnabled && (
              <button
                type="button"
                onClick={() => setType('PICKUP')}
                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-colors ${
                  type === 'PICKUP' ? 'border-transparent text-white' : 'border-gray-200 bg-white text-gray-700'
                }`}
                style={type === 'PICKUP' ? { backgroundColor: primary } : {}}
              >
                <Store className="h-5 w-5" />
                <span className="font-semibold text-sm">Retiro en local</span>
              </button>
            )}
            {deliveryEnabled && (
              <button
                type="button"
                onClick={() => setType('DELIVERY')}
                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-colors ${
                  type === 'DELIVERY' ? 'border-transparent text-white' : 'border-gray-200 bg-white text-gray-700'
                }`}
                style={type === 'DELIVERY' ? { backgroundColor: primary } : {}}
              >
                <Truck className="h-5 w-5" />
                <span className="font-semibold text-sm">Envío a domicilio</span>
                <span className="text-xs opacity-90">{deliveryCost > 0 ? moneyAR(deliveryCost) : 'Gratis'}</span>
              </button>
            )}
          </div>

          {type === 'DELIVERY' && (
            <div className="space-y-2">
              {deliveryZones && (
                <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
                  <b>Zonas de entrega:</b> {deliveryZones}
                </div>
              )}
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Dirección de entrega *</label>
                <input
                  type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                  placeholder="Calle, número, piso, depto…"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2"
                  style={{ ['--tw-ring-color' as any]: primary }}
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-sm text-gray-600 mb-1 block">Notas (opcional)</label>
            <textarea
              value={notes} onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Ej: sin cebolla, timbre roto, etc."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2"
              style={{ ['--tw-ring-color' as any]: primary }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex justify-between text-gray-600 mb-1">
            <span>Productos ({items.length})</span><span>{moneyAR(subtotal)}</span>
          </div>
          {type === 'DELIVERY' && deliveryCost > 0 && (
            <div className="flex justify-between text-gray-600 mb-1">
              <span>Envío</span><span>{moneyAR(deliveryCost)}</span>
            </div>
          )}
          {couponCode && (
            <div className="text-sm text-green-600 mb-1">Cupón aplicado: {couponCode} (se calcula al confirmar)</div>
          )}
          <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2" style={{ color: primary }}>
            <span>Total estimado</span>
            <span>{moneyAR(subtotal + (type === 'DELIVERY' ? deliveryCost : 0))}</span>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm">{error}</div>}

        <button
          type="submit"
          disabled={submitting || items.length === 0 || !openState.open}
          className="w-full py-3 rounded-xl text-white font-bold disabled:opacity-50"
          style={{ backgroundColor: primary }}
        >
          {submitting ? 'Procesando…' : 'Confirmar pedido por WhatsApp'}
        </button>

        <p className="text-xs text-gray-400 text-center">
          Al confirmar se abrirá WhatsApp con tu pedido para finalizar con el vendedor.
        </p>
      </form>
    </div>
  );
}

export default function Checkout() {
  return <PublicStoreLayout>{(info) => <CheckoutInner info={info} />}</PublicStoreLayout>;
}
