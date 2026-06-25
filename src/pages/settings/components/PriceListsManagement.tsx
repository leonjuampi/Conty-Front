import { useState, useEffect } from 'react';
import {
  listPriceLists, createPriceList, updatePriceList, deletePriceList,
  listPriceListItems, upsertPriceListItems,
  type PriceList, type PriceListItem,
} from '../../../services/priceLists.service';
import { listBranches, type Branch } from '../../../services/branches.service';
import { listProducts } from '../../../services/products.service';

const emptyForm = { name: '', description: '', is_default: false, branchId: '' };

// ─── Modal de precios por variante ─────────────────────────────────────────

interface ProductRow {
  variantId: number;
  productName: string;
  variantName: string;
  basePrice: number;
}

function PriceItemsModal({ list, onClose }: { list: PriceList; onClose: () => void }) {
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [prices, setPrices] = useState<Record<number, string>>({});  // variantId → precio editado
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLoading(true);
    // Si la lista está asignada a una sucursal, mostrar solo productos visibles ahí
    const prodsParams: { status: string; limit: number; branchId?: number } = { status: 'ACTIVE', limit: 500 };
    if (list.branch_id) prodsParams.branchId = list.branch_id;

    Promise.all([
      listPriceListItems(list.id),
      listProducts(prodsParams),
    ]).then(([itemsRes, prodsRes]) => {
      // Armar filas desde productos (fuente de nombres)
      const productRows: ProductRow[] = [];
      const map: Record<number, string> = {};

      for (const p of prodsRes.items) {
        const v = p.variants?.[0];
        if (!v?.id) continue;
        productRows.push({
          variantId: v.id,
          productName: p.name,
          variantName: v.name || 'default',
          basePrice: Number(v.price) || 0,
        });
        map[v.id] = '';
      }

      // Sobrescribir con precios existentes en la lista
      for (const it of itemsRes.items) {
        map[it.variant_id] = String(it.price);
        // Por si la lista tiene un item de un producto no listado (ej: deshabilitado)
        if (!productRows.find(r => r.variantId === it.variant_id)) {
          productRows.push({
            variantId: it.variant_id,
            productName: it.product_name || '—',
            variantName: it.variant_name || 'default',
            basePrice: 0,
          });
        }
      }

      productRows.sort((a, b) => a.productName.localeCompare(b.productName));
      setRows(productRows);
      setPrices(map);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [list.id, list.branch_id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const toUpsert = Object.entries(prices)
        .filter(([, v]) => v !== '' && !isNaN(Number(v)) && Number(v) > 0)
        .map(([variantId, price]) => ({ variantId: Number(variantId), price: Number(price) }));
      await upsertPriceListItems(list.id, toUpsert);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      alert('Error al guardar precios');
    } finally {
      setSaving(false);
    }
  };

  const q = search.toLowerCase().trim();
  const visibleRows = q ? rows.filter(r => r.productName.toLowerCase().includes(q)) : rows;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-white w-full h-full md:h-auto md:max-h-[90vh] md:rounded-2xl shadow-2xl md:max-w-3xl overflow-hidden flex flex-col safe-top">
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-100 bg-white">
          <div className="min-w-0 flex-1 mr-3">
            <h3 className="text-lg font-bold text-gray-800 truncate">Precios — {list.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">Dejá en blanco los productos sin precio especial. Los demás usan el precio base global.</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 cursor-pointer shrink-0">
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        <div className="px-4 md:px-6 py-3 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
            <i className="ri-search-line text-gray-400"></i>
            <input
              type="text"
              placeholder="Buscar producto..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 text-sm bg-transparent outline-none placeholder-gray-400"
            />
            <span className="text-xs text-gray-400">{visibleRows.length} productos</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <i className="ri-loader-4-line animate-spin text-3xl text-brand-500"></i>
            </div>
          ) : visibleRows.length === 0 ? (
            <div className="text-center text-gray-400 text-sm py-12">No hay productos para mostrar.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Producto</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-gray-600 w-28">Variante</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-gray-600 w-28">Base</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-gray-600 w-40">Precio en lista</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleRows.map(r => (
                  <tr key={r.variantId} className="hover:bg-brand-50/30">
                    <td className="px-4 py-2.5 text-gray-800">{r.productName}</td>
                    <td className="px-3 py-2.5 text-gray-500 text-xs">{r.variantName}</td>
                    <td className="px-3 py-2.5 text-right text-gray-500 text-xs">
                      ${r.basePrice.toLocaleString('es-AR')}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1 justify-end">
                        <span className="text-gray-400 text-sm">$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={prices[r.variantId] ?? ''}
                          onChange={e => setPrices(p => ({ ...p, [r.variantId]: e.target.value }))}
                          placeholder="—"
                          className="w-28 text-right px-2 py-1 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 p-4 md:p-6 border-t border-gray-100 bg-gray-50">
          <button onClick={onClose} className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 text-sm cursor-pointer min-h-[48px]">Cerrar</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-3 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold text-sm cursor-pointer min-h-[48px]">
            {saving ? <><i className="ri-loader-4-line animate-spin mr-1"></i>Guardando...</> : saved ? <><i className="ri-checkbox-circle-line mr-1"></i>Guardado</> : 'Guardar precios'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Gestión de listas ─────────────────────────────────────────────────────

export default function PriceListsManagement() {
  const [lists, setLists] = useState<PriceList[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<PriceList | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [saved, setSaved] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [itemsModal, setItemsModal] = useState<PriceList | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [listsRes, branchRes] = await Promise.all([
        listPriceLists(),
        listBranches({ status: 'ACTIVE' }),
      ]);
      setLists(listsRes.items);
      setBranches(branchRes.items);
    } catch {
      setLists([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const branchName = (id: number | null) => branches.find(b => b.id === id)?.name ?? null;

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (pl: PriceList) => {
    setEditing(pl);
    setForm({
      name: pl.name,
      description: pl.description || '',
      is_default: pl.is_default,
      branchId: pl.branch_id ? String(pl.branch_id) : '',
    });
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
        description: form.description.trim() || null,
        is_default: form.is_default,
        branchId: form.branchId ? Number(form.branchId) : null,
      };
      if (editing) {
        await updatePriceList(editing.id, { ...payload, branch_id: payload.branchId });
      } else {
        await createPriceList(payload);
      }
      setShowModal(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      await fetchAll();
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
      await fetchAll();
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
          <p className="text-xs md:text-sm text-gray-500 mt-1">Cada sucursal puede tener su propia lista de precios</p>
        </div>
        <button onClick={openCreate} className="flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-3 rounded-lg font-semibold text-sm transition-all whitespace-nowrap cursor-pointer min-h-[48px] w-full sm:w-auto">
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
          <i className="ri-loader-4-line animate-spin text-3xl text-brand-500"></i>
        </div>
      ) : lists.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">No hay listas de precio.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {lists.map(pl => (
            <div key={pl.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-brand-400 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-800 truncate">{pl.name}</p>
                    {pl.is_default && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-100 text-brand-700 shrink-0">Por defecto</span>
                    )}
                    {pl.branch_id && branchName(pl.branch_id) && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 shrink-0 flex items-center gap-1">
                        <i className="ri-store-2-line text-xs"></i>
                        {branchName(pl.branch_id)}
                      </span>
                    )}
                  </div>
                  {pl.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{pl.description}</p>}
                </div>
              </div>
              <div className="flex gap-2 mt-3 border-t border-gray-100 pt-3">
                <button onClick={() => setItemsModal(pl)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 cursor-pointer">
                  <i className="ri-price-tag-3-line"></i> Precios
                </button>
                <button onClick={() => openEdit(pl)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border border-brand-200 text-brand-600 text-xs font-semibold hover:bg-brand-50 cursor-pointer">
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

      {/* Modal crear/editar lista */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-white w-full h-full md:h-auto md:rounded-2xl shadow-2xl md:max-w-md overflow-y-auto safe-top">
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-gray-800">{editing ? 'Editar Lista' : 'Nueva Lista de Precio'}</h3>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 cursor-pointer">
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            <div className="p-4 md:p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre *</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej: Precios Roti 2" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm min-h-[48px]" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Descripción</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descripción opcional" rows={2} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm resize-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Sucursal asociada</label>
                <select
                  value={form.branchId}
                  onChange={e => setForm({ ...form, branchId: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm min-h-[48px]"
                >
                  <option value="">Global (aplica a todas las sucursales)</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={form.is_default} onChange={e => setForm({ ...form, is_default: e.target.checked })} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-brand-400 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
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
              <button onClick={handleSave} disabled={saving} className="flex-1 py-3 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold transition-all text-sm cursor-pointer min-h-[48px]">
                {saving ? <><i className="ri-loader-4-line animate-spin mr-1"></i>Guardando...</> : (editing ? 'Guardar Cambios' : 'Crear Lista')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar borrado */}
      {deleteId !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-red-100">
                <i className="ri-delete-bin-line text-red-500 text-lg"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-800">Eliminar lista</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">¿Estás seguro? También se eliminarán todos los precios configurados en esta lista.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold text-sm cursor-pointer hover:bg-gray-50">Cancelar</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-3 rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white font-semibold text-sm cursor-pointer">
                {deleting ? <><i className="ri-loader-4-line animate-spin mr-1"></i>Eliminando...</> : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de precios */}
      {itemsModal && (
        <PriceItemsModal list={itemsModal} onClose={() => setItemsModal(null)} />
      )}
    </div>
  );
}
