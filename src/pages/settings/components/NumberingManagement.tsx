import { useState, useEffect } from 'react';
import { listNumberingRules, upsertNumberingRule, deleteNumberingRule, type NumberingRule } from '../../../services/numbering.service';

const DOC_TYPE_LABELS: Record<string, string> = {
  TICKET: 'Ticket / Comprobante',
  INVOICE_A: 'Factura A',
  INVOICE_B: 'Factura B',
  INVOICE_C: 'Factura C',
  RECEIPT: 'Recibo',
  QUOTE: 'Presupuesto',
  ORDER: 'Pedido',
};

const RESET_LABELS: Record<string, string> = { NEVER: 'Nunca', YEARLY: 'Anual', MONTHLY: 'Mensual' };

const emptyForm = {
  docType: 'TICKET',
  customDocType: '',
  format: 'TK-{NUM}',
  nextNumber: 1,
  padding: 8,
  resetPolicy: 'NEVER' as NumberingRule['resetPolicy'],
};

export default function NumberingManagement() {
  const [rules, setRules] = useState<NumberingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<NumberingRule | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [saved, setSaved] = useState(false);
  const [deleteDocType, setDeleteDocType] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await listNumberingRules();
      setRules(res.items);
    } catch {
      setRules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRules(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (r: NumberingRule) => {
    setEditing(r);
    setForm({ docType: r.docType in DOC_TYPE_LABELS ? r.docType : 'custom', customDocType: r.docType in DOC_TYPE_LABELS ? '' : r.docType, format: r.format, nextNumber: r.nextNumber, padding: r.padding, resetPolicy: r.resetPolicy });
    setFormError('');
    setShowModal(true);
  };

  const resolvedDocType = form.docType === 'custom' ? form.customDocType.trim() : form.docType;

  const handleSave = async () => {
    if (!resolvedDocType) return setFormError('El tipo de documento es obligatorio');
    if (!form.format.trim()) return setFormError('El formato es obligatorio');
    setSaving(true);
    setFormError('');
    try {
      await upsertNumberingRule({
        docType: resolvedDocType,
        format: form.format.trim(),
        nextNumber: form.nextNumber,
        padding: form.padding,
        resetPolicy: form.resetPolicy,
      });
      setShowModal(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      await fetchRules();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(msg || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDocType) return;
    setDeleting(true);
    try {
      await deleteNumberingRule(deleteDocType);
      setDeleteDocType(null);
      await fetchRules();
    } catch {
      setDeleteDocType(null);
    } finally {
      setDeleting(false);
    }
  };

  const formatPreview = (format: string, padding: number) => {
    return format
      .replace('{PV}', '0001')
      .replace('{NUM}', String(1).padStart(padding, '0'));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-gray-800">Numeracion de Documentos</h2>
          <p className="text-xs md:text-sm text-gray-500 mt-1">Configurá el formato y numeración de facturas y documentos</p>
        </div>
        <button onClick={openCreate} className="flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-3 rounded-lg font-semibold text-sm transition-all whitespace-nowrap cursor-pointer min-h-[48px] w-full sm:w-auto">
          <i className="ri-add-line"></i>
          Nueva Regla
        </button>
      </div>

      {saved && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          <i className="ri-checkbox-circle-line text-lg"></i>
          Guardado correctamente
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-xs text-blue-800">
          <strong>Variables de formato:</strong> <code className="bg-blue-100 px-1 rounded">{'{PV}'}</code> = código punto de venta, <code className="bg-blue-100 px-1 rounded">{'{NUM}'}</code> = número correlativo con padding.
          Ejemplo: <code className="bg-blue-100 px-1 rounded">FA-{'{PV}'}-{'{NUM}'}</code> → <strong>FA-0001-00000001</strong>
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <i className="ri-loader-4-line animate-spin text-3xl text-brand-500"></i>
        </div>
      ) : rules.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">No hay reglas de numeración. Crea la primera.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Tipo</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Formato</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Preview</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Próximo N°</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Reinicio</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rules.map(r => (
                <tr key={r.docType} className="hover:bg-brand-50/40 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{DOC_TYPE_LABELS[r.docType] || r.docType}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{r.format}</td>
                  <td className="px-4 py-3 font-mono text-xs text-brand-700 font-semibold">{formatPreview(r.format, r.padding)}</td>
                  <td className="px-4 py-3 text-gray-600 text-center">{r.nextNumber}</td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                      {RESET_LABELS[r.resetPolicy] || r.resetPolicy}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(r)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-brand-100 text-brand-600 cursor-pointer">
                        <i className="ri-edit-line"></i>
                      </button>
                      <button onClick={() => setDeleteDocType(r.docType)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-100 text-red-500 cursor-pointer">
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-white w-full h-full md:h-auto md:rounded-2xl shadow-2xl md:max-w-lg overflow-y-auto">
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-gray-800">{editing ? 'Editar Regla' : 'Nueva Regla de Numeración'}</h3>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 cursor-pointer">
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            <div className="p-4 md:p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tipo de Documento *</label>
                <select value={form.docType} onChange={e => setForm({ ...form, docType: e.target.value })} disabled={!!editing} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm min-h-[48px] disabled:bg-gray-100">
                  {Object.entries(DOC_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  <option value="custom">Personalizado...</option>
                </select>
                {form.docType === 'custom' && (
                  <input type="text" value={form.customDocType} onChange={e => setForm({ ...form, customDocType: e.target.value.toUpperCase() })} placeholder="Ej: DELIVERY_ORDER" className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm min-h-[48px] font-mono" />
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Formato *</label>
                <input type="text" value={form.format} onChange={e => setForm({ ...form, format: e.target.value })} placeholder="Ej: FA-{PV}-{NUM}" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm min-h-[48px] font-mono" />
                {form.format && (
                  <p className="text-xs text-gray-500 mt-1">
                    Preview: <span className="font-mono font-semibold text-brand-700">{formatPreview(form.format, form.padding)}</span>
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Próximo número</label>
                  <input type="number" min="1" value={form.nextNumber} onChange={e => setForm({ ...form, nextNumber: parseInt(e.target.value) || 1 })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm min-h-[48px]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Padding (dígitos)</label>
                  <input type="number" min="1" max="12" value={form.padding} onChange={e => setForm({ ...form, padding: parseInt(e.target.value) || 8 })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm min-h-[48px]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Política de reinicio</label>
                <select value={form.resetPolicy} onChange={e => setForm({ ...form, resetPolicy: e.target.value as NumberingRule['resetPolicy'] })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm min-h-[48px]">
                  <option value="NEVER">Nunca reiniciar</option>
                  <option value="YEARLY">Reiniciar anualmente</option>
                  <option value="MONTHLY">Reiniciar mensualmente</option>
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
                {saving ? <><i className="ri-loader-4-line animate-spin mr-1"></i>Guardando...</> : (editing ? 'Guardar Cambios' : 'Crear Regla')}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteDocType !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-red-100">
                <i className="ri-delete-bin-line text-red-500 text-lg"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-800">Eliminar regla</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">¿Estás seguro que deseas eliminar la regla de <strong>{DOC_TYPE_LABELS[deleteDocType] || deleteDocType}</strong>?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteDocType(null)} className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold text-sm cursor-pointer hover:bg-gray-50">Cancelar</button>
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
