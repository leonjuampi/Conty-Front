import { useState, useEffect } from 'react';
import {
  listRawMaterials,
  createRawMaterial,
  updateRawMaterial,
  deleteRawMaterial,
  type RawMaterial,
} from '../../../services/rawMaterials.service';

const emptyForm = { name: '', origin: '', unitPrice: '' };

export default function MercaderiaTab() {
  const [items, setItems] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<RawMaterial | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<RawMaterial | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await listRawMaterials({ limit: 500 });
      setItems(res.items);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.origin ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAdd = () => {
    setEditItem(null);
    setForm(emptyForm);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (item: RawMaterial) => {
    setEditItem(item);
    setForm({ name: item.name, origin: item.origin ?? '', unitPrice: String(item.unit_price) });
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditItem(null); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    const origin = form.origin.trim();
    const unitPrice = parseFloat(form.unitPrice);
    if (!name) return setFormError('El nombre es obligatorio');
    if (isNaN(unitPrice) || unitPrice < 0) return setFormError('Ingresá un monto válido');
    setSaving(true);
    setFormError('');
    try {
      if (editItem) {
        await updateRawMaterial(editItem.id, { name, origin: origin || undefined, unitPrice });
      } else {
        await createRawMaterial({ name, origin: origin || undefined, unitPrice });
      }
      closeModal();
      await fetchItems();
    } catch {
      setFormError('Error al guardar. Intentá nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteRawMaterial(deleteTarget.id);
      setDeleteTarget(null);
      await fetchItems();
    } catch {
      alert('Error al eliminar');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mercadería</h2>
          <p className="text-sm text-gray-600 mt-1">Materias primas e insumos con su precio de compra</p>
        </div>
        <button
          onClick={openAdd}
          className="bg-[#E8650A] text-white px-4 py-2 rounded-lg hover:bg-[#d15809] transition-colors flex items-center gap-2 whitespace-nowrap"
        >
          <i className="ri-add-line"></i>
          Agregar Producto
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              placeholder="Buscar por nombre de producto..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8650A] focus:border-transparent text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Producto</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Origen</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Monto ($)</th>
                <th className="px-6 py-3 text-center text-sm font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center">
                    <i className="ri-loader-4-line animate-spin text-2xl text-[#E8650A]"></i>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500 text-sm">
                    {items.length === 0 ? 'No hay mercadería cargada. Agregá el primer item.' : 'No se encontraron resultados.'}
                  </td>
                </tr>
              ) : filtered.map((item, index) => (
                <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 text-sm text-gray-900 font-semibold uppercase">{item.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 uppercase">{item.origin || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                    ${Number(item.unit_price).toLocaleString('es-AR')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => openEdit(item)}
                        className="w-8 h-8 flex items-center justify-center text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                        title="Editar"
                      >
                        <i className="ri-pencil-line text-lg"></i>
                      </button>
                      <button
                        onClick={() => setDeleteTarget(item)}
                        className="w-8 h-8 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors cursor-pointer"
                        title="Eliminar"
                      >
                        <i className="ri-delete-bin-line text-lg"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Agregar / Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">{editItem ? 'Editar Producto' : 'Agregar Producto'}</h3>
              <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors cursor-pointer">
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Producto *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej: ACEITE, HARINA, TOMATE..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8650A] text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Origen *</label>
                <input
                  type="text"
                  value={form.origin}
                  onChange={e => setForm({ ...form, origin: e.target.value })}
                  placeholder="Ej: FERIA, PANADERÍA, CARNICERÍA..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8650A] text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto ($) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.unitPrice}
                  onChange={e => setForm({ ...form, unitPrice: e.target.value })}
                  placeholder="Ej: 1500"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8650A] text-sm"
                  required
                />
              </div>
              {formError && <p className="text-sm text-red-600">{formError}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-[#E8650A] text-white rounded-lg hover:bg-[#d15809] transition-colors disabled:opacity-60 cursor-pointer">
                  {saving ? <><i className="ri-loader-4-line animate-spin mr-1"></i>Guardando...</> : (editItem ? 'Guardar Cambios' : 'Agregar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 flex items-center justify-center bg-red-100 rounded-full shrink-0">
                <i className="ri-delete-bin-line text-red-600 text-xl"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Eliminar producto</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              ¿Estás seguro que querés eliminar <strong>{deleteTarget.name}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60 cursor-pointer">
                {deleting ? <><i className="ri-loader-4-line animate-spin mr-1"></i>Eliminando...</> : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
