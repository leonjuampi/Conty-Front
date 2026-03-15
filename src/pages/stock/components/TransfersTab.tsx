import { useState, useEffect, useCallback } from 'react';
import {
  listTransfers,
  createTransfer,
  receiveTransfer,
  getTransfer,
  searchStockProducts,
  type StockTransfer,
  type StockProduct,
} from '../../../services/stock.service';
import { listBranches, type Branch } from '../../../services/branches.service';
import { type CurrentUser } from '../../../context/AuthContext';

interface Props {
  currentUser: CurrentUser | null;
}

interface TransferItemRow {
  product: StockProduct;
  quantity: number;
}

export default function TransfersTab({ currentUser }: Props) {
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [expandedDetail, setExpandedDetail] = useState<StockTransfer | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [originBranchId, setOriginBranchId] = useState<number | ''>('');
  const [destBranchId, setDestBranchId] = useState<number | ''>('');
  const [transferNote, setTransferNote] = useState('');
  const [items, setItems] = useState<TransferItemRow[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState<StockProduct[]>([]);
  const [productSearchLoading, setProductSearchLoading] = useState(false);
  const [itemQty, setItemQty] = useState<number>(1);

  // Receive confirmation
  const [receivingRef, setReceivingRef] = useState<string | null>(null);
  const [receiveLoading, setReceiveLoading] = useState(false);

  const fetchTransfers = useCallback(() => {
    setLoading(true);
    setError(null);
    listTransfers({ branchId: currentUser?.branchId ?? undefined })
      .then(res => setTransfers(res.items ?? []))
      .catch(err => setError(err?.response?.data?.message ?? 'Error al cargar transferencias'))
      .finally(() => setLoading(false));
  }, [currentUser?.branchId]);

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

  useEffect(() => {
    if (showModal) {
      listBranches()
        .then(res => {
          setBranches(res.items);
          if (currentUser?.branchId) setOriginBranchId(currentUser.branchId);
          else if (res.items.length === 1) setOriginBranchId(res.items[0].id);
        })
        .catch(() => {});
    }
  }, [showModal, currentUser?.branchId]);

  // Product search
  useEffect(() => {
    if (!productSearch.trim()) { setProductResults([]); return; }
    setProductSearchLoading(true);
    const t = setTimeout(() => {
      searchStockProducts({ q: productSearch, branchId: originBranchId || undefined })
        .then(res => setProductResults(res.items ?? []))
        .catch(() => setProductResults([]))
        .finally(() => setProductSearchLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [productSearch, originBranchId]);

  const handleAddItem = (product: StockProduct) => {
    if (items.find(i => i.product.variantId === product.variantId)) {
      setProductSearch('');
      setProductResults([]);
      return;
    }
    setItems(prev => [...prev, { product, quantity: itemQty }]);
    setProductSearch('');
    setProductResults([]);
    setItemQty(1);
  };

  const handleRemoveItem = (variantId: number) => {
    setItems(prev => prev.filter(i => i.product.variantId !== variantId));
  };

  const handleItemQtyChange = (variantId: number, qty: number) => {
    setItems(prev => prev.map(i => i.product.variantId === variantId ? { ...i, quantity: qty } : i));
  };

  const openModal = () => {
    setShowModal(true);
    setModalError(null);
    setOriginBranchId(currentUser?.branchId ?? '');
    setDestBranchId('');
    setTransferNote('');
    setItems([]);
    setProductSearch('');
    setProductResults([]);
    setItemQty(1);
  };

  const handleSubmit = async () => {
    if (!originBranchId) { setModalError('Selecciona sucursal de origen'); return; }
    if (!destBranchId) { setModalError('Selecciona sucursal de destino'); return; }
    if (originBranchId === destBranchId) { setModalError('Origen y destino deben ser distintos'); return; }
    if (items.length === 0) { setModalError('Agrega al menos un producto'); return; }
    setModalLoading(true);
    setModalError(null);
    try {
      await createTransfer({
        originBranchId: Number(originBranchId),
        destBranchId: Number(destBranchId),
        items: items.map(i => ({ variant_id: i.product.variantId, quantity: i.quantity })),
        note: transferNote || undefined,
      });
      setShowModal(false);
      fetchTransfers();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setModalError(e?.response?.data?.message ?? 'Error al crear transferencia');
    } finally {
      setModalLoading(false);
    }
  };

  const handleReceive = async (ref: string) => {
    setReceiveLoading(true);
    try {
      await receiveTransfer(ref, { branchId: currentUser?.branchId ?? undefined });
      setReceivingRef(null);
      fetchTransfers();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message ?? 'Error al recibir transferencia');
    } finally {
      setReceiveLoading(false);
    }
  };

  const handleExpandRow = async (transfer: StockTransfer) => {
    if (expandedId === transfer.id) {
      setExpandedId(null);
      setExpandedDetail(null);
      return;
    }
    setExpandedId(transfer.id);
    setDetailLoading(true);
    try {
      const detail = await getTransfer(transfer.id);
      setExpandedDetail(detail);
    } catch {
      setExpandedDetail(transfer);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header actions */}
      <div className="flex justify-end">
        <button
          onClick={openModal}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <i className="ri-add-line"></i>
          Nueva Transferencia
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-10">
            <i className="ri-loader-4-line animate-spin text-orange-500 text-3xl"></i>
          </div>
        ) : transfers.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <i className="ri-truck-line text-4xl block mb-2"></i>
            <p className="text-sm">No hay transferencias para mostrar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">Ref</th>
                  <th className="px-4 py-3 text-left">Origen → Destino</th>
                  <th className="px-4 py-3 text-center">Items</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transfers.map(t => (
                  <>
                    <tr
                      key={t.id}
                      className="hover:bg-orange-50/40 transition-colors cursor-pointer"
                      onClick={() => handleExpandRow(t)}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{t.transferRef}</td>
                      <td className="px-4 py-3 text-gray-800">
                        <span className="font-medium">{t.originBranchName}</span>
                        <i className="ri-arrow-right-line mx-2 text-gray-400"></i>
                        <span className="font-medium">{t.destBranchName}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">{t.items?.length ?? 0}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          t.status === 'RECEIVED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {t.status === 'RECEIVED' ? 'Recibida' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                        {new Date(t.createdAt).toLocaleDateString('es-AR')}
                      </td>
                      <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                        {t.status === 'PENDING' && (
                          <button
                            onClick={() => setReceivingRef(t.transferRef)}
                            className="text-xs px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                          >
                            Recibir
                          </button>
                        )}
                      </td>
                    </tr>
                    {expandedId === t.id && (
                      <tr key={`${t.id}-detail`} className="bg-orange-50/20">
                        <td colSpan={6} className="px-6 py-4">
                          {detailLoading ? (
                            <div className="flex justify-center py-4">
                              <i className="ri-loader-4-line animate-spin text-orange-500 text-xl"></i>
                            </div>
                          ) : expandedDetail ? (
                            <div>
                              <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Detalle de items</p>
                              {expandedDetail.note && (
                                <p className="text-xs text-gray-500 mb-2">Nota: {expandedDetail.note}</p>
                              )}
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-gray-500">
                                    <th className="text-left py-1 font-medium">Producto</th>
                                    <th className="text-left py-1 font-medium">SKU</th>
                                    <th className="text-right py-1 font-medium">Cantidad</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {(expandedDetail.items ?? []).map((item, idx) => (
                                    <tr key={idx}>
                                      <td className="py-1 text-gray-800">{item.productName ?? `Variante ${item.variant_id}`}</td>
                                      <td className="py-1 text-gray-400 font-mono">{item.sku ?? '—'}</td>
                                      <td className="py-1 text-right font-semibold text-gray-700">{item.quantity}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : null}
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

      {/* Receive confirmation dialog */}
      {receivingRef && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-gray-800 text-lg mb-3">Confirmar recepción</h3>
            <p className="text-sm text-gray-600 mb-6">
              ¿Confirmas la recepción de la transferencia <span className="font-mono font-semibold">{receivingRef}</span>?
              Esta acción ajustará el stock automáticamente.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setReceivingRef(null)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleReceive(receivingRef)}
                disabled={receiveLoading}
                className="px-4 py-2 text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-60"
              >
                {receiveLoading && <i className="ri-loader-4-line animate-spin"></i>}
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New transfer modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <h3 className="font-semibold text-gray-800 text-lg">Nueva Transferencia</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {modalError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
                  {modalError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal Origen</label>
                  <select
                    value={originBranchId}
                    onChange={e => setOriginBranchId(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    <option value="">Seleccionar</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal Destino</label>
                  <select
                    value={destBranchId}
                    onChange={e => setDestBranchId(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    <option value="">Seleccionar</option>
                    {branches.filter(b => b.id !== Number(originBranchId)).map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Product search & add */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Agregar Producto</label>
                <div className="flex gap-2 items-center relative">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Buscar producto..."
                      value={productSearch}
                      onChange={e => setProductSearch(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                    {productSearchLoading && (
                      <div className="absolute right-3 top-2.5">
                        <i className="ri-loader-4-line animate-spin text-gray-400 text-sm"></i>
                      </div>
                    )}
                    {productResults.length > 0 && (
                      <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                        {productResults.map(p => (
                          <li
                            key={p.variantId}
                            onClick={() => handleAddItem(p)}
                            className="px-3 py-2 hover:bg-orange-50 cursor-pointer text-sm flex justify-between"
                          >
                            <span>{p.productName}{p.variantName ? ` — ${p.variantName}` : ''}</span>
                            <span className="text-gray-400 font-mono text-xs">{p.variantSku || p.productSku || ''}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={itemQty}
                    onChange={e => setItemQty(Number(e.target.value))}
                    className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="Qty"
                  />
                </div>
              </div>

              {/* Items list */}
              {items.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr className="text-xs text-gray-500 uppercase">
                        <th className="px-3 py-2 text-left">Producto</th>
                        <th className="px-3 py-2 text-right">Cantidad</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {items.map(item => (
                        <tr key={item.product.variantId}>
                          <td className="px-3 py-2 text-gray-800">{item.product.productName}{item.product.variantName ? ` — ${item.product.variantName}` : ''}</td>
                          <td className="px-3 py-2 text-right">
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={e => handleItemQtyChange(item.product.variantId, Number(e.target.value))}
                              className="w-16 border border-gray-300 rounded px-2 py-1 text-sm text-right"
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button
                              onClick={() => handleRemoveItem(item.product.variantId)}
                              className="text-red-400 hover:text-red-600 cursor-pointer"
                            >
                              <i className="ri-delete-bin-line"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nota (opcional)</label>
                <input
                  type="text"
                  placeholder="Nota..."
                  value={transferNote}
                  onChange={e => setTransferNote(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={modalLoading}
                className="px-4 py-2 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-60"
              >
                {modalLoading && <i className="ri-loader-4-line animate-spin"></i>}
                Crear Transferencia
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
