import { useState, useEffect } from 'react';
import {
  listElaborationCosts,
  deleteElaborationCost,
  type ElaborationCost,
} from '../../../services/elaborationCosts.service';
import { EditCostModal } from './EditCostModal';

function evaluarFormula(basePrice: number, formula: string): number | null {
  const f = formula.trim();
  if (!f) return basePrice;
  const startsWithOp = /^[+\-*/]/.test(f);
  const expr = startsWithOp ? `${basePrice} ${f}` : f;
  try {
    if (!/^[\d\s+\-*/().]+$/.test(expr)) return null;
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${expr})`)() as number;
    if (!isFinite(result)) return null;
    return Math.round(result * 100) / 100;
  } catch {
    return null;
  }
}

export function calcularTotal(cost: ElaborationCost, allCosts: ElaborationCost[]): number {
  return cost.items.reduce((sum, item) => {
    if (item.item_type === 'RAW_MATERIAL') {
      const price = Number(item.raw_material_price ?? 0);
      const result = evaluarFormula(price, item.formula);
      return sum + (result ?? 0);
    } else {
      // ELABORATION_COST: use total of sub-cost (no formula applied)
      const subCost = allCosts.find((c) => c.id === item.sub_cost_id);
      if (!subCost) return sum;
      return sum + calcularTotal(subCost, allCosts);
    }
  }, 0);
}

export function CostosTab() {
  const [costs, setCosts] = useState<ElaborationCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<ElaborationCost | null>(null);
  const [isNewModal, setIsNewModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ElaborationCost | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCosts = async () => {
    setLoading(true);
    try {
      const data = await listElaborationCosts();
      setCosts(data);
    } catch {
      setCosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCosts(); }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteElaborationCost(deleteTarget.id);
      setDeleteTarget(null);
      await fetchCosts();
    } catch {
      alert('Error al eliminar');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Costos de Elaboración</h2>
          <p className="text-sm text-gray-600 mt-1">Recetas con ingredientes y fórmulas de costo</p>
        </div>
        <button
          onClick={() => { setEditTarget(null); setIsNewModal(true); }}
          className="bg-[#E8650A] text-white px-4 py-2 rounded-lg hover:bg-[#d15809] transition-colors flex items-center gap-2 whitespace-nowrap"
        >
          <i className="ri-add-line"></i>
          Nuevo Costo
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <i className="ri-loader-4-line animate-spin text-3xl text-[#E8650A]"></i>
        </div>
      ) : costs.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col items-center justify-center py-16 text-center">
          <i className="ri-calculator-line text-4xl text-gray-300 mb-3"></i>
          <p className="text-gray-500 text-sm">No hay costos de elaboración cargados.</p>
          <p className="text-gray-400 text-xs mt-1">Usá el botón "Nuevo Costo" para empezar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {costs.map((cost) => {
            const total = calcularTotal(cost, costs);
            return (
              <div
                key={cost.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
                  <h3 className="font-bold text-white text-base truncate mr-2">{cost.name}</h3>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => { setEditTarget(cost); setIsNewModal(true); }}
                      className="text-gray-300 hover:text-white transition-colors w-8 h-8 flex items-center justify-center"
                      title="Editar"
                    >
                      <i className="ri-pencil-line text-lg"></i>
                    </button>
                    <button
                      onClick={() => setDeleteTarget(cost)}
                      className="text-gray-300 hover:text-red-400 transition-colors w-8 h-8 flex items-center justify-center"
                      title="Eliminar"
                    >
                      <i className="ri-delete-bin-line text-lg"></i>
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  {cost.items.length === 0 ? (
                    <p className="text-xs text-gray-400 italic text-center py-4">Sin ingredientes</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 text-gray-600 font-semibold text-xs">Ingrediente</th>
                          <th className="text-right py-2 text-gray-600 font-semibold text-xs">Costo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cost.items.map((item) => {
                          let label = '';
                          let value: number | null = null;
                          if (item.item_type === 'RAW_MATERIAL') {
                            label = item.raw_material_name ?? '—';
                            const price = Number(item.raw_material_price ?? 0);
                            value = evaluarFormula(price, item.formula);
                          } else {
                            const sub = costs.find((c) => c.id === item.sub_cost_id);
                            label = item.sub_cost_name ?? '—';
                            value = sub ? calcularTotal(sub, costs) : null;
                          }
                          return (
                            <tr key={item.id} className="border-b border-gray-100 last:border-0">
                              <td className="py-2 text-gray-800 text-xs">{label}</td>
                              <td className="py-2 text-right text-gray-800 text-xs">
                                {value !== null
                                  ? `$${value.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
                                  : '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}

                  <div className="mt-4 pt-3 border-t-2 border-gray-300 flex items-center justify-between">
                    <span className="font-bold text-gray-900 text-sm">Total</span>
                    <span className="font-bold text-[#E8650A] text-lg">
                      ${total.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isNewModal && (
        <EditCostModal
          cost={editTarget}
          allCosts={costs}
          onClose={() => { setIsNewModal(false); setEditTarget(null); }}
          onSaved={fetchCosts}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 flex items-center justify-center bg-red-100 rounded-full shrink-0">
                <i className="ri-delete-bin-line text-red-600 text-xl"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Eliminar costo</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              ¿Estás seguro que querés eliminar <strong>{deleteTarget.name}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60 cursor-pointer"
              >
                {deleting ? <><i className="ri-loader-4-line animate-spin mr-1"></i>Eliminando...</> : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
