import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../../components/feature/AppLayout';
import { OrderPanel } from './components/OrderPanel';
import { ProductSelector, PosProduct } from './components/ProductSelector';
import { ClientSelector } from './components/ClientSelector';
import { PaymentModal } from './components/PaymentModal';
import { VariantPickerModal } from '../pos/components/VariantPickerModal';
import { useAuth } from '../../context/AuthContext';
import { useCash } from '../../context/CashContext';
import { listProducts } from '../../services/products.service';
import { createSale } from '../../services/sales.service';

interface OrderItem {
  productId: string;
  variantId: number;
  productName: string;
  quantity: number;
  price: number;
}

export default function OrdersPage() {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'products' | 'order'>('products');
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [cartError, setCartError] = useState('');

  const { currentUser } = useAuth();
  const { hasCashOpen } = useCash();
  const navigate = useNavigate();

  const cashBlocked = !hasCashOpen;

  const [variantPickerProduct, setVariantPickerProduct] = useState<PosProduct | null>(null);

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
            hasVariants: p.hasVariants ?? false,
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

  const showCartError = (msg: string) => {
    setCartError(msg);
    setTimeout(() => setCartError(''), 3000);
  };

  const addProduct = (productId: string) => {
    if (cashBlocked) return;
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (product.hasVariants) {
      setVariantPickerProduct(product);
      return;
    }

    addProductToCart(product.id, product.variantId, product.name, product.price, product.stock, product.isCombo);
  };

  const addProductToCart = (productId: string, variantId: number, productName: string, price: number, stock: number, isCombo?: boolean) => {
    const matchKey = (i: OrderItem) => i.productId === productId && i.variantId === variantId;
    const currentQty = orderItems.find(matchKey)?.quantity ?? 0;
    if (!isCombo && stock > 0 && currentQty >= stock) {
      showCartError(`Sin stock suficiente para ${productName} (disponible: ${stock})`);
      return;
    }
    const existing = orderItems.find(matchKey);
    if (existing) {
      setOrderItems(orderItems.map(i => matchKey(i) ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setOrderItems([...orderItems, { productId, variantId, productName, quantity: 1, price }]);
    }
  };

  const handleVariantSelected = (variantId: number, variantName: string, stock: number) => {
    if (!variantPickerProduct) return;
    const displayName = variantName ? `${variantPickerProduct.name} - ${variantName}` : variantPickerProduct.name;
    addProductToCart(variantPickerProduct.id, variantId, displayName, variantPickerProduct.price, stock, false);
    setVariantPickerProduct(null);
  };

  const updateQuantity = (productId: string, quantity: number, variantId?: number) => {
    const matchKey = (i: OrderItem) => i.productId === productId && (variantId === undefined || i.variantId === variantId);
    if (quantity <= 0) {
      setOrderItems(orderItems.filter(i => !matchKey(i)));
    } else {
      setOrderItems(orderItems.map(i => matchKey(i) ? { ...i, quantity } : i));
    }
  };

  const removeItem = (productId: string, variantId?: number) => {
    const matchKey = (i: OrderItem) => i.productId === productId && (variantId === undefined || i.variantId === variantId);
    setOrderItems(orderItems.filter(i => !matchKey(i)));
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleFinishOrder = () => {
    if (cashBlocked) {
      navigate('/cash');
      return;
    }
    if (orderItems.length === 0) {
      alert('Debe agregar al menos un producto al pedido');
      return;
    }
    if (!selectedClient) {
      alert('Debe seleccionar un cliente');
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePaymentComplete = async (data: { paymentMethod: string; amountPaid: number; notes: string; deliveryPlatform: string | null; pendingPayment: boolean }) => {
    if (!currentUser?.branchId) throw new Error('Sin sucursal activa');

    const sale = await createSale({
      branchId: currentUser.branchId,
      posCode: '0001',
      docType: 'TICKET',
      customerId: selectedClient?.id ?? null,
      items: orderItems.map(item => ({
        variantId: item.variantId,
        qty: item.quantity,
        unitPrice: item.price,
      })),
      payments: data.pendingPayment
        ? []
        : [{ method: data.paymentMethod, amount: calculateTotal(), note: data.notes || undefined }],
      note: data.pendingPayment ? (data.notes || undefined) : undefined,
      deliveryPlatform: data.deliveryPlatform,
    });

    setReceiptNumber(sale.docText);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 2500);
    loadProducts();
  };

  const clearOrder = () => {
    setOrderItems([]);
    setSelectedClient(null);
  };

  return (
    <AppLayout noPadding>
      <div className="flex h-full bg-gradient-to-br from-brand-50 to-brand-100 overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>

        {/* Toast de error de stock */}
        {cartError && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 bg-red-600 text-white px-6 py-4 rounded-xl shadow-2xl">
            <i className="ri-error-warning-line text-xl"></i>
            <p className="font-semibold text-sm">{cartError}</p>
          </div>
        )}

        {/* Toast de éxito */}
        {showSuccessToast && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 bg-green-600 text-white px-6 py-4 rounded-xl shadow-2xl animate-bounce-in">
            <div className="w-8 h-8 flex items-center justify-center bg-white/20 rounded-full">
              <i className="ri-checkbox-circle-fill text-xl"></i>
            </div>
            <div>
              <p className="font-bold text-sm">¡Pedido realizado con éxito!</p>
              <p className="text-green-200 text-xs">Comprobante: {receiptNumber}</p>
            </div>
          </div>
        )}

        {/* Banner de caja cerrada */}
        {cashBlocked && (
          <div className="fixed top-0 left-0 md:left-64 right-0 z-40 bg-red-600 text-white px-6 py-3 flex items-center justify-between shadow-lg safe-top">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center">
                <i className="ri-lock-line text-xl"></i>
              </div>
              <div>
                <p className="font-bold text-sm">Caja cerrada — No podés registrar ventas</p>
                <p className="text-red-200 text-xs mt-1">Abrí la caja primero para poder finalizar pedidos</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/cash')}
              className="bg-white text-red-600 font-bold text-sm px-4 py-2 rounded-lg hover:bg-red-50 transition-all whitespace-nowrap cursor-pointer flex items-center gap-2"
            >
              <div className="w-4 h-4 flex items-center justify-center">
                <i className="ri-safe-line"></i>
              </div>
              Ir a abrir caja
            </button>
          </div>
        )}

        {/* Tabs Mobile */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 shadow-sm safe-top" style={{ marginTop: cashBlocked ? '60px' : undefined }}>
          <div className="flex items-center">
            <button
              onClick={() => setActiveTab('products')}
              className={`flex-1 py-4 text-sm font-semibold transition-all relative cursor-pointer ${activeTab === 'products' ? 'text-brand-600' : 'text-gray-500'}`}
            >
              <i className="ri-store-line mr-2"></i>
              Productos
              {activeTab === 'products' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600"></div>}
            </button>
            <button
              onClick={() => setActiveTab('order')}
              className={`flex-1 py-4 text-sm font-semibold transition-all relative cursor-pointer ${activeTab === 'order' ? 'text-brand-600' : 'text-gray-500'}`}
            >
              <i className="ri-shopping-cart-line mr-2"></i>
              Comanda
              {orderItems.length > 0 && (
                <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-brand-600 rounded-full">
                  {orderItems.length}
                </span>
              )}
              {activeTab === 'order' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600"></div>}
            </button>
          </div>
        </div>

        {/* Vista Mobile - Tab Productos */}
        <div className={`md:hidden w-full overflow-y-auto ${activeTab === 'products' ? 'block' : 'hidden'}`} style={{ paddingTop: cashBlocked ? '120px' : '60px', paddingBottom: '20px' }}>
          <div className="p-4">
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-gray-800 mb-1">Panel de Pedidos</h1>
              <p className="text-gray-600 text-sm">Seleccioná productos para crear un nuevo pedido</p>
            </div>
            <ProductSelector products={products} isLoading={loadingProducts} onSelectProduct={addProduct} cashBlocked={cashBlocked} />
          </div>
        </div>

        {/* Vista Mobile - Tab Comanda */}
        <div className={`md:hidden w-full overflow-y-auto ${activeTab === 'order' ? 'block' : 'hidden'}`} style={{ paddingTop: cashBlocked ? '120px' : '60px' }}>
          <div className="p-4 pb-6">
            <ClientSelector selectedClient={selectedClient} onSelectClient={setSelectedClient} />
          </div>
          <div className="px-4 pb-20">
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

        {/* Vista Desktop */}
        <div className="hidden md:flex w-full">
          <div className={`w-2/3 p-6 overflow-y-auto ${cashBlocked ? 'pt-20' : ''}`}>
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Panel de Pedidos</h1>
              <p className="text-gray-600 text-sm">Seleccioná productos para crear un nuevo pedido</p>
            </div>
            <ProductSelector products={products} isLoading={loadingProducts} onSelectProduct={addProduct} cashBlocked={cashBlocked} />
          </div>

          <div className={`w-1/3 bg-white shadow-2xl overflow-y-auto flex flex-col ${cashBlocked ? 'pt-14' : ''}`}>
            <div className="p-6 border-b border-gray-200">
              <ClientSelector selectedClient={selectedClient} onSelectClient={setSelectedClient} />
            </div>
            <div className="flex-1">
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

        {variantPickerProduct && (
          <VariantPickerModal
            productId={Number(variantPickerProduct.id)}
            productName={variantPickerProduct.name}
            productPrice={variantPickerProduct.price}
            productImage={variantPickerProduct.image}
            branchId={currentUser?.branchId ?? null}
            onSelect={handleVariantSelected}
            onClose={() => setVariantPickerProduct(null)}
          />
        )}
      </div>
    </AppLayout>
  );
}
