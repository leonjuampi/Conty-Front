import { useState, useEffect } from 'react';
import {
  getProductDetail,
  createVariant,
  updateVariant as updateVariantApi,
  deleteVariant as deleteVariantApi,
  toggleVariants,
  distributeStock,
} from '../../../services/products.service';
import { listBranches, type Branch } from '../../../services/branches.service';

interface VariantRow {
  id: number;
  name: string | null;
  sku: string | null;
  barcode: string | null;
  price: number | null;
  cost: number | null;
  stock: number;
  isDefault: boolean;
}

interface VariantsSectionProps {
  productId: number;
  hasVariants: boolean;
  onVariantsToggled: (enabled: boolean) => void;
}

export function VariantsSection({ productId, hasVariants, onVariantsToggled }: VariantsSectionProps) {
  const [enabled, setEnabled] = useState(hasVariants);
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: '', sku: '', barcode: '' });
  const [newVariant, setNewVariant] = useState({ name: '', sku: '', barcode: '' });
  const [saving, setSaving] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [showDistributeModal, setShowDistributeModal] = useState(false);
  const [distributeValues, setDistributeValues] = useState<Record<number, string>>({});

  const MAX_VARIANTS = 5;

  // Load branches on mount
  useEffect(() => {
    listBranches({ status: 'ACTIVE' }).then(res => {
      setBranches(res.items);
      if (res.items.length > 0) {
        setSelectedBranchId(res.items[0].id);
      }
    }).catch(() => {});
  }, []);

  // Fetch variant data when branch changes or toggle changes
  useEffect(() => {
    if (!selectedBranchId || !productId) return;
    fetchVariants();
  }, [selectedBranchId, productId, enabled]);

  const fetchVariants = async () => {
    if (!selectedBranchId) return;
    setLoading(true);
    try {
      const data = await getProductDetail(productId, selectedBranchId);
      const variantList: VariantRow[] = (data.variants || []).map((v: any) => {
        const stockEntry = (data.stock || []).find((s: any) => s.variant_id === v.id);
        return {
          id: v.id,
          name: v.name,
          sku: v.sku,
          barcode: v.barcode,
          price: v.price,
          cost: v.cost,
          stock: stockEntry?.qty ?? 0,
          isDefault: !!v.is_default,
        };
      });
      setVariants(variantList);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);
  const defaultVariant = variants.find(v => v.isDefault) ?? null;
  const namedVariants = enabled ? variants.filter(v => !v.isDefault) : [];
  const defaultStock = defaultVariant?.stock ?? 0;
  const assignedStock = namedVariants.reduce((sum, v) => sum + v.stock, 0);
  const unassignedStock = defaultStock;

  const handleToggle = async () => {
    if (enabled) {
      // Want to deactivate - show confirmation
      setShowDeactivateConfirm(true);
    } else {
      // Activate
      setSaving(true);
      try {
        await toggleVariants(productId, true);
        setEnabled(true);
        onVariantsToggled(true);
        await fetchVariants();
      } catch {
        alert('Error al activar variantes');
      } finally {
        setSaving(false);
      }
    }
  };

  const confirmDeactivate = async () => {
    setSaving(true);
    try {
      await toggleVariants(productId, false);
      setEnabled(false);
      onVariantsToggled(false);
      setShowDeactivateConfirm(false);
      await fetchVariants();
    } catch {
      alert('Error al desactivar variantes');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateVariant = async () => {
    if (!newVariant.name.trim()) return;
    setSaving(true);
    try {
      await createVariant(productId, {
        name: newVariant.name.trim(),
        sku: newVariant.sku.trim() || null,
        barcode: newVariant.barcode.trim() || null,
      });
      setNewVariant({ name: '', sku: '', barcode: '' });
      setShowNewForm(false);
      await fetchVariants();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al crear variante';
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = (v: VariantRow) => {
    setEditingId(v.id);
    setEditForm({ name: v.name || '', sku: v.sku || '', barcode: v.barcode || '' });
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editForm.name.trim()) return;
    setSaving(true);
    try {
      await updateVariantApi(editingId, {
        name: editForm.name.trim(),
        sku: editForm.sku.trim() || null,
        barcode: editForm.barcode.trim() || null,
      });
      setEditingId(null);
      await fetchVariants();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error al actualizar');
    } finally {
      setSaving(false);
    }
  };

  const openDistributeModal = () => {
    const initial: Record<number, string> = {};
    namedVariants.forEach(v => { initial[v.id] = ''; });
    setDistributeValues(initial);
    setShowDistributeModal(true);
  };

  const totalPending = Object.values(distributeValues).reduce((sum, v) => sum + (Number(v) || 0), 0);
  const distributeExceeds = totalPending > unassignedStock;

  const handleConfirmDistribute = async () => {
    if (!selectedBranchId || totalPending <= 0 || distributeExceeds) return;
    const distributions = Object.entries(distributeValues)
      .map(([variantId, qty]) => ({ variantId: Number(variantId), qty: Number(qty) || 0 }))
      .filter(d => d.qty > 0);
    if (!distributions.length) return;
    setSaving(true);
    try {
      await distributeStock(productId, selectedBranchId, distributions);
      setShowDistributeModal(false);
      await fetchVariants();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error al distribuir stock');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVariant = async (variantId: number) => {
    if (!confirm('¿Eliminar esta variante?')) return;
    try {
      await deleteVariantApi(variantId);
      await fetchVariants();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error al eliminar variante');
    }
  };

  // Stock distribution status
  const getStockStatus = () => {
    if (!enabled || namedVariants.length === 0) return null;
    if (unassignedStock > 0) {
      return { type: 'warning' as const, text: `Quedan ${unassignedStock} unidades sin asignar`, sub: 'Asignalas en una variante antes de cerrar, o se perderán del conteo total.' };
    }
    if (assignedStock > totalStock) {
      return { type: 'info' as const, text: `Asignaste ${assignedStock - (totalStock - defaultStock)} unidades extra`, sub: 'El stock total de las variantes supera el stock original registrado.' };
    }
    return { type: 'success' as const, text: 'Stock completamente distribuido', sub: 'Cada unidad del stock original quedó en una variante específica.' };
  };

  const stockStatus = getStockStatus();
  const stockPercentage = totalStock > 0 ? Math.min((assignedStock / totalStock) * 100, 100) : 0;

  return (
    <div className="border border-gray-200 rounded-xl p-4 space-y-4 bg-white">
      {/* Header con toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <i className="ri-layout-grid-line text-gray-500"></i>
            VARIANTES
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {enabled
              ? `${assignedStock} uds distribuidas en variantes`
              : 'Activá variantes para manejar talles, colores o tamaños con stock independiente'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          disabled={saving}
          className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${enabled ? 'bg-brand-500' : 'bg-gray-300'} ${saving ? 'opacity-50' : ''}`}
        >
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
        </button>
      </div>

      {/* Branch selector */}
      {enabled && branches.length > 1 && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Sucursal</label>
          <select
            value={selectedBranchId ?? ''}
            onChange={e => setSelectedBranchId(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm cursor-pointer"
          >
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Stock status banner */}
      {enabled && stockStatus && (
        <div className={`p-3 rounded-xl border ${
          stockStatus.type === 'warning' ? 'bg-amber-50 border-amber-200' :
          stockStatus.type === 'info' ? 'bg-blue-50 border-blue-200' :
          'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <i className={`text-sm ${
              stockStatus.type === 'warning' ? 'ri-error-warning-line text-amber-600' :
              stockStatus.type === 'info' ? 'ri-information-line text-blue-600' :
              'ri-checkbox-circle-line text-green-600'
            }`}></i>
            <span className="text-sm font-semibold text-gray-800">{stockStatus.text}</span>
          </div>
          <p className="text-xs text-gray-600 ml-5">{stockStatus.sub}</p>
          {/* Progress bar */}
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  stockStatus.type === 'warning' ? 'bg-amber-400' :
                  stockStatus.type === 'info' ? 'bg-blue-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${stockPercentage}%` }}
              />
            </div>
            <span className={`text-xs font-semibold ${
              stockStatus.type === 'warning' ? 'text-amber-600' :
              stockStatus.type === 'info' ? 'text-blue-600' :
              'text-green-600'
            }`}>{assignedStock} / {totalStock}</span>
          </div>
        </div>
      )}

      {/* Unassigned stock card (stock on default variant that needs to be distributed) */}
      {enabled && unassignedStock > 0 && namedVariants.length > 0 && (
        <div className="p-3 rounded-xl border border-amber-300 bg-amber-50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-200/70 flex items-center justify-center shrink-0">
            <i className="ri-stack-line text-amber-700 text-lg"></i>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900">
              {unassignedStock} {unassignedStock === 1 ? 'unidad sin distribuir' : 'unidades sin distribuir'}
            </p>
            <p className="text-xs text-gray-600">
              Stock original del producto. Asignalo entre las variantes para que pueda venderse.
            </p>
          </div>
          <button
            type="button"
            onClick={openDistributeModal}
            className="px-3 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 cursor-pointer text-xs font-semibold shrink-0"
          >
            Distribuir
          </button>
        </div>
      )}

      {/* Content when enabled */}
      {enabled && (
        <>
          {/* Variant count + New button */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">
              {namedVariants.length} variante{namedVariants.length !== 1 ? 's' : ''}
              <span className="text-gray-400 text-xs ml-1">{namedVariants.length}/{MAX_VARIANTS}</span>
            </p>
            {namedVariants.length < MAX_VARIANTS && !showNewForm && (
              <button
                type="button"
                onClick={() => setShowNewForm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 cursor-pointer text-xs font-semibold"
              >
                <i className="ri-add-line"></i>
                Nueva variante
              </button>
            )}
          </div>

          {/* Variant list */}
          {loading ? (
            <div className="flex justify-center py-6">
              <i className="ri-loader-4-line animate-spin text-2xl text-gray-400"></i>
            </div>
          ) : namedVariants.length === 0 && !showNewForm ? (
            <div className="text-center py-8 border border-dashed border-gray-200 rounded-xl">
              <i className="ri-layout-grid-line text-3xl text-gray-300"></i>
              <p className="text-sm font-semibold text-gray-600 mt-2">Agregá tu primera variante</p>
              <p className="text-xs text-gray-400 mt-0.5">Cada variante tiene su propio stock, SKU y código de barras.</p>
              <button
                type="button"
                onClick={() => setShowNewForm(true)}
                className="mt-3 flex items-center gap-1.5 mx-auto px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 cursor-pointer text-sm font-semibold"
              >
                <i className="ri-add-line"></i>
                Nueva variante
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {namedVariants.map(v => (
                <div key={v.id} className="flex items-center gap-3 border border-gray-200 rounded-lg px-3 py-2.5">
                  {editingId === v.id ? (
                    // Editing mode
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                        placeholder="Nombre de variante *"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-400"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={editForm.sku}
                          onChange={e => setEditForm({ ...editForm, sku: e.target.value })}
                          placeholder="SKU (opcional)"
                          className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                        />
                        <input
                          type="text"
                          value={editForm.barcode}
                          onChange={e => setEditForm({ ...editForm, barcode: e.target.value })}
                          placeholder="Cód. barras (opcional)"
                          className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer">Cancelar</button>
                        <button type="button" onClick={handleSaveEdit} disabled={saving} className="px-3 py-1.5 text-xs bg-brand-500 text-white rounded-lg hover:bg-brand-600 cursor-pointer disabled:opacity-50">Guardar</button>
                      </div>
                    </div>
                  ) : (
                    // Display mode
                    <>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold shrink-0">
                        {v.stock} uds
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{v.name || 'Sin nombre'}</p>
                        {v.price != null && <p className="text-xs text-gray-400">precio: ${Number(v.price).toLocaleString('es-AR')}</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button type="button" onClick={() => handleStartEdit(v)} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg cursor-pointer">
                          <i className="ri-edit-line text-sm"></i>
                        </button>
                        <button type="button" onClick={() => handleDeleteVariant(v.id)} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer">
                          <i className="ri-delete-bin-line text-sm"></i>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* New variant form */}
          {showNewForm && (
            <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-800">Nueva variante</h4>
                <button type="button" onClick={() => setShowNewForm(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                  <i className="ri-close-line text-lg"></i>
                </button>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Nombre de variante <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newVariant.name}
                  onChange={e => setNewVariant({ ...newVariant, name: e.target.value })}
                  placeholder="Ej: Talle M / Rojo, XL Azul, 500ml..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">SKU <span className="text-gray-400">(opcional)</span></label>
                  <input
                    type="text"
                    value={newVariant.sku}
                    onChange={e => setNewVariant({ ...newVariant, sku: e.target.value })}
                    placeholder="PROD-M-ROJO"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Cód. barras <span className="text-gray-400">(opcional)</span></label>
                  <input
                    type="text"
                    value={newVariant.barcode}
                    onChange={e => setNewVariant({ ...newVariant, barcode: e.target.value })}
                    placeholder="7790001234567"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowNewForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer">Cancelar</button>
                <button
                  type="button"
                  onClick={handleCreateVariant}
                  disabled={!newVariant.name.trim() || saving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 cursor-pointer text-sm font-semibold disabled:opacity-50"
                >
                  <i className="ri-add-line"></i>
                  Crear variante
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Content when disabled */}
      {!enabled && (
        <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl">
          <i className="ri-layout-grid-line text-3xl text-gray-300"></i>
          <p className="text-xs text-gray-400 mt-2">Activá el toggle para crear variantes con stock, SKU y código de barras independiente.</p>
        </div>
      )}

      {/* Distribute stock modal */}
      {showDistributeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-5 pb-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-gray-900">Distribuir stock</h3>
                <button
                  type="button"
                  onClick={() => setShowDistributeModal(false)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer w-8 h-8 flex items-center justify-center"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Indicá cuántas unidades del stock original asignar a cada variante.
              </p>
            </div>

            <div className="px-5 pb-3 space-y-2 max-h-80 overflow-y-auto">
              {namedVariants.map(v => (
                <div key={v.id} className="flex items-center gap-3 border border-gray-200 rounded-lg px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{v.name || 'Sin nombre'}</p>
                    <p className="text-xs text-gray-400">actual: {v.stock} uds</p>
                  </div>
                  <input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={distributeValues[v.id] ?? ''}
                    onChange={e => setDistributeValues({ ...distributeValues, [v.id]: e.target.value })}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-brand-400"
                  />
                </div>
              ))}
            </div>

            <div className="px-5 pb-3">
              <div className={`p-3 rounded-lg text-sm ${
                distributeExceeds
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-gray-50 text-gray-700 border border-gray-200'
              }`}>
                <div className="flex justify-between">
                  <span>A distribuir:</span>
                  <span className="font-semibold">{totalPending}</span>
                </div>
                <div className="flex justify-between">
                  <span>Disponible:</span>
                  <span className="font-semibold">{unassignedStock}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 mt-1 pt-1">
                  <span>Restante:</span>
                  <span className={`font-semibold ${distributeExceeds ? 'text-red-600' : 'text-gray-900'}`}>
                    {unassignedStock - totalPending}
                  </span>
                </div>
                {distributeExceeds && (
                  <p className="text-xs text-red-600 mt-1">No podés distribuir más de lo disponible.</p>
                )}
              </div>
            </div>

            <div className="p-5 pt-0 flex gap-3">
              <button
                type="button"
                onClick={() => setShowDistributeModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 cursor-pointer text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDistribute}
                disabled={saving || totalPending <= 0 || distributeExceeds}
                className="flex-1 px-4 py-2.5 bg-brand-500 text-white rounded-xl hover:bg-brand-600 cursor-pointer text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Distribuyendo...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate confirmation dialog */}
      {showDeactivateConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
              <i className="ri-error-warning-line text-2xl text-amber-500"></i>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Desactivar variantes</h3>
            <p className="text-sm text-gray-600 mb-5">
              El producto volverá a stock unificado en <span className="font-bold">{totalStock} unidades</span>. Las variantes quedan guardadas, pero no se usarán hasta reactivar el toggle.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeactivateConfirm(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 cursor-pointer text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeactivate}
                disabled={saving}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 cursor-pointer text-sm font-semibold disabled:opacity-50"
              >
                {saving ? 'Desactivando...' : 'Sí, desactivar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
