import { useState, useEffect, useCallback } from 'react';
import {
  listInventorySessions,
  createInventorySession,
  getInventorySession,
  countInventoryItem,
  approveInventorySession,
  cancelInventorySession,
  type InventorySession,
  type InventorySessionDetail,
} from '../../../services/stock.service';
import { listBranches, type Branch } from '../../../services/branches.service';
import { type CurrentUser } from '../../../context/AuthContext';
import { ROLE_IDS } from '../../../utils/roles';

interface Props {
  currentUser: CurrentUser | null;
}

function sessionStatusBadge(status: string) {
  switch (status) {
    case 'OPEN': return 'bg-blue-100 text-blue-700';
    case 'APPROVED': return 'bg-green-100 text-green-700';
    case 'CANCELLED': return 'bg-gray-100 text-gray-600';
    default: return 'bg-gray-100 text-gray-600';
  }
}

function sessionStatusLabel(status: string) {
  switch (status) {
    case 'OPEN': return 'Abierto';
    case 'APPROVED': return 'Aprobado';
    case 'CANCELLED': return 'Cancelado';
    default: return status;
  }
}

function diffColor(diff: number | null) {
  if (diff === null) return 'text-gray-400';
  if (diff === 0) return 'text-green-600';
  if (diff < 0) return 'text-red-600';
  return 'text-orange-600';
}

export default function InventoryTab({ currentUser }: Props) {
  const [sessions, setSessions] = useState<InventorySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Session detail
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [sessionDetail, setSessionDetail] = useState<InventorySessionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [countedValues, setCountedValues] = useState<Record<number, string>>({});
  const [actionLoading, setActionLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // New session modal
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [newBranchId, setNewBranchId] = useState<number | ''>('');
  const [onlyDifferences, setOnlyDifferences] = useState(false);

  const isOwner = currentUser?.roleId === ROLE_IDS.OWNER || currentUser?.roleId === ROLE_IDS.ADMIN;

  const fetchSessions = useCallback(() => {
    setLoading(true);
    setError(null);
    listInventorySessions({ branchId: currentUser?.branchId ?? undefined })
      .then(res => setSessions(res.items ?? []))
      .catch(err => setError(err?.response?.data?.message ?? 'Error al cargar sesiones'))
      .finally(() => setLoading(false));
  }, [currentUser?.branchId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    if (showModal) {
      listBranches()
        .then(res => {
          setBranches(res.items);
          if (currentUser?.branchId) setNewBranchId(currentUser.branchId);
          else if (res.items.length === 1) setNewBranchId(res.items[0].id);
        })
        .catch(() => {});
    }
  }, [showModal, currentUser?.branchId]);

  const handleExpandSession = async (session: InventorySession) => {
    if (expandedId === session.id) {
      setExpandedId(null);
      setSessionDetail(null);
      setDetailError(null);
      return;
    }
    setExpandedId(session.id);
    setDetailLoading(true);
    setDetailError(null);
    try {
      const detail = await getInventorySession(session.id);
      setSessionDetail(detail);
      // Initialize counted values from existing data
      const initial: Record<number, string> = {};
      for (const item of detail.items) {
        initial[item.variantId] = item.countedQty !== null ? String(item.countedQty) : '';
      }
      setCountedValues(initial);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setDetailError(e?.response?.data?.message ?? 'Error al cargar detalle');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCountBlur = async (sessionId: number, variantId: number, value: string) => {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) return;
    try {
      await countInventoryItem(sessionId, { variantId, countedQty: parsed });
      // Refresh detail
      const detail = await getInventorySession(sessionId);
      setSessionDetail(detail);
      const updated: Record<number, string> = {};
      for (const item of detail.items) {
        updated[item.variantId] = item.countedQty !== null ? String(item.countedQty) : '';
      }
      setCountedValues(updated);
    } catch {
      // silently fail on individual count
    }
  };

  const handleApprove = async (sessionId: number) => {
    setActionLoading(true);
    setDetailError(null);
    try {
      await approveInventorySession(sessionId);
      fetchSessions();
      setExpandedId(null);
      setSessionDetail(null);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setDetailError(e?.response?.data?.message ?? 'Error al aprobar sesión');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (sessionId: number) => {
    setActionLoading(true);
    setDetailError(null);
    try {
      await cancelInventorySession(sessionId);
      fetchSessions();
      setExpandedId(null);
      setSessionDetail(null);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setDetailError(e?.response?.data?.message ?? 'Error al cancelar sesión');
    } finally {
      setActionLoading(false);
    }
  };

  const openModal = () => {
    setShowModal(true);
    setModalError(null);
    setOnlyDifferences(false);
    setNewBranchId(currentUser?.branchId ?? '');
  };

  const handleCreateSession = async () => {
    if (!newBranchId) { setModalError('Selecciona una sucursal'); return; }
    setModalLoading(true);
    setModalError(null);
    try {
      await createInventorySession({ branchId: Number(newBranchId), onlyDifferences });
      setShowModal(false);
      fetchSessions();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setModalError(e?.response?.data?.message ?? 'Error al crear sesión');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-end">
        <button
          onClick={openModal}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <i className="ri-add-line"></i>
          Nuevo Conteo
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Sessions table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-10">
            <i className="ri-loader-4-line animate-spin text-orange-500 text-3xl"></i>
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <i className="ri-clipboard-check-line text-4xl block mb-2"></i>
            <p className="text-sm">No hay sesiones de inventario</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Sucursal</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-center">Items</th>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sessions.map(s => (
                  <>
                    <tr key={s.id} className="hover:bg-orange-50/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">#{s.id}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{s.branchName}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${sessionStatusBadge(s.status)}`}>
                          {sessionStatusLabel(s.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">{s.itemCount ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {new Date(s.createdAt).toLocaleDateString('es-AR')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleExpandSession(s)}
                          className="text-xs px-3 py-1 border border-orange-300 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        >
                          {expandedId === s.id ? 'Cerrar' : 'Ver'}
                        </button>
                      </td>
                    </tr>
                    {expandedId === s.id && (
                      <tr key={`${s.id}-detail`} className="bg-orange-50/20">
                        <td colSpan={6} className="px-6 py-4">
                          {detailLoading ? (
                            <div className="flex justify-center py-4">
                              <i className="ri-loader-4-line animate-spin text-orange-500 text-xl"></i>
                            </div>
                          ) : (
                            <>
                              {detailError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm mb-3">
                                  {detailError}
                                </div>
                              )}
                              {sessionDetail && (
                                <>
                                  <div className="overflow-x-auto mb-4">
                                    <table className="w-full text-sm">
                                      <thead>
                                        <tr className="text-xs text-gray-500 uppercase border-b border-gray-200">
                                          <th className="pb-2 text-left font-medium">Producto</th>
                                          <th className="pb-2 text-left font-medium">SKU</th>
                                          <th className="pb-2 text-right font-medium">Stock Esperado</th>
                                          <th className="pb-2 text-right font-medium">Contado</th>
                                          <th className="pb-2 text-right font-medium">Diferencia</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-100">
                                        {sessionDetail.items.map(item => {
                                          const counted = countedValues[item.variantId] ?? '';
                                          const diff = counted !== '' && !isNaN(Number(counted))
                                            ? Number(counted) - item.expectedQty
                                            : item.difference;
                                          return (
                                            <tr key={item.variantId} className="hover:bg-white/60">
                                              <td className="py-2 text-gray-800 font-medium">{item.productName}</td>
                                              <td className="py-2 text-gray-400 font-mono text-xs">{item.sku}</td>
                                              <td className="py-2 text-right text-gray-600">{item.expectedQty}</td>
                                              <td className="py-2 text-right">
                                                {s.status === 'OPEN' ? (
                                                  <input
                                                    type="number"
                                                    value={counted}
                                                    onChange={e => setCountedValues(prev => ({
                                                      ...prev,
                                                      [item.variantId]: e.target.value,
                                                    }))}
                                                    onBlur={e => handleCountBlur(s.id, item.variantId, e.target.value)}
                                                    className="w-20 border border-gray-300 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-orange-400"
                                                    placeholder="—"
                                                  />
                                                ) : (
                                                  <span className="text-gray-700">{item.countedQty ?? '—'}</span>
                                                )}
                                              </td>
                                              <td className={`py-2 text-right font-semibold ${diffColor(diff)}`}>
                                                {diff !== null ? (diff >= 0 ? `+${diff}` : String(diff)) : '—'}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>

                                  {s.status === 'OPEN' && (
                                    <div className="flex gap-3 justify-end">
                                      <button
                                        onClick={() => handleCancel(s.id)}
                                        disabled={actionLoading}
                                        className="px-4 py-2 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 flex items-center gap-2 disabled:opacity-60"
                                      >
                                        {actionLoading && <i className="ri-loader-4-line animate-spin"></i>}
                                        Cancelar conteo
                                      </button>
                                      {isOwner && (
                                        <button
                                          onClick={() => handleApprove(s.id)}
                                          disabled={actionLoading}
                                          className="px-4 py-2 text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-60"
                                        >
                                          {actionLoading && <i className="ri-loader-4-line animate-spin"></i>}
                                          Aprobar inventario
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New session modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 text-lg">Nuevo Conteo de Inventario</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {modalError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal</label>
                <select
                  value={newBranchId}
                  onChange={e => setNewBranchId(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <option value="">Seleccionar sucursal</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyDifferences}
                  onChange={e => setOnlyDifferences(e.target.checked)}
                  className="w-4 h-4 accent-orange-500"
                />
                <span className="text-sm text-gray-700">Solo mostrar diferencias</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateSession}
                disabled={modalLoading}
                className="px-4 py-2 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-60"
              >
                {modalLoading && <i className="ri-loader-4-line animate-spin"></i>}
                Iniciar Conteo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
