import { useState, useEffect } from 'react';
import { listBranches, createBranch, updateBranch, deleteBranch, type Branch } from '../../../services/branches.service';

const emptyForm = { name: '', address: '', phone: '', channel: 'LOCAL' as Branch['channel'], printerName: '', printerCode: '', status: 'ACTIVE' as Branch['status'] };

const CHANNEL_LABELS: Record<string, string> = { LOCAL: 'Local', ONLINE: 'Online' };
const STATUS_COLORS: Record<string, string> = { ACTIVE: 'bg-green-100 text-green-700', INACTIVE: 'bg-gray-100 text-gray-500' };

export default function BranchesManagement() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [saved, setSaved] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const res = await listBranches();
      setBranches(res.items);
    } catch {
      setBranches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBranches(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (b: Branch) => {
    setEditing(b);
    setForm({ name: b.name, address: b.address || '', phone: b.phone || '', channel: b.channel, printerName: b.printerName || '', printerCode: b.printerCode || '', status: b.status });
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return setFormError('El nombre es obligatorio');
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        name: form.name.trim(),
        address: form.address.trim() || null,
        phone: form.phone.trim() || null,
        channel: form.channel,
        printerName: form.printerName.trim() || null,
        printerCode: form.printerCode.trim() || null,
        status: form.status,
      };
      if (editing) {
        await updateBranch(editing.id, payload);
      } else {
        await createBranch(payload);
      }
      setShowModal(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      await fetchBranches();
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
      await deleteBranch(deleteId);
      setDeleteId(null);
      await fetchBranches();
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
          <h2 className="text-lg md:text-xl font-bold text-gray-800">Puntos de Venta</h2>
          <p className="text-xs md:text-sm text-gray-500 mt-1">Sucursales y puntos de venta de tu organización</p>
        </div>
        <button onClick={openCreate} className="flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-3 rounded-lg font-semibold text-sm transition-all whitespace-nowrap cursor-pointer min-h-[48px] w-full sm:w-auto">
          <i className="ri-add-line"></i>
          Nueva Sucursal
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
      ) : branches.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">No hay sucursales. Crea la primera.</div>
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Nombre</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Dirección</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Teléfono</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Canal</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Estado</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {branches.map(b => (
                  <tr key={b.id} className="hover:bg-brand-50/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{b.name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{b.address || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{b.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                        {CHANNEL_LABELS[b.channel] || b.channel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[b.status] || 'bg-gray-100 text-gray-600'}`}>
                        {b.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(b)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-brand-100 text-brand-600 cursor-pointer">
                          <i className="ri-edit-line"></i>
                        </button>
                        <button onClick={() => setDeleteId(b.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-100 text-red-500 cursor-pointer">
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
            {branches.map(b => (
              <div key={b.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800">{b.name}</p>
                    {b.address && <p className="text-xs text-gray-500 mt-0.5">{b.address}</p>}
                    {b.phone && <p className="text-xs text-gray-400">{b.phone}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">{CHANNEL_LABELS[b.channel]}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[b.status]}`}>{b.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 border-t border-gray-100 pt-3">
                  <button onClick={() => openEdit(b)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border border-brand-200 text-brand-600 text-xs font-semibold hover:bg-brand-50 cursor-pointer">
                    <i className="ri-edit-line"></i> Editar
                  </button>
                  <button onClick={() => setDeleteId(b.id)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border border-red-200 text-red-500 text-xs font-semibold hover:bg-red-50 cursor-pointer">
                    <i className="ri-delete-bin-line"></i> Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal crear/editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-white w-full h-full md:h-auto md:rounded-2xl shadow-2xl md:max-w-lg overflow-y-auto">
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-gray-800">{editing ? 'Editar Sucursal' : 'Nueva Sucursal'}</h3>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 cursor-pointer">
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            <div className="p-4 md:p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre *</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej: Sucursal Centro" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm min-h-[48px]" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Dirección</label>
                <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Ej: Av. Corrientes 1234" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm min-h-[48px]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Teléfono</label>
                  <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Ej: 11-4444-5555" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm min-h-[48px]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Canal</label>
                  <select value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value as Branch['channel'] })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm min-h-[48px]">
                    <option value="LOCAL">Local</option>
                    <option value="ONLINE">Online</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre Impresora</label>
                  <input type="text" value={form.printerName} onChange={e => setForm({ ...form, printerName: e.target.value })} placeholder="Ej: Ticket POS-001" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm min-h-[48px]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Código POS</label>
                  <input type="text" value={form.printerCode} onChange={e => setForm({ ...form, printerCode: e.target.value })} placeholder="Ej: POS-001" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm min-h-[48px]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Estado</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Branch['status'] })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm min-h-[48px]">
                  <option value="ACTIVE">Activo</option>
                  <option value="INACTIVE">Inactivo</option>
                </select>
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
                {saving ? <><i className="ri-loader-4-line animate-spin mr-1"></i>Guardando...</> : (editing ? 'Guardar Cambios' : 'Crear Sucursal')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar borrar */}
      {deleteId !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-red-100">
                <i className="ri-delete-bin-line text-red-500 text-lg"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-800">Eliminar sucursal</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">¿Estás seguro que deseas eliminar esta sucursal? Esta acción no se puede deshacer.</p>
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
