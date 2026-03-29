import { useState, useEffect } from 'react';
import { listPaymentMethods, createPaymentMethod, updatePaymentMethod, deletePaymentMethod, type PaymentMethod } from '../../../services/paymentMethods.service';

const KIND_LABELS: Record<string, string> = { CASH: 'Efectivo', DEBIT: 'Débito', CREDIT: 'Crédito', TRANSFER: 'Transferencia', MIXED: 'Mixto' };
const KIND_COLORS: Record<string, string> = {
  CASH: 'bg-green-100 text-green-700',
  DEBIT: 'bg-blue-100 text-blue-700',
  CREDIT: 'bg-purple-100 text-purple-700',
  TRANSFER: 'bg-cyan-100 text-cyan-700',
  MIXED: 'bg-brand-100 text-brand-700',
};

const emptyForm = { name: '', kind: 'CASH' as PaymentMethod['kind'], max_installments: 1, surcharge_pct: 0, discount_pct: 0, ticket_note: '', active: true };

export default function PaymentMethodsManagement() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [saved, setSaved] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchMethods = async () => {
    setLoading(true);
    try {
      const res = await listPaymentMethods();
      setMethods(res.items);
    } catch {
      setMethods([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMethods(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (m: PaymentMethod) => {
    setEditing(m);
    setForm({ name: m.name, kind: m.kind, max_installments: m.max_installments, surcharge_pct: m.surcharge_pct, discount_pct: m.discount_pct, ticket_note: m.ticket_note || '', active: m.active });
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return setFormError('El nombre es obligatorio');
    setSaving(true);
    setFormError('');
    try {
      const payload = { ...form, ticket_note: form.ticket_note.trim() || null };
      if (editing) {
        await updatePaymentMethod(editing.id, payload);
      } else {
        await createPaymentMethod(payload);
      }
      setShowModal(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      await fetchMethods();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(msg || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deletePaymentMethod(deleteId);
      setDeleteId(null);
      await fetchMethods();
    } catch {
      setDeleteId(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-gray-800">Medios de Pago</h2>
          <p className="text-xs md:text-sm text-gray-500 mt-1">Configurá los métodos de pago aceptados</p>
        </div>
        <button onClick={openCreate} className="flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-3 rounded-lg font-semibold text-sm transition-all whitespace-nowrap cursor-pointer min-h-[48px] w-full sm:w-auto">
          <i className="ri-add-line"></i>
          Nuevo Medio
        </button>
      </div>

      {saved && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          <i className="ri-checkbox-circle-line text-lg"></i>
          Guardado correctamente
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <i className="ri-loader-4-line animate-spin text-3xl text-brand-500"></i>
        </div>
      ) : methods.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">No hay medios de pago. Crea el primero.</div>
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Nombre</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Tipo</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Cuotas</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Recargo %</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Descuento %</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Estado</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {methods.map(m => (
                  <tr key={m.id} className="hover:bg-brand-50/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{m.name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${KIND_COLORS[m.kind] || 'bg-gray-100 text-gray-600'}`}>
                        {KIND_LABELS[m.kind] || m.kind}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-center">{m.max_installments}</td>
                    <td className="px-4 py-3 text-gray-600 text-center">{m.surcharge_pct > 0 ? `+${m.surcharge_pct}%` : '—'}</td>
                    <td className="px-4 py-3 text-gray-600 text-center">{m.discount_pct > 0 ? `-${m.discount_pct}%` : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${m.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {m.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(m)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-brand-100 text-brand-600 cursor-pointer">
                          <i className="ri-edit-line"></i>
                        </button>
                        <button onClick={() => setDeleteId(m.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-100 text-red-500 cursor-pointer">
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden space-y-3">
            {methods.map(m => (
              <div key={m.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800">{m.name}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {m.surcharge_pct > 0 && <span className="text-xs text-red-500">+{m.surcharge_pct}% recargo</span>}
                      {m.discount_pct > 0 && <span className="text-xs text-green-600">-{m.discount_pct}% descuento</span>}
                      {m.max_installments > 1 && <span className="text-xs text-gray-500">{m.max_installments} cuotas</span>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${KIND_COLORS[m.kind]}`}>{KIND_LABELS[m.kind]}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${m.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{m.active ? 'Activo' : 'Inactivo'}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 border-t border-gray-100 pt-3">
                  <button onClick={() => openEdit(m)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border border-brand-200 text-brand-600 text-xs font-semibold hover:bg-brand-50 cursor-pointer">
                    <i className="ri-edit-line"></i> Editar
                  </button>
                  <button onClick={() => setDeleteId(m.id)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border border-red-200 text-red-500 text-xs font-semibold hover:bg-red-50 cursor-pointer">
                    <i className="ri-delete-bin-line"></i> Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-white w-full h-full md:h-auto md:rounded-2xl shadow-2xl md:max-w-lg overflow-y-auto safe-top">
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-gray-800">{editing ? 'Editar Medio de Pago' : 'Nuevo Medio de Pago'}</h3>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 cursor-pointer">
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            <div className="p-4 md:p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre *</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej: Tarjeta Visa (1 pago)" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm min-h-[48px]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tipo *</label>
                  <select value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value as PaymentMethod['kind'] })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm min-h-[48px]">
                    {Object.entries(KIND_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Max. Cuotas</label>
                  <input type="number" min="1" value={form.max_installments} onChange={e => setForm({ ...form, max_installments: parseInt(e.target.value) || 1 })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm min-h-[48px]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Recargo (%)</label>
                  <input type="number" min="0" step="0.01" value={form.surcharge_pct} onChange={e => setForm({ ...form, surcharge_pct: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm min-h-[48px]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Descuento (%)</label>
                  <input type="number" min="0" step="0.01" value={form.discount_pct} onChange={e => setForm({ ...form, discount_pct: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm min-h-[48px]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nota en ticket</label>
                <input type="text" value={form.ticket_note} onChange={e => setForm({ ...form, ticket_note: e.target.value })} placeholder="Ej: Presentar DNI" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm min-h-[48px]" />
              </div>
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-brand-400 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
                </label>
                <span className="text-sm font-semibold text-gray-700">Activo</span>
              </div>
              {formError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                  <i className="ri-error-warning-line"></i>
                  {formError}
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 p-4 md:p-6 border-t border-gray-100 bg-gray-50">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all text-sm cursor-pointer min-h-[48px]">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-3 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold transition-all text-sm cursor-pointer min-h-[48px]">
                {saving ? <><i className="ri-loader-4-line animate-spin mr-1"></i>Guardando...</> : (editing ? 'Guardar Cambios' : 'Crear Medio')}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-red-100">
                <i className="ri-delete-bin-line text-red-500 text-lg"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-800">Eliminar medio de pago</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">¿Estás seguro que deseas eliminarlo? Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold text-sm cursor-pointer hover:bg-gray-50">Cancelar</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-3 rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white font-semibold text-sm cursor-pointer">
                {deleting ? <><i className="ri-loader-4-line animate-spin mr-1"></i>Eliminando...</> : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
