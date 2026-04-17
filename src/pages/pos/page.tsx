import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../../components/feature/AppLayout';
import { OrderPanel } from '../orders/components/OrderPanel';
import { ProductSelector, PosProduct } from '../orders/components/ProductSelector';
import { ClientSelector } from '../orders/components/ClientSelector';
import { PaymentModal } from '../orders/components/PaymentModal';
import { OpenCashModal } from '../cash/components/OpenCashModal';
import { CloseCashModal } from '../cash/components/CloseCashModal';
import { useAuth } from '../../context/AuthContext';
import { useCash } from '../../context/CashContext';
import { listProducts } from '../../services/products.service';
import { createSale, listSales, getSale, cancelSale, type Sale } from '../../services/sales.service';

type PosTab = 'venta' | 'historial' | 'caja';

interface OrderItem {
  productId: string;
  variantId: number;
  productName: string;
  quantity: number;
  price: number;
}

interface SaleDetailItem {
  variantId: number;
  qty: number;
  unitPrice: number;
  total: number;
  nameSnapshot?: string;
  productName?: string;
}

interface SaleDetail extends Sale {
  items: SaleDetailItem[];
  payments: { method: string; amount: number; note?: string }[];
}

const STATUS_LABEL: Record<string, string> = {
  COMPLETED: 'Completada',
  CONFIRMED: 'Confirmada',
  PENDING: 'Pendiente',
  CANCELLED: 'Cancelada',
};
const STATUS_COLOR: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  CANCELLED: 'bg-red-100 text-red-700',
};
const PAYMENT_LABEL: Record<string, string> = {
  CASH: 'Efectivo',
  CREDIT_CARD: 'Tarjeta de Crédito',
  BANK_TRANSFER: 'Transferencia',
  MERCADO_PAGO: 'Mercado Pago',
};

export default function PosPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { hasCashOpen, refreshSession } = useCash();

  const [activeTab, setActiveTab] = useState<PosTab>('venta');

  // POS state
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState('');
  const [mobilePosTab, setMobilePosTab] = useState<'products' | 'order'>('products');
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [cartError, setCartError] = useState('');

  // History state
  const [sales, setSales] = useState<Sale[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [salesLoaded, setSalesLoaded] = useState(false);

  // Sale detail modal
  const [selectedSale, setSelectedSale] = useState<SaleDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const cashBlocked = !hasCashOpen;

  const loadProducts = useCallback(() => {
    setLoadingProducts(true);
    const fetchAll = async () => {
      let all: PosProduct[] = [];
      let page = 1;
      const pageSize = 100;
      while (true) {
        const res = await listProducts({ status: 'ACTIVE', page, pageSize });
        const mapped: PosProduct[] = res.items
          .filter(p => p.variants && p.variants.length > 0)
          .map(p => ({
            id: String(p.id),
            variantId: p.variants[0].id,
            name: p.name,
            category: p.categoryName || '',
            price: p.variants[0].price,
            stock: p.variants[0].stock ?? 0,
            image: p.imageUrl,
            active: p.status === 'ACTIVE',
            isCombo: p.isCombo ?? false,
          }));
        all = [...all, ...mapped];
        if (res.items.length < pageSize) break;
        page++;
      }
      return all;
    };
    fetchAll()
      .then(setProducts)
      .catch(() => {})
      .finally(() => setLoadingProducts(false));
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const loadSales = useCallback(() => {
    setLoadingSales(true);
    listSales({ limit: 100 })
      .then(res => { setSales(res.items); setSalesLoaded(true); })
      .catch(() => setSales([]))
      .finally(() => setLoadingSales(false));
  }, []);

  useEffect(() => {
    if (activeTab === 'historial' && !salesLoaded) loadSales();
  }, [activeTab, salesLoaded, loadSales]);

  const openSaleDetail = async (id: number) => {
    setLoadingDetail(true);
    setCancelError('');
    setShowCancelConfirm(false);
    setCancelReason('');
    try {
      const detail = await getSale(id);
      setSelectedSale(detail as SaleDetail);
    } catch {
      // ignore
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeDetail = () => {
    setSelectedSale(null);
    setShowCancelConfirm(false);
    setCancelError('');
    setCancelReason('');
  };

  const handlePrintTicket = (sale: SaleDetail) => {
    const dateStr = new Date((sale as any).created_at ?? sale.createdAt).toLocaleString('es-AR');
    const rows = sale.items.map(item => {
      const name = item.nameSnapshot || item.productName || `Variante #${item.variantId}`;
      const subtotal = item.total ?? item.qty * item.unitPrice;
      return `
      <tr>
        <td style="padding:2px 0;word-break:break-word">${name}</td>
        <td style="padding:2px 4px;text-align:center">${item.qty}</td>
        <td style="padding:2px 0;text-align:right">$${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
      </tr>`;
    }).join('');

    const paymentRows = sale.payments.length > 0
      ? sale.payments.map(p => `
      <div style="display:flex;justify-content:space-between">
        <span>${PAYMENT_LABEL[p.method] ?? p.method}:</span>
        <span>$${p.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
      </div>`).join('')
      : '<div>Sin pago registrado</div>';

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  @page { size: 80mm auto; margin: 3mm 3mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 13pt; font-weight: normal; width: 74mm; margin: 0; color: #000; }
  .center { text-align: center; }
  .bold   { font-weight: bold; }
  .sep    { border: none; border-top: 1px dashed #000; margin: 7px 0; }
  table   { width: 100%; border-collapse: collapse; }
  td      { vertical-align: top; font-size: 12pt; padding: 4px 0; }
  .total-row { font-size: 16pt; font-weight: bold; }
</style>
</head>
<body>
  <div class="center bold" style="font-size:18pt;letter-spacing:1px">TICKET</div>
  <div class="center" style="font-size:12pt">${sale.docText || `#${sale.id}`}</div>
  <div class="center" style="font-size:12pt">${dateStr}</div>
  <hr class="sep"/>

  <div><b>Cliente:</b> ${sale.customerName || 'Sin cliente'}</div>
  <hr class="sep"/>

  <table>
    <thead>
      <tr>
        <td style="padding-bottom:3px"><b>Producto</b></td>
        <td style="text-align:center;padding-bottom:3px"><b>Cant</b></td>
        <td style="text-align:right;padding-bottom:3px"><b>Subtotal</b></td>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <hr class="sep"/>

  <div class="total-row" style="display:flex;justify-content:space-between;margin:4px 0">
    <span>TOTAL:</span>
    <span>$${sale.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
  </div>
  ${paymentRows}
  <hr class="sep"/>
  <div class="center" style="margin-top:6px;font-size:12pt">¡Gracias por su compra!</div>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=300,height=600');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const handleCancelSale = async () => {
    if (!selectedSale) return;
    setCancelling(true);
    setCancelError('');
    try {
      await cancelSale(selectedSale.id, cancelReason || undefined);
      setSalesLoaded(false);
      closeDetail();
    } catch (err: any) {
      setCancelError(err?.response?.data?.message || 'Error al anular el pedido');
    } finally {
      setCancelling(false);
    }
  };

  const showCartError = (msg: string) => {
    setCartError(msg);
    setTimeout(() => setCartError(''), 3000);
  };

  const addProduct = (productId: string) => {
    if (cashBlocked) return;
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const currentQty = orderItems.find(i => i.productId === productId)?.quantity ?? 0;
    if (!product.isCombo && product.stock > 0 && currentQty >= product.stock) {
      showCartError(`Sin stock suficiente para ${product.name} (disponible: ${product.stock})`);
      return;
    }
    const existing = orderItems.find(i => i.productId === productId);
    if (existing) {
      setOrderItems(orderItems.map(i => i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setOrderItems([...orderItems, {
        productId: product.id,
        variantId: product.variantId,
        productName: product.name,
        quantity: 1,
        price: product.price,
      }]);
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setOrderItems(orderItems.filter(i => i.productId !== productId));
    } else {
      const product = products.find(p => p.id === productId);
      if (product && product.stock > 0 && quantity > product.stock) {
        showCartError(`Sin stock suficiente para ${product.name} (disponible: ${product.stock})`);
        return;
      }
      setOrderItems(orderItems.map(i => i.productId === productId ? { ...i, quantity } : i));
    }
  };

  const removeItem = (productId: string) => {
    setOrderItems(orderItems.filter(i => i.productId !== productId));
  };

  const calculateTotal = () => orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handleFinishOrder = () => {
    if (cashBlocked) { setActiveTab('caja'); return; }
    if (orderItems.length === 0) { alert('Debe agregar al menos un producto al pedido'); return; }
    if (!selectedClient) { alert('Debe seleccionar un cliente'); return; }
    setShowPaymentModal(true);
  };

  const handlePaymentComplete = async (data: {
    paymentMethod: string; amountPaid: number; notes: string;
    deliveryPlatform: string | null; pendingPayment: boolean;
  }) => {
    if (!currentUser?.branchId) throw new Error('Sin sucursal activa');
    const sale = await createSale({
      branchId: currentUser.branchId,
      posCode: '0001',
      docType: 'TICKET',
      customerId: selectedClient?.id ?? null,
      items: orderItems.map(i => ({ variantId: i.variantId, qty: i.quantity, unitPrice: i.price })),
      payments: data.pendingPayment
        ? []
        : [{ method: data.paymentMethod, amount: calculateTotal(), note: data.notes || undefined }],
      note: data.pendingPayment ? (data.notes || undefined) : undefined,
      deliveryPlatform: data.deliveryPlatform,
    });
    setReceiptNumber(sale.docText);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 2500);
    setSalesLoaded(false);
    loadProducts();
    refreshSession();
  };

  const clearOrder = () => { setOrderItems([]); setSelectedClient(null); };

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });

  const tabs: { id: PosTab; label: string; icon: string }[] = [
    { id: 'venta', label: 'Venta', icon: 'ri-store-2-line' },
    { id: 'historial', label: 'Historial', icon: 'ri-history-line' },
    { id: 'caja', label: 'Caja', icon: 'ri-safe-line' },
  ];

  return (
    <AppLayout noPadding hideSidebar>
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* ── Tab header ── */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm shrink-0">
          <div className="flex items-center gap-2 px-3 md:px-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-3 py-1.5 mr-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 transition-all cursor-pointer whitespace-nowrap shrink-0 text-sm font-medium border border-gray-200"
            >
              <i className="ri-arrow-left-line text-sm"></i>
              <span>Salir</span>
            </button>

            <div className="flex flex-1 items-center">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 md:px-5 py-3 text-sm font-semibold transition-all whitespace-nowrap cursor-pointer relative ${
                    activeTab === tab.id ? 'text-brand-600' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <i className={`${tab.icon} text-base`}></i>
                  <span>{tab.label}</span>
                  {tab.id === 'venta' && orderItems.length > 0 && (
                    <span className="inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-brand-500 rounded-full">
                      {orderItems.length}
                    </span>
                  )}
                  {tab.id === 'caja' && (
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-semibold ${hasCashOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${hasCashOpen ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      <span className="hidden sm:inline">{hasCashOpen ? 'Abierta' : 'Cerrada'}</span>
                    </span>
                  )}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 rounded-t"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Toasts ── */}
        {cartError && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 bg-red-600 text-white px-6 py-4 rounded-xl shadow-2xl">
            <i className="ri-error-warning-line text-xl"></i>
            <p className="font-semibold text-sm">{cartError}</p>
          </div>
        )}
        {showSuccessToast && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 bg-green-600 text-white px-6 py-4 rounded-xl shadow-2xl">
            <i className="ri-checkbox-circle-fill text-xl"></i>
            <div>
              <p className="font-bold text-sm">¡Pedido realizado con éxito!</p>
              <p className="text-green-200 text-xs">Comprobante: {receiptNumber}</p>
            </div>
          </div>
        )}

        {/* ── TAB: VENTA ── */}
        {activeTab === 'venta' && (
          <div className="flex flex-col flex-1 overflow-hidden bg-gradient-to-br from-brand-50 to-brand-100">
            {cashBlocked && (
              <div className="bg-red-600 text-white px-4 py-2.5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <i className="ri-lock-line"></i>
                  <p className="text-sm font-semibold">Caja cerrada — abrí la caja para registrar ventas</p>
                </div>
                <button
                  onClick={() => setActiveTab('caja')}
                  className="bg-white text-red-600 font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all cursor-pointer whitespace-nowrap"
                >
                  Ir a Caja
                </button>
              </div>
            )}

            {/* Mobile sub-tabs */}
            <div className="md:hidden bg-white border-b border-gray-200 shrink-0">
              <div className="flex">
                <button
                  onClick={() => setMobilePosTab('products')}
                  className={`flex-1 py-3 text-sm font-semibold relative cursor-pointer ${mobilePosTab === 'products' ? 'text-brand-600' : 'text-gray-500'}`}
                >
                  <i className="ri-store-line mr-1"></i>Productos
                  {mobilePosTab === 'products' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600"></div>}
                </button>
                <button
                  onClick={() => setMobilePosTab('order')}
                  className={`flex-1 py-3 text-sm font-semibold relative cursor-pointer ${mobilePosTab === 'order' ? 'text-brand-600' : 'text-gray-500'}`}
                >
                  <i className="ri-shopping-cart-line mr-1"></i>Comanda
                  {orderItems.length > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-brand-600 rounded-full">
                      {orderItems.length}
                    </span>
                  )}
                  {mobilePosTab === 'order' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600"></div>}
                </button>
              </div>
            </div>

            {/* Mobile content */}
            <div className={`md:hidden flex-1 overflow-y-auto p-4 ${mobilePosTab === 'products' ? 'block' : 'hidden'}`}>
              <ProductSelector products={products} isLoading={loadingProducts} onSelectProduct={addProduct} cashBlocked={cashBlocked} />
            </div>
            <div className={`md:hidden flex-1 overflow-hidden flex flex-col ${mobilePosTab === 'order' ? 'flex' : 'hidden'}`}>
              <div className="p-4 shrink-0">
                <ClientSelector selectedClient={selectedClient} onSelectClient={setSelectedClient} />
              </div>
              <div className="flex-1 overflow-hidden min-h-0">
                <OrderPanel
                  orderItems={orderItems}
                  selectedClient={selectedClient}
                  total={calculateTotal()}
                  onUpdateQuantity={updateQuantity}
                  onRemoveItem={removeItem}
                  onFinishOrder={handleFinishOrder}
                  onClearOrder={clearOrder}
                  cashBlocked={cashBlocked}
                />
              </div>
            </div>

            {/* Desktop split — right panel must NOT have overflow-y-auto so OrderPanel controls its own scroll */}
            <div className="hidden md:flex flex-1 overflow-hidden">
              <div className="w-2/3 p-6 overflow-y-auto">
                <ProductSelector products={products} isLoading={loadingProducts} onSelectProduct={addProduct} cashBlocked={cashBlocked} />
              </div>
              <div className="w-1/3 bg-white shadow-2xl flex flex-col overflow-hidden">
                <div className="p-5 border-b border-gray-200 shrink-0">
                  <ClientSelector selectedClient={selectedClient} onSelectClient={setSelectedClient} />
                </div>
                <div className="flex-1 overflow-hidden min-h-0">
                  <OrderPanel
                    orderItems={orderItems}
                    selectedClient={selectedClient}
                    total={calculateTotal()}
                    onUpdateQuantity={updateQuantity}
                    onRemoveItem={removeItem}
                    onFinishOrder={handleFinishOrder}
                    onClearOrder={clearOrder}
                    cashBlocked={cashBlocked}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: HISTORIAL ── */}
        {activeTab === 'historial' && (
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">Historial de Pedidos</h2>
                <button
                  onClick={loadSales}
                  className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 cursor-pointer"
                >
                  <i className={`ri-refresh-line ${loadingSales ? 'animate-spin' : ''}`}></i>
                  Actualizar
                </button>
              </div>

              {loadingSales ? (
                <div className="flex justify-center py-16">
                  <i className="ri-loader-4-line animate-spin text-3xl text-brand-500"></i>
                </div>
              ) : sales.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <i className="ri-receipt-line text-5xl block mb-3"></i>
                  <p className="text-sm">No hay pedidos registrados</p>
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-4 py-3 font-semibold text-gray-600">Comprobante</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-600">Cliente</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-600">Fecha</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-600">Estado</th>
                          <th className="text-right px-4 py-3 font-semibold text-gray-600">Total</th>
                          <th className="px-4 py-3"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {sales.map(sale => (
                          <tr key={sale.id} className="hover:bg-brand-50/30 transition-colors">
                            <td className="px-4 py-3 font-mono text-xs text-gray-600">{sale.docText || `#${sale.id}`}</td>
                            <td className="px-4 py-3 text-gray-700">{sale.customerName || <span className="text-gray-400 italic">Sin cliente</span>}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs">{fmtDate(sale.createdAt)}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[sale.status] ?? 'bg-gray-100 text-gray-600'}`}>
                                {STATUS_LABEL[sale.status] ?? sale.status}
                              </span>
                              {sale.hasPendingPayment && (
                                <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">Pago pend.</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-gray-800">{fmt(sale.total)}</td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => openSaleDetail(sale.id)}
                                className="text-brand-500 hover:text-brand-700 text-xs font-semibold cursor-pointer flex items-center gap-1 ml-auto"
                              >
                                <i className="ri-eye-line"></i> Ver
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="md:hidden space-y-3">
                    {sales.map(sale => (
                      <button
                        key={sale.id}
                        onClick={() => openSaleDetail(sale.id)}
                        className="w-full bg-white rounded-xl border border-gray-200 p-4 text-left hover:border-brand-300 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-mono text-xs text-gray-500">{sale.docText || `#${sale.id}`}</p>
                            <p className="font-semibold text-gray-800 mt-0.5">{sale.customerName || <span className="text-gray-400 italic text-sm">Sin cliente</span>}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{fmtDate(sale.createdAt)}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-bold text-gray-800">{fmt(sale.total)}</p>
                            <span className={`mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[sale.status] ?? 'bg-gray-100 text-gray-600'}`}>
                              {STATUS_LABEL[sale.status] ?? sale.status}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: CAJA ── */}
        {activeTab === 'caja' && (
          <div className="flex-1 overflow-y-auto">
            {hasCashOpen ? <CloseCashModal /> : <OpenCashModal />}
          </div>
        )}

        {/* ── Payment modal ── */}
        {showPaymentModal && !cashBlocked && (
          <PaymentModal
            total={calculateTotal()}
            orderItems={orderItems}
            products={products}
            client={selectedClient}
            receiptNumber={receiptNumber}
            onClose={() => { setShowPaymentModal(false); setOrderItems([]); setSelectedClient(null); }}
            onComplete={handlePaymentComplete}
          />
        )}

        {/* ── Sale detail modal ── */}
        {(loadingDetail || selectedSale) && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              {loadingDetail ? (
                <div className="flex items-center justify-center p-16">
                  <i className="ri-loader-4-line animate-spin text-3xl text-brand-500"></i>
                </div>
              ) : selectedSale && (
                <>
                  {/* Gradient header */}
                  <div className="bg-gradient-to-r from-brand-500 to-brand-600 rounded-t-2xl p-4 md:p-5 flex items-center justify-between">
                    <div>
                      <h2 className="text-white font-bold text-base md:text-lg">Detalle del Pedido</h2>
                      <p className="text-brand-100 text-sm">{selectedSale.docText || `#${selectedSale.id}`}</p>
                    </div>
                    <button
                      onClick={closeDetail}
                      className="w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors cursor-pointer"
                    >
                      <i className="ri-close-line text-lg"></i>
                    </button>
                  </div>

                  <div className="p-4 md:p-6 space-y-4">
                    {/* Info grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-500 mb-1">Cliente</p>
                        <p className="font-semibold text-gray-800 text-sm">{selectedSale.customerName || 'Sin cliente'}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-500 mb-1">Fecha y Hora</p>
                        <p className="font-semibold text-gray-800 text-sm">
                          {new Date((selectedSale as any).created_at ?? selectedSale.createdAt).toLocaleDateString('es-AR')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date((selectedSale as any).created_at ?? selectedSale.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-500 mb-1">Estado</p>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[selectedSale.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_LABEL[selectedSale.status] ?? selectedSale.status}
                        </span>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-500 mb-1">Tipo</p>
                        <p className="font-semibold text-gray-800 text-sm">{selectedSale.docType || 'Particular'}</p>
                      </div>
                    </div>

                    {/* Items */}
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Productos</h3>
                      {selectedSale.items.length > 0 ? (
                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Producto</th>
                                <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500">Cant.</th>
                                <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500">Precio</th>
                                <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {selectedSale.items.map((item, i) => (
                                <tr key={i}>
                                  <td className="px-3 py-2 text-xs text-gray-800">
                                    {item.nameSnapshot || item.productName || `Variante #${item.variantId}`}
                                  </td>
                                  <td className="px-3 py-2 text-xs text-center text-gray-700">{item.qty}</td>
                                  <td className="px-3 py-2 text-xs text-right text-gray-700">${item.unitPrice.toLocaleString()}</td>
                                  <td className="px-3 py-2 text-xs text-right font-semibold text-gray-800">
                                    ${(item.total ?? item.qty * item.unitPrice).toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 text-center py-3">Sin ítems</p>
                      )}
                    </div>

                    {/* Payments */}
                    {selectedSale.payments.length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Pago</h3>
                        <div className="space-y-1">
                          {selectedSale.payments.map((p, i) => (
                            <div key={i} className="flex justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                              <span className="text-gray-600">{PAYMENT_LABEL[p.method] ?? p.method}</span>
                              <span className="font-semibold text-gray-800">${p.amount.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Total */}
                    <div className="bg-gradient-to-r from-brand-50 to-brand-100 rounded-xl p-4 border border-brand-200 flex justify-between items-center">
                      <span className="font-bold text-gray-800">Total</span>
                      <span className="text-xl font-bold text-brand-600">${selectedSale.total.toLocaleString()}</span>
                    </div>

                    {/* Ticket button */}
                    <button
                      onClick={() => handlePrintTicket(selectedSale)}
                      className="w-full flex items-center justify-center gap-2 border border-brand-300 text-brand-600 py-2.5 rounded-xl font-semibold hover:bg-brand-50 transition-all cursor-pointer text-sm"
                    >
                      <i className="ri-printer-line"></i>
                      Ver Ticket
                    </button>

                    {/* Cancel section */}
                    {selectedSale.status !== 'CANCELLED' && !showCancelConfirm && (
                      <button
                        onClick={() => setShowCancelConfirm(true)}
                        className="w-full flex items-center justify-center gap-2 border border-red-300 text-red-600 py-2.5 rounded-xl font-semibold hover:bg-red-50 transition-all cursor-pointer text-sm"
                      >
                        <i className="ri-close-circle-line"></i>
                        Anular pedido
                      </button>
                    )}

                    {showCancelConfirm && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                        <p className="text-sm font-semibold text-red-800">¿Estás seguro de anular este pedido?</p>
                        <p className="text-xs text-red-600">Se restaurará el stock y se generará una nota de crédito si corresponde.</p>
                        <input
                          type="text"
                          value={cancelReason}
                          onChange={e => setCancelReason(e.target.value)}
                          placeholder="Motivo de anulación (opcional)"
                          className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 bg-white"
                        />
                        {cancelError && (
                          <p className="text-xs text-red-700 font-medium">{cancelError}</p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setShowCancelConfirm(false); setCancelReason(''); }}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-sm cursor-pointer"
                          >
                            No, volver
                          </button>
                          <button
                            onClick={handleCancelSale}
                            disabled={cancelling}
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                          >
                            {cancelling ? <i className="ri-loader-4-line animate-spin"></i> : <i className="ri-close-circle-line"></i>}
                            Sí, anular
                          </button>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={closeDetail}
                      className="w-full bg-gradient-to-r from-brand-500 to-brand-600 text-white py-3 rounded-xl font-semibold hover:from-brand-600 hover:to-brand-700 transition-all cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
