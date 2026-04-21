
interface OrderItem {
  productId: string;
  variantId?: number;
  productName: string;
  quantity: number;
  price: number;
}

interface OrderPanelProps {
  orderItems: OrderItem[];
  selectedClient: any;
  total: number;
  onUpdateQuantity: (productId: string, quantity: number, variantId?: number) => void;
  onRemoveItem: (productId: string, variantId?: number) => void;
  onFinishOrder: () => void;
  onClearOrder: () => void;
  cashBlocked?: boolean;
}

export function OrderPanel({
  orderItems,
  selectedClient,
  total,
  onUpdateQuantity,
  onRemoveItem,
  onFinishOrder,
  onClearOrder,
  cashBlocked = false,
}: OrderPanelProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-700">
            <i className="ri-shopping-cart-line mr-2 text-brand-500"></i>
            Productos del Pedido
          </h2>
          <span className="text-xs bg-brand-100 text-brand-700 font-semibold px-2 py-1 rounded-full">
            {orderItems.length} ítem{orderItems.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {orderItems.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 flex items-center justify-center mx-auto mb-3">
              <i className="ri-shopping-cart-line text-5xl text-gray-300"></i>
            </div>
            <p className="text-gray-500 text-sm">No hay productos en el pedido</p>
            <p className="text-gray-400 text-xs mt-1">Seleccioná productos desde el panel izquierdo</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orderItems.map(item => {
              const itemKey = `${item.productId}-${item.variantId ?? 'default'}`;
              return (
              <div key={itemKey} className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 text-sm">{item.productName}</h3>
                    <p className="text-brand-600 font-bold text-sm">${item.price.toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => onRemoveItem(item.productId, item.variantId)}
                    className="text-red-400 hover:text-red-600 transition-colors cursor-pointer w-7 h-7 flex items-center justify-center"
                  >
                    <i className="ri-delete-bin-line text-base"></i>
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpdateQuantity(item.productId, item.quantity - 1, item.variantId)}
                      className="w-7 h-7 flex items-center justify-center bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      <i className="ri-subtract-line text-gray-600 text-sm"></i>
                    </button>
                    <span className="w-10 text-center font-semibold text-gray-800 text-sm">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(item.productId, item.quantity + 1, item.variantId)}
                      className="w-7 h-7 flex items-center justify-center bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      <i className="ri-add-line text-gray-600 text-sm"></i>
                    </button>
                  </div>
                  <span className="font-bold text-gray-800 text-sm">${(item.price * item.quantity).toLocaleString()}</span>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">Subtotal</span>
            <span className="font-semibold text-gray-700 text-sm">${total.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-gray-300">
            <span className="text-base font-bold text-gray-800">Total</span>
            <span className="text-xl font-bold text-brand-600">${total.toLocaleString()}</span>
          </div>
        </div>

        <div className="space-y-2">
          {cashBlocked && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-1">
              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                <i className="ri-lock-line text-red-500 text-sm"></i>
              </div>
              <p className="text-xs text-red-600 font-medium">Abrí la caja para poder finalizar pedidos</p>
            </div>
          )}
          <button
            onClick={onFinishOrder}
            disabled={orderItems.length === 0 || !selectedClient || cashBlocked}
            className="w-full bg-gradient-to-r from-brand-500 to-brand-600 text-white py-3 rounded-lg font-semibold hover:from-brand-600 hover:to-brand-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md whitespace-nowrap cursor-pointer text-sm"
          >
            <i className={`${cashBlocked ? 'ri-lock-line' : 'ri-check-line'} mr-2`}></i>
            {cashBlocked ? 'Caja cerrada' : 'Finalizar Pedido'}
          </button>
          <button
            onClick={onClearOrder}
            disabled={orderItems.length === 0}
            className="w-full bg-white text-gray-600 py-2 rounded-lg font-medium hover:bg-gray-100 transition-all border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer text-sm"
          >
            <i className="ri-delete-bin-line mr-2"></i>
            Limpiar Pedido
          </button>
        </div>
      </div>
    </div>
  );
}
