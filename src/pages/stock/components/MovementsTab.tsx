import { useState, useEffect, useCallback } from 'react';
import {
  listMovements,
  createMovement,
  searchStockProducts,
  type StockMovement,
  type StockProduct,
} from '../../../services/stock.service';
import { listBranches, type Branch } from '../../../services/branches.service';
import { type CurrentUser } from '../../../context/AuthContext';

interface Props {
  currentUser: CurrentUser | null;
}

const MOVEMENT_TYPE_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'ENTRY', label: 'Entrada' },
  { value: 'SALE', label: 'Venta' },
  { value: 'ADJUSTMENT', label: 'Ajuste' },
  { value: 'TRANSFER_OUT', label: 'Transferencia Salida' },
  { value: 'TRANSFER_IN', label: 'Transferencia Entrada' },
  { value: 'INVENTORY', label: 'Inventario' },
];

const TYPE_BADGE: Record<string, string> = {
  ENTRY: 'bg-green-100 text-green-700',
  SALE: 'bg-blue-100 text-blue-700',
  ADJUSTMENT: 'bg-yellow-100 text-yellow-700',
  TRANSFER_OUT: 'bg-brand-100 text-brand-700',
  TRANSFER_IN: 'bg-teal-100 text-teal-700',
  INVENTORY: 'bg-purple-100 text-purple-700',
};

const TYPE_LABEL: Record<string, string> = {
  ENTRY: 'Entrada',
  SALE: 'Venta',
  ADJUSTMENT: 'Ajuste',
  TRANSFER_OUT: 'Trans. Salida',
  TRANSFER_IN: 'Trans. Entrada',
  INVENTORY: 'Inventario',
};

const LIMIT = 50;

interface CartItem { variantId: number; productName: string; variantName: string; qty: number; }

export default function MovementsTab({ currentUser }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo, setDateTo] = useState(today);
  const [searchQ, setSearchQ] = useState('');
  const [offset, setOffset] = useState(0);

  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState<StockProduct[]>([]);
  const [productSearchLoading, setProductSearchLoading] = useState(false);
  const [movType, setMovType] = useState<'ENTRY' | 'ADJUSTMENT'>('ENTRY');
  const [movDirection, setMovDirection] = useState<'in' | 'out'>('in');
  const [movBranchId, setMovBranchId] = useState<number | ''>('');
  const [movNote, setMovNote] = useState('');

  // Carrito de ítems
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartQty, setCartQty] = useState<number>(1);

  const fetchMovements = useCallback(() => {
    setLoading(true);
    setError(null);
    listMovements({
      type: typeFilter || undefined,
      from: dateFrom || undefined,
      to: dateTo || undefined,
      q: searchQ || undefined,
      branchId: currentUser?.branchId ?? undefined,
      limit: LIMIT,
      offset,
    })
      .then(res => {
        setMovements(res.items ?? []);
        setTotal(res.total ?? 0);
      })
      .catch(err => setError(err?.response?.data?.message ?? 'Error al cargar movimientos'))
      .finally(() => setLoading(false));
  }, [typeFilter, dateFrom, dateTo, searchQ, offset, currentUser?.branchId]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  // Fetch branches for modal
  useEffect(() => {
    if (showModal) {
      listBranches()
        .then(res => {
          setBranches(res.items);
          // Pre-select branch
          if (currentUser?.branchId) {
            setMovBranchId(currentUser.branchId);
          } else if (res.items.length === 1) {
            setMovBranchId(res.items[0].id);
          }
        })
        .catch(() => {});
    }
  }, [showModal, currentUser?.branchId]);

  // Product search
  useEffect(() => {
    if (!productSearch.trim()) {
      setProductResults([]);
      return;
    }
    setProductSearchLoading(true);
    const t = setTimeout(() => {
      searchStockProducts({ q: productSearch, branchId: movBranchId || undefined })
        .then(res => setProductResults(res.items ?? []))
        .catch(() => setProductResults([]))
        .finally(() => setProductSearchLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [productSearch, movBranchId]);

  const openModal = () => {
    setShowModal(true);
    setModalError(null);
    setProductSearch('');
    setProductResults([]);
    setMovType('ENTRY');
    setMovDirection('in');
    setMovNote('');
    setMovBranchId(currentUser?.branchId ?? '');
    setCart([]);
    setCartQty(1);
  };

  const addToCart = (product: StockProduct) => {
    setCart(prev => {
      const existing = prev.find(i => i.variantId === product.variantId);
      if (existing) {
        return prev.map(i => i.variantId === product.variantId
          ? { ...i, qty: i.qty + cartQty }
          : i
        );
      }
      return [...prev, {
        variantId: product.variantId,
        productName: product.productName,
        variantName: product.variantName,
        qty: cartQty,
      }];
    });
    setProductSearch('');
    setProductResults([]);
    setCartQty(1);
  };

  const updateCartQty = (variantId: number, qty: number) => {
    if (qty <= 0) {
      setCart(prev => prev.filter(i => i.variantId !== variantId));
    } else {
      setCart(prev => prev.map(i => i.variantId === variantId ? { ...i, qty } : i));
    }
  };

  const handleSubmit = async () => {
    if (cart.length === 0) { setModalError('Agregá al menos un producto'); return; }
    if (!movBranchId) { setModalError('Seleccioná una sucursal'); return; }
    setModalLoading(true);
    setModalError(null);
    try {
      const sign = movType === 'ADJUSTMENT' && movDirection === 'out' ? -1 : 1;
      await createMovement({
        type: movType,
        branchId: Number(movBranchId),
        items: cart.map(i => ({ variant_id: i.variantId, quantity: i.qty * sign })),
        note: movNote || undefined,
      });
      setShowModal(false);
      setOffset(0);
      fetchMovements();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setModalError(e?.response?.data?.message ?? 'Error al registrar movimiento');
    } finally {
      setModalLoading(false);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);
  const currentPage = Math.floor(offset / LIMIT) + 1;

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tipo</label>
            <select
              value={typeFilter}
              onChange={e => { setTypeFilter(e.target.value); setOffset(0); }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              {MOVEMENT_TYPE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Desde</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setOffset(0); }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Hasta</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => { setDateTo(e.target.value); setOffset(0); }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs text-gray-500 mb-1">Buscar</label>
            <input
              type="text"
              placeholder="Producto, ref..."
              value={searchQ}
              onChange={e => { setSearchQ(e.target.value); setOffset(0); }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <button
            onClick={openModal}
            className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <i className="ri-add-line"></i>
            Registrar Movimiento
          </button>
        </div>
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
            <i className="ri-loader-4-line animate-spin text-brand-500 text-3xl"></i>
          </div>
        ) : movements.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <i className="ri-inbox-line text-4xl block mb-2"></i>
            <p className="text-sm">No hay movimientos para mostrar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-left">Producto</th>
                  <th className="px-4 py-3 text-right">Cantidad</th>
                  <th className="px-4 py-3 text-left">Sucursal</th>
                  <th className="px-4 py-3 text-left">Nota</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {movements.map(m => (
                  <tr key={`${m.id}-${m.variantId}`} className="hover:bg-brand-50/40 transition-colors">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleString('es-AR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${TYPE_BADGE[m.type] ?? 'bg-gray-100 text-gray-600'}`}>
                        {TYPE_LABEL[m.type] ?? m.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {m.productName}
                      {m.sku && <span className="text-xs text-gray-400 ml-1 font-mono">({m.sku})</span>}
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold ${m.quantity >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {m.quantity >= 0 ? '+' : ''}{m.quantity}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{m.branchName}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs max-w-[160px] truncate">{m.note ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            Página {currentPage} de {totalPages} — {total} movimientos
          </span>
          <div className="flex gap-2">
            <button
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - LIMIT))}
              className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              <i className="ri-arrow-left-s-line"></i>
            </button>
            <button
              disabled={offset + LIMIT >= total}
              onClick={() => setOffset(offset + LIMIT)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              <i className="ri-arrow-right-s-line"></i>
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <h3 className="font-semibold text-gray-800 text-lg">Registrar Movimiento</h3>
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

              {/* Type + Branch row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={movType}
                    onChange={e => { setMovType(e.target.value as 'ENTRY' | 'ADJUSTMENT'); setMovDirection('in'); }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  >
                    <option value="ENTRY">Entrada</option>
                    <option value="ADJUSTMENT">Ajuste</option>
                  </select>
                </div>
                {branches.length > 1 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal</label>
                    <select
                      value={movBranchId}
                      onChange={e => setMovBranchId(Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                    >
                      <option value="">Seleccionar</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Direction toggle for ADJUSTMENT */}
              {movType === 'ADJUSTMENT' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección del ajuste</label>
                  <div className="flex rounded-lg overflow-hidden border border-gray-300">
                    <button
                      type="button"
                      onClick={() => setMovDirection('in')}
                      className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-1 transition-colors ${
                        movDirection === 'in' ? 'bg-green-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <i className="ri-add-line"></i> Aumentar
                    </button>
                    <button
                      type="button"
                      onClick={() => setMovDirection('out')}
                      className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-1 transition-colors ${
                        movDirection === 'out' ? 'bg-red-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <i className="ri-subtract-line"></i> Reducir
                    </button>
                  </div>
                </div>
              )}

              {/* Product search + qty row */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Agregar producto</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={1}
                    value={cartQty}
                    onChange={e => setCartQty(Math.max(1, Number(e.target.value)))}
                    className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand-400"
                    title="Cantidad"
                  />
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Buscar por nombre o SKU..."
                      value={productSearch}
                      onChange={e => setProductSearch(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                    />
                    {productSearchLoading && (
                      <div className="absolute right-3 top-2.5">
                        <i className="ri-loader-4-line animate-spin text-gray-400"></i>
                      </div>
                    )}
                    {productResults.length > 0 && (
                      <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-44 overflow-y-auto">
                        {productResults.map(p => (
                          <li
                            key={p.variantId}
                            onClick={() => addToCart(p)}
                            className="px-3 py-2 hover:bg-brand-50 cursor-pointer text-sm flex justify-between items-center"
                          >
                            <span>{p.productName}{p.variantName ? ` — ${p.variantName}` : ''}</span>
                            <span className="text-gray-400 font-mono text-xs ml-2 shrink-0">{p.variantSku || p.productSku || ''}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-400">Buscá un producto y hacé clic para agregarlo con la cantidad indicada</p>
              </div>

              {/* Cart */}
              {cart.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wide flex justify-between">
                    <span>Productos a registrar</span>
                    <span>{cart.length} ítem{cart.length !== 1 ? 's' : ''}</span>
                  </div>
                  <ul className="divide-y divide-gray-100">
                    {cart.map(item => (
                      <li key={item.variantId} className="flex items-center gap-3 px-3 py-2">
                        <span className="flex-1 text-sm text-gray-800">
                          {item.productName}{item.variantName ? ` — ${item.variantName}` : ''}
                        </span>
                        <input
                          type="number"
                          min={movType === 'ENTRY' ? 1 : undefined}
                          value={item.qty}
                          onChange={e => updateCartQty(item.variantId, Number(e.target.value))}
                          className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand-400"
                        />
                        <button
                          onClick={() => setCart(prev => prev.filter(i => i.variantId !== item.variantId))}
                          className="text-red-400 hover:text-red-600 cursor-pointer p-1"
                        >
                          <i className="ri-delete-bin-line text-sm"></i>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nota (opcional)</label>
                <input
                  type="text"
                  placeholder="Nota para todo el movimiento..."
                  value={movNote}
                  onChange={e => setMovNote(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </div>
            </div>

            <div className="flex justify-between items-center gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
              <span className="text-sm text-gray-500">
                {cart.length === 0 ? 'Sin productos' : `${cart.length} producto${cart.length !== 1 ? 's' : ''} · ${cart.reduce((s, i) => s + i.qty, 0)} uds en total`}
              </span>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={modalLoading || cart.length === 0}
                  className="px-4 py-2 text-sm bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-60"
                >
                  {modalLoading && <i className="ri-loader-4-line animate-spin"></i>}
                  Guardar {cart.length > 0 ? `(${cart.length})` : ''}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
