import { useState, useEffect } from 'react';
import { listPriceLists, createPriceList, updatePriceList, deletePriceList, type PriceList } from '../../../services/priceLists.service';

const emptyForm = { name: '', description: '', is_default: false };

export default function PriceListsManagement() {
  const [lists, setLists] = useState<PriceList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<PriceList | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [saved, setSaved] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchLists = async () => {
    setLoading(true);
    try {
      const res = await listPriceLists();
      setLists(res.items);
    } catch {
      setLists([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLists(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (pl: PriceList) => {
    setEditing(pl);
    setForm({ name: pl.name, description: pl.description || '', is_default: pl.is_default });
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return setFormError('El nombre es obligatorio');
    setSaving(true);
    setFormError('');
    try {
      const payload = { name: form.name.trim(), description: form.description.trim() || null, is_default: form.is_default };
      if (editing) {
        await updatePriceList(editing.id, payload);
      } else {
        await createPriceList(payload);
      }
      setShowModal(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      await fetchLists();
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
      await deletePriceList(deleteId);
      setDeleteId(null);
      await fetchLists();
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
          <h2 className="text-lg md:text-xl font-bold text-gray-800">Listas de Precio</h2>
          <p className="text-xs md:text-sm text-gray-500 mt-1">Gestioná las listas de precios de tu organización</p>
        </div>
        <button onClick={openCreate} className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-lg font-semibold text-sm transition-all whitespace-nowrap cursor-pointer min-h-[48px] w-full sm:w-auto">
          <i className="ri-add-line"></i>
          Nueva Lista
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
          <i className="ri-loader-4-line animate-spin text-3xl text-orange-500"></i>
        </div>
      ) : lists.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">No hay listas de precio. Crea la primera.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {lists.map(pl => (
            <div key={pl.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-orange-300 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-800 truncate">{pl.name}</p>
                    {pl.is_default && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 shrink-0">Por defecto</span>
                    )}
                  </div>
                  {pl.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{pl.description}</p>}
                </div>
              </div>
              <div className="flex gap-2 mt-3 border-t border-gray-100 pt-3">
                <button onClick={() => openEdit(pl)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border border-orange-200 text-orange-600 text-xs font-semibold hover:bg-orange-50 cursor-pointer">
                  <i className="ri-edit-line"></i> Editar
                </button>
                {!pl.is_default && (
                  <button onClick={() => setDeleteId(pl.id)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border border-red-200 text-red-500 text-xs font-semibold hover:bg-red-50 cursor-pointer">
                    <i className="ri-delete-bin-line"></i> Eliminar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-white w-full h-full md:h-auto md:rounded-2xl shadow-2xl md:max-w-md overflow-y-auto">
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-gray-800">{editing ? 'Editar Lista' : 'Nueva Lista de Precio'}</h3>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 cursor-pointer">
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            <div className="p-4 md:p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre *</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej: Mayorista Especial" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm min-h-[48px]" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Descripción</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descripción opcional" rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm resize-none" />
              </div>
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={form.is_default} onChange={e => setForm({ ...form, is_default: e.target.checked })} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-orange-400 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
                <span className="text-sm font-semibold text-gray-700">Lista por defecto</span>
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
              <button onClick={handleSave} disabled={saving} className="flex-1 py-3 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold transition-all text-sm cursor-pointer min-h-[48px]">
                {saving ? <><i className="ri-loader-4-line animate-spin mr-1"></i>Guardando...</> : (editing ? 'Guardar Cambios' : 'Crear Lista')}
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
              <h3 className="text-lg font-bold text-gray-800">Eliminar lista</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">¿Estás seguro que deseas eliminar esta lista? Esta acción no se puede deshacer.</p>
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
