import { useEffect, useState } from 'react';
import { Plus, Trash2, Pencil, Shuffle } from 'lucide-react';
import {
  listCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  type Coupon,
} from '../../../services/store.service';

function generateCouponCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function emptyForm(): Partial<Coupon> {
  return {
    code: '',
    discount_type: 'PERCENT',
    discount_value: 10,
    min_order_amount: 0,
    valid_from: null,
    valid_to: null,
    max_uses: null,
    status: 'ACTIVE',
  };
}

export default function TiendaOnlineCoupons() {
  const [list, setList] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Partial<Coupon> | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try { setList(await listCoupons()); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function save() {
    if (!modal) return;
    if (!modal.code || !modal.discount_value) { setError('Completá código y valor del descuento'); return; }
    setSaving(true); setError(null);
    try {
      if (modal.id) await updateCoupon(modal.id, modal);
      else await createCoupon(modal);
      setModal(null);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'No se pudo guardar el cupón');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm('¿Eliminar cupón?')) return;
    await deleteCoupon(id);
    load();
  }

  if (loading) return <div className="text-gray-400 py-12 text-center">Cargando…</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="font-bold text-gray-900">Cupones de descuento</div>
          <div className="text-sm text-gray-500">Creá códigos para que tus clientes los usen en el checkout.</div>
        </div>
        <button
          onClick={() => setModal(emptyForm())}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Nuevo cupón
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Descuento</th>
              <th className="px-4 py-3">Mínimo</th>
              <th className="px-4 py-3">Vigencia</th>
              <th className="px-4 py-3">Usos</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {list.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-bold text-gray-900">{c.code}</td>
                <td className="px-4 py-3">
                  {c.discount_type === 'PERCENT' ? `${c.discount_value}%` : `$${Number(c.discount_value).toLocaleString('es-AR')}`}
                </td>
                <td className="px-4 py-3">{c.min_order_amount > 0 ? `$${Number(c.min_order_amount).toLocaleString('es-AR')}` : '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {c.valid_from ? new Date(c.valid_from).toLocaleDateString('es-AR') : '—'} →{' '}
                  {c.valid_to ? new Date(c.valid_to).toLocaleDateString('es-AR') : '—'}
                </td>
                <td className="px-4 py-3">{c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ''}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${c.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {c.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setModal(c)} className="p-1.5 text-gray-500 hover:text-emerald-600"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(c.id)} className="p-1.5 text-gray-500 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={7} className="text-center text-gray-400 py-8">Todavía no tenés cupones.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !saving && setModal(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4">{modal.id ? 'Editar cupón' : 'Nuevo cupón'}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Código *</label>
                <div className="flex gap-2">
                  <input
                    type="text" value={modal.code || ''}
                    onChange={(e) => setModal({ ...modal, code: e.target.value.toUpperCase() })}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setModal({ ...modal, code: generateCouponCode() })}
                    className="px-3 py-2 rounded-lg bg-emerald-50 text-emerald-600 font-semibold hover:bg-emerald-100 flex items-center gap-1 text-sm"
                    title="Generar código aleatorio"
                  >
                    <Shuffle className="h-4 w-4" /> Generar
                  </button>
                </div>
                <div className="text-xs text-gray-400 mt-1">6 caracteres alfanuméricos en mayúsculas.</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Tipo</label>
                  <select
                    value={modal.discount_type || 'PERCENT'}
                    onChange={(e) => setModal({ ...modal, discount_type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200"
                  >
                    <option value="PERCENT">Porcentaje (%)</option>
                    <option value="AMOUNT">Monto fijo ($)</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Valor *</label>
                  <input
                    type="number" step="0.01" value={modal.discount_value ?? ''}
                    onChange={(e) => setModal({ ...modal, discount_value: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Monto mínimo del pedido</label>
                <input
                  type="number" step="0.01" value={modal.min_order_amount ?? 0}
                  onChange={(e) => setModal({ ...modal, min_order_amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Válido desde</label>
                  <input
                    type="date"
                    value={modal.valid_from ? String(modal.valid_from).slice(0, 10) : ''}
                    onChange={(e) => setModal({ ...modal, valid_from: e.target.value || null })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Válido hasta</label>
                  <input
                    type="date"
                    value={modal.valid_to ? String(modal.valid_to).slice(0, 10) : ''}
                    onChange={(e) => setModal({ ...modal, valid_to: e.target.value || null })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Usos máximos</label>
                  <input
                    type="number" value={modal.max_uses ?? ''}
                    onChange={(e) => setModal({ ...modal, max_uses: e.target.value ? Number(e.target.value) : null })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200"
                    placeholder="Ilimitado"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Estado</label>
                  <select
                    value={modal.status || 'ACTIVE'}
                    onChange={(e) => setModal({ ...modal, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200"
                  >
                    <option value="ACTIVE">Activo</option>
                    <option value="INACTIVE">Inactivo</option>
                  </select>
                </div>
              </div>
              {error && <div className="bg-red-50 text-red-600 text-sm p-2 rounded">{error}</div>}
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setModal(null)} disabled={saving} className="px-4 py-2 bg-gray-100 rounded-lg">Cancelar</button>
              <button onClick={save} disabled={saving} className="px-4 py-2 rounded-lg bg-emerald-500 text-white font-semibold disabled:opacity-50">
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
