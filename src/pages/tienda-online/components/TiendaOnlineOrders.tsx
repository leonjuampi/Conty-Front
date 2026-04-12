import { useEffect, useState } from 'react';
import { X, MessageCircle, ChevronRight, History, LayoutGrid, CreditCard } from 'lucide-react';
import {
  listOnlineOrders,
  getOnlineOrder,
  patchOnlineOrderStatus,
  confirmOnlineOrder,
  type OnlineOrder,
  type OnlineOrderStatus,
} from '../../../services/store.service';
import { listPaymentMethods, type PaymentMethod } from '../../../services/paymentMethods.service';

const COLUMNS: { id: OnlineOrderStatus; label: string; color: string }[] = [
  { id: 'PRE_CONFIRMED',    label: 'Por confirmar',   color: 'bg-yellow-100 text-yellow-700' },
  { id: 'RECEIVED',         label: 'En cola',         color: 'bg-blue-100 text-blue-700' },
  { id: 'PREPARING',        label: 'En preparación',  color: 'bg-purple-100 text-purple-700' },
  { id: 'READY_TO_DELIVER', label: 'Para entregar',   color: 'bg-orange-100 text-orange-700' },
];

const NEXT: Partial<Record<OnlineOrderStatus, OnlineOrderStatus>> = {
  PRE_CONFIRMED:    'RECEIVED',
  RECEIVED:         'PREPARING',
  PREPARING:        'READY_TO_DELIVER',
  READY_TO_DELIVER: 'DELIVERED',
};

const STATUS_LABELS: Record<OnlineOrderStatus, string> = {
  PRE_CONFIRMED: 'Por confirmar',
  RECEIVED: 'En cola',
  PREPARING: 'En preparación',
  READY_TO_DELIVER: 'Para entregar',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

function moneyAR(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n);
}

function prettyPmName(raw: string) {
  if (!raw) return raw;
  const looksTechnical = /^[A-Z0-9_]+$/.test(raw);
  if (!looksTechnical) return raw;
  return raw.toLowerCase().split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export default function TiendaOnlineOrders() {
  const [view, setView] = useState<'kanban' | 'history'>('kanban');
  const [orders, setOrders] = useState<OnlineOrder[]>([]);
  const [history, setHistory] = useState<OnlineOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<OnlineOrder | null>(null);
  const [updating, setUpdating] = useState(false);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [hoverCol, setHoverCol] = useState<OnlineOrderStatus | null>(null);
  const [cobroOrder, setCobroOrder] = useState<OnlineOrder | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPm, setSelectedPm] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [cobroError, setCobroError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [active, hist] = await Promise.all([
        listOnlineOrders({ scope: 'active' }),
        listOnlineOrders({ scope: 'history' }),
      ]);
      setOrders(active);
      setHistory(hist);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    listPaymentMethods()
      .then((r) => setPaymentMethods(r.items.filter((p) => p.active)))
      .catch(() => setPaymentMethods([]));
  }, []);

  async function openDetail(o: OnlineOrder) {
    const full = await getOnlineOrder(o.id);
    setDetail(full);
  }

  function openCobro(o: OnlineOrder) {
    setCobroOrder(o);
    setSelectedPm(paymentMethods[0]?.id ?? null);
    setCobroError(null);
  }

  async function runConfirm() {
    if (!cobroOrder || !selectedPm) return;
    setConfirming(true); setCobroError(null);
    try {
      const r = await confirmOnlineOrder(cobroOrder.id, selectedPm);
      setOrders((arr) => {
        const exists = arr.some((x) => x.id === r.id);
        return exists ? arr.map((x) => x.id === r.id ? { ...x, ...r } : x) : [r, ...arr];
      });
      if (detail?.id === r.id) setDetail({ ...detail, ...r });
      setCobroOrder(null);
    } catch (e: any) {
      setCobroError(e?.response?.data?.message || 'No se pudo confirmar el pedido');
    } finally {
      setConfirming(false);
    }
  }

  async function advance(o: OnlineOrder) {
    if (o.status === 'PRE_CONFIRMED') { openCobro(o); return; }
    const next = NEXT[o.status];
    if (!next) return;
    setUpdating(true);
    try {
      const r = await patchOnlineOrderStatus(o.id, next);
      applyOrderUpdate(r);
      if (detail?.id === o.id) setDetail({ ...detail, status: r.status });
    } finally {
      setUpdating(false);
    }
  }

  function applyOrderUpdate(r: OnlineOrder) {
    const terminal = r.status === 'DELIVERED' || r.status === 'CANCELLED';
    setOrders((arr) => terminal ? arr.filter((x) => x.id !== r.id) : arr.map((x) => x.id === r.id ? { ...x, ...r } : x));
    if (terminal) setHistory((arr) => [r, ...arr.filter((x) => x.id !== r.id)]);
  }

  async function moveTo(orderId: number, target: OnlineOrderStatus) {
    const current = orders.find((o) => o.id === orderId);
    if (!current || current.status === target) return;
    if (current.status === 'PRE_CONFIRMED' && target !== 'PRE_CONFIRMED') {
      openCobro(current);
      return;
    }
    const prev = current.status;
    setOrders((arr) => arr.map((x) => x.id === orderId ? { ...x, status: target } : x));
    try {
      const r = await patchOnlineOrderStatus(orderId, target);
      applyOrderUpdate(r);
    } catch {
      setOrders((arr) => arr.map((x) => x.id === orderId ? { ...x, status: prev } : x));
    }
  }

  async function cancel(o: OnlineOrder) {
    if (!confirm('¿Cancelar pedido?')) return;
    setUpdating(true);
    try {
      const r = await patchOnlineOrderStatus(o.id, 'CANCELLED');
      applyOrderUpdate(r);
      if (detail?.id === o.id) setDetail({ ...detail, status: r.status });
    } finally {
      setUpdating(false);
    }
  }

  if (loading) return <div className="text-gray-400 py-12 text-center">Cargando…</div>;

  const byStatus = (s: OnlineOrderStatus) => orders.filter((o) => o.status === s);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="inline-flex rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => setView('kanban')}
            className={`px-3 py-1.5 rounded-md text-sm font-semibold flex items-center gap-1.5 ${view === 'kanban' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
          >
            <LayoutGrid className="h-4 w-4" /> Pedidos activos
          </button>
          <button
            onClick={() => setView('history')}
            className={`px-3 py-1.5 rounded-md text-sm font-semibold flex items-center gap-1.5 ${view === 'history' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
          >
            <History className="h-4 w-4" /> Historial
          </button>
        </div>
        <button onClick={load} className="text-sm px-3 py-1.5 bg-gray-100 rounded hover:bg-gray-200">Actualizar</button>
      </div>

      {view === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 overflow-x-auto">
          {COLUMNS.map((col) => {
            const items = byStatus(col.id);
            const isHover = hoverCol === col.id;
            return (
              <div
                key={col.id}
                onDragOver={(e) => { e.preventDefault(); if (hoverCol !== col.id) setHoverCol(col.id); }}
                onDragLeave={() => setHoverCol((h) => h === col.id ? null : h)}
                onDrop={(e) => {
                  e.preventDefault();
                  setHoverCol(null);
                  if (draggingId != null) moveTo(draggingId, col.id);
                  setDraggingId(null);
                }}
                className={`rounded-xl p-3 min-w-[220px] transition-colors ${isHover ? 'bg-emerald-50 ring-2 ring-emerald-300' : 'bg-gray-100'}`}
              >
                <div className={`flex items-center justify-between mb-3 px-2 py-1 rounded ${col.color}`}>
                  <span className="font-semibold text-xs uppercase tracking-wide">{col.label}</span>
                  <span className="font-bold text-sm">{items.length}</span>
                </div>
                <div className="space-y-2 min-h-[60px]">
                  {items.map((o) => (
                    <div
                      key={o.id}
                      draggable
                      onDragStart={(e) => { setDraggingId(o.id); e.dataTransfer.effectAllowed = 'move'; }}
                      onDragEnd={() => { setDraggingId(null); setHoverCol(null); }}
                      onClick={() => openDetail(o)}
                      className={`bg-white rounded-lg p-3 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${draggingId === o.id ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-bold text-sm text-gray-900">{o.order_number}</div>
                        <div className="text-xs text-gray-400">{new Date(o.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                      <div className="text-xs text-gray-600 truncate">{o.customer_name}</div>
                      <div className="text-xs text-gray-500 mb-2">{o.delivery_type === 'PICKUP' ? 'Retiro' : 'Envío'}</div>
                      <div className="font-bold text-emerald-600">{moneyAR(Number(o.total))}</div>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div className="text-center text-xs text-gray-400 py-4">Arrastrá acá</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Pedido</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Pago</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {history.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openDetail(o)}>
                  <td className="px-4 py-3 font-bold text-gray-900">{o.order_number}</td>
                  <td className="px-4 py-3">{o.customer_name}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${o.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {STATUS_LABELS[o.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{o.payment_method_name || '—'}</td>
                  <td className="px-4 py-3 font-semibold">{moneyAR(Number(o.total))}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(o.created_at).toLocaleString('es-AR')}</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr><td colSpan={6} className="text-center text-gray-400 py-8">Sin pedidos en historial.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
              <div>
                <h3 className="font-bold text-lg">Pedido {detail.order_number}</h3>
                <div className="text-xs text-gray-500">{new Date(detail.created_at).toLocaleString('es-AR')}</div>
              </div>
              <button onClick={() => setDetail(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500 text-xs uppercase">Cliente</div>
                  <div className="font-semibold">{detail.customer_name}</div>
                  <div className="text-gray-600 flex items-center gap-1">
                    {detail.customer_phone}
                    <a
                      href={`https://wa.me/${detail.customer_phone.replace(/\D/g, '')}`}
                      target="_blank" rel="noreferrer"
                      className="text-green-600 hover:underline"
                    ><MessageCircle className="h-3.5 w-3.5 inline" /></a>
                  </div>
                  {detail.customer_email && <div className="text-gray-600">{detail.customer_email}</div>}
                </div>
                <div>
                  <div className="text-gray-500 text-xs uppercase">Entrega</div>
                  <div className="font-semibold">{detail.delivery_type === 'PICKUP' ? 'Retiro en local' : 'Envío a domicilio'}</div>
                  {detail.delivery_address && <div className="text-gray-600">{detail.delivery_address}</div>}
                  {detail.delivery_notes && <div className="text-gray-500 text-xs italic mt-1">Notas: {detail.delivery_notes}</div>}
                </div>
              </div>

              {detail.payment_method_name && (
                <div className="bg-emerald-50 text-emerald-700 text-sm rounded-lg p-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  <span>Cobrado con <b>{prettyPmName(detail.payment_method_name || '')}</b>{detail.confirmed_at ? ` · ${new Date(detail.confirmed_at).toLocaleString('es-AR')}` : ''}</span>
                </div>
              )}

              <div>
                <div className="text-gray-500 text-xs uppercase mb-2">Items</div>
                <div className="bg-gray-50 rounded-lg divide-y divide-gray-100">
                  {(detail.items || []).map((it) => (
                    <div key={it.id} className="p-3 flex justify-between items-center text-sm">
                      <div>
                        <div className="font-semibold">{it.qty}× {it.product_name}</div>
                        {it.notes && <div className="text-xs text-gray-500">{it.notes}</div>}
                      </div>
                      <div className="font-semibold">{moneyAR(Number(it.subtotal))}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>{moneyAR(Number(detail.subtotal))}</span></div>
                {Number(detail.discount) > 0 && (
                  <div className="flex justify-between text-green-600"><span>Descuento</span><span>-{moneyAR(Number(detail.discount))}</span></div>
                )}
                {Number(detail.delivery_cost) > 0 && (
                  <div className="flex justify-between"><span>Envío</span><span>{moneyAR(Number(detail.delivery_cost))}</span></div>
                )}
                <div className="flex justify-between font-bold text-lg pt-1 border-t mt-1">
                  <span>Total</span><span>{moneyAR(Number(detail.total))}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {NEXT[detail.status] && detail.status !== 'CANCELLED' && detail.status !== 'DELIVERED' && (
                  <button
                    onClick={() => advance(detail)}
                    disabled={updating}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-500 text-white font-semibold flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    {detail.status === 'PRE_CONFIRMED'
                      ? 'Confirmar y cobrar'
                      : <>Avanzar a {STATUS_LABELS[NEXT[detail.status]!]}<ChevronRight className="h-4 w-4" /></>}
                  </button>
                )}
                {detail.status !== 'CANCELLED' && detail.status !== 'DELIVERED' && (
                  <button
                    onClick={() => cancel(detail)}
                    disabled={updating}
                    className="px-4 py-2.5 rounded-lg bg-red-50 text-red-600 font-semibold disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {cobroOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => !confirming && setCobroOrder(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="h-5 w-5 text-emerald-600" />
              <h3 className="font-bold text-lg">Confirmar cobro</h3>
            </div>
            <div className="text-sm text-gray-500 mb-4">
              Pedido <b>{cobroOrder.order_number}</b> · {cobroOrder.customer_name}
            </div>

            <div className="bg-gray-50 rounded-lg p-3 mb-4 flex justify-between items-center">
              <span className="text-sm text-gray-600">Total a cobrar</span>
              <span className="font-bold text-xl text-emerald-600">{moneyAR(Number(cobroOrder.total))}</span>
            </div>

            <div className="mb-2">
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Método de pago</label>
              {paymentMethods.length === 0 ? (
                <div className="text-sm text-gray-500 bg-yellow-50 p-3 rounded-lg">No hay métodos de pago activos.</div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {paymentMethods.map((pm) => (
                    <button
                      key={pm.id}
                      onClick={() => setSelectedPm(pm.id)}
                      className={`p-3 rounded-lg border text-sm font-semibold transition-colors ${
                        selectedPm === pm.id
                          ? 'bg-emerald-500 text-white border-emerald-500'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300'
                      }`}
                    >
                      {prettyPmName(pm.name)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {cobroError && <div className="bg-red-50 text-red-600 text-sm p-2 rounded mt-3">{cobroError}</div>}

            <div className="text-xs text-gray-500 mt-3">
              Al confirmar se descuenta stock y el pedido pasa a <b>En cola</b>.
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setCobroOrder(null)} disabled={confirming} className="px-4 py-2 bg-gray-100 rounded-lg">Cancelar</button>
              <button
                onClick={runConfirm}
                disabled={confirming || !selectedPm}
                className="px-4 py-2 rounded-lg bg-emerald-500 text-white font-semibold disabled:opacity-50"
              >
                {confirming ? 'Confirmando…' : 'Confirmar cobro'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
