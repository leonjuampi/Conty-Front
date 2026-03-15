import { useState } from 'react';
import {
  createElaborationCost,
  updateElaborationCost,
  type ElaborationCost,
  type ElaborationCostItem,
  type ItemInput,
} from '../../../services/elaborationCosts.service';
import { listRawMaterials, type RawMaterial } from '../../../services/rawMaterials.service';
import { useEffect } from 'react';
import { calcularTotal } from './CostosTab';

interface Props {
  cost: ElaborationCost | null;
  allCosts: ElaborationCost[];
  onClose: () => void;
  onSaved: () => void;
}

interface Row {
  item_type: 'RAW_MATERIAL' | 'ELABORATION_COST';
  raw_material_id: number | null;
  sub_cost_id: number | null;
  formula: string;
}

function evaluarFormula(basePrice: number, formula: string): { resultado: number | null; error: string | null } {
  const f = formula.trim();
  if (!f) return { resultado: basePrice, error: null };
  const startsWithOp = /^[+\-*/]/.test(f);
  const expr = startsWithOp ? `${basePrice} ${f}` : f;
  try {
    if (!/^[\d\s+\-*/().]+$/.test(expr)) return { resultado: null, error: 'Fórmula inválida' };
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${expr})`)() as number;
    if (!isFinite(result)) return { resultado: null, error: 'División por cero' };
    return { resultado: Math.round(result * 100) / 100, error: null };
  } catch {
    return { resultado: null, error: 'Fórmula inválida' };
  }
}

function itemToRow(item: ElaborationCostItem): Row {
  return {
    item_type: item.item_type,
    raw_material_id: item.raw_material_id,
    sub_cost_id: item.sub_cost_id,
    formula: item.formula,
  };
}

export function EditCostModal({ cost, allCosts, onClose, onSaved }: Props) {
  const [name, setName] = useState(cost?.name ?? '');
  const [rows, setRows] = useState<Row[]>(cost ? cost.items.map(itemToRow) : []);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    listRawMaterials({ limit: 500 }).then((r) => setRawMaterials(r.items)).catch(() => {});
  }, []);

  // Other costs excluding the current one (to avoid self-reference)
  const otherCosts = allCosts.filter((c) => c.id !== cost?.id);

  const handleChangeRow = (index: number, field: keyof Row, value: string | number | null) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'item_type') {
      updated[index].raw_material_id = null;
      updated[index].sub_cost_id = null;
      updated[index].formula = '';
    }
    if (field === 'raw_material_id' || field === 'sub_cost_id') {
      updated[index].formula = '';
    }
    setRows(updated);
  };

  const handleAdd = () => {
    setRows([...rows, { item_type: 'RAW_MATERIAL', raw_material_id: null, sub_cost_id: null, formula: '' }]);
  };

  const handleRemove = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const totalCalculado = rows.reduce((acc, row) => {
    if (row.item_type === 'RAW_MATERIAL') {
      const rm = rawMaterials.find((m) => m.id === row.raw_material_id);
      if (!rm) return acc;
      const { resultado } = evaluarFormula(Number(rm.unit_price), row.formula);
      return acc + (resultado ?? 0);
    } else {
      const sub = allCosts.find((c) => c.id === row.sub_cost_id);
      if (!sub) return acc;
      return acc + calcularTotal(sub, allCosts);
    }
  }, 0);

  const handleSave = async () => {
    if (!name.trim()) { setError('El nombre es obligatorio'); return; }
    setSaving(true);
    setError('');
    try {
      const items: ItemInput[] = rows.map((r) => ({
        item_type: r.item_type,
        raw_material_id: r.raw_material_id,
        sub_cost_id: r.sub_cost_id,
        formula: r.formula,
      }));
      if (cost) {
        await updateElaborationCost(cost.id, { name: name.trim(), items });
      } else {
        await createElaborationCost({ name: name.trim(), items });
      }
      onSaved();
      onClose();
    } catch {
      setError('Error al guardar. Intentá nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex-1 mr-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del costo (ej: Pizza Muzzarella)"
              autoComplete="off"
              className="w-full bg-white/20 text-white placeholder-white/70 text-lg font-bold focus:outline-none rounded-lg px-3 py-1.5 focus:bg-white/30 transition-colors"
            />
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors w-8 h-8 flex items-center justify-center cursor-pointer shrink-0"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        {/* Column headers */}
        <div className="px-6 pt-4 pb-2 grid grid-cols-[120px_1fr_1fr_auto_auto] gap-3 items-center shrink-0">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</span>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ingrediente</span>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Costo / Fórmula</span>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide w-20 text-right">Resultado</span>
          <span className="w-8"></span>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-2">
          {rows.map((row, index) => {
            const isRaw = row.item_type === 'RAW_MATERIAL';
            const selectedRM = rawMaterials.find((m) => m.id === row.raw_material_id);
            const selectedSub = allCosts.find((c) => c.id === row.sub_cost_id);

            let resultado: number | null = null;
            let formulaError: string | null = null;

            if (isRaw && selectedRM) {
              const res = evaluarFormula(Number(selectedRM.unit_price), row.formula);
              resultado = res.resultado;
              formulaError = res.error;
            } else if (!isRaw && selectedSub) {
              resultado = calcularTotal(selectedSub, allCosts);
            }

            return (
              <div
                key={index}
                className="grid grid-cols-[120px_1fr_1fr_auto_auto] gap-3 items-start bg-gray-50 rounded-lg px-3 py-3 border border-gray-100"
              >
                {/* Tipo */}
                <div>
                  <select
                    value={row.item_type}
                    onChange={(e) => handleChangeRow(index, 'item_type', e.target.value)}
                    className="w-full px-2 py-2 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-[#E8650A] bg-white cursor-pointer"
                  >
                    <option value="RAW_MATERIAL">Mercadería</option>
                    <option value="ELABORATION_COST">Otro costo</option>
                  </select>
                </div>

                {/* Ingrediente */}
                <div>
                  {isRaw ? (
                    <>
                      <select
                        value={row.raw_material_id ?? ''}
                        onChange={(e) => handleChangeRow(index, 'raw_material_id', e.target.value ? Number(e.target.value) : null)}
                        className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#E8650A] bg-white cursor-pointer"
                      >
                        <option value="">— Seleccionar —</option>
                        {rawMaterials.map((rm) => (
                          <option key={rm.id} value={rm.id}>
                            {rm.name} (${Number(rm.unit_price).toLocaleString('es-AR')})
                          </option>
                        ))}
                      </select>
                      {selectedRM && (
                        <p className="text-xs text-gray-400 mt-1 pl-1">
                          Precio base: <span className="font-medium text-gray-600">${Number(selectedRM.unit_price).toLocaleString('es-AR')}</span>
                        </p>
                      )}
                    </>
                  ) : (
                    <select
                      value={row.sub_cost_id ?? ''}
                      onChange={(e) => handleChangeRow(index, 'sub_cost_id', e.target.value ? Number(e.target.value) : null)}
                      className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#E8650A] bg-white cursor-pointer"
                    >
                      <option value="">— Seleccionar —</option>
                      {otherCosts.map((c) => {
                        const t = calcularTotal(c, allCosts);
                        return (
                          <option key={c.id} value={c.id}>
                            {c.name} (${t.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>

                {/* Fórmula */}
                <div>
                  {isRaw ? (
                    <>
                      <input
                        type="text"
                        value={row.formula}
                        onChange={(e) => handleChangeRow(index, 'formula', e.target.value)}
                        disabled={!row.raw_material_id}
                        className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#E8650A] disabled:bg-gray-100 disabled:text-gray-400 font-mono"
                        placeholder={row.raw_material_id ? '/ 4  ó  * 0.5  ó  vacío' : '—'}
                      />
                      {row.raw_material_id && selectedRM && (
                        <p className="text-xs text-gray-400 mt-1 pl-1">
                          {row.formula
                            ? <><code className="bg-white px-1 rounded text-gray-600">{Number(selectedRM.unit_price).toLocaleString('es-AR')} {row.formula}</code></>
                            : 'Sin fórmula = precio completo'}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="px-2 py-2 text-xs text-gray-400 italic">
                      Se usa el total del costo seleccionado
                    </div>
                  )}
                </div>

                {/* Resultado */}
                <div className="w-20 text-right pt-2">
                  {formulaError ? (
                    <span className="text-red-500 text-xs font-medium">{formulaError}</span>
                  ) : resultado !== null ? (
                    <span className="text-[#E8650A] font-bold text-sm">
                      ${resultado.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </span>
                  ) : (
                    <span className="text-gray-300 text-sm">—</span>
                  )}
                </div>

                {/* Eliminar */}
                <div className="w-8 flex items-start justify-center pt-2">
                  <button
                    onClick={() => handleRemove(index)}
                    className="text-gray-400 hover:text-red-500 transition-colors w-6 h-6 flex items-center justify-center cursor-pointer"
                    title="Eliminar fila"
                  >
                    <i className="ri-delete-bin-line text-base"></i>
                  </button>
                </div>
              </div>
            );
          })}

          <button
            onClick={handleAdd}
            className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-[#E8650A] hover:text-[#E8650A] transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <i className="ri-add-line"></i>
            Agregar ingrediente
          </button>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 shrink-0">
          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="text-gray-500">Total calculado:</span>{' '}
              <span className="font-bold text-[#E8650A] text-base">
                ${totalCalculado.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors text-sm whitespace-nowrap cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-[#E8650A] text-white rounded-md hover:bg-[#d15809] transition-colors text-sm font-medium whitespace-nowrap cursor-pointer disabled:opacity-60"
              >
                {saving ? <><i className="ri-loader-4-line animate-spin mr-1"></i>Guardando...</> : (cost ? 'Guardar Cambios' : 'Crear Costo')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
