interface RecentSaleEntry { id: number; doc_number: string; total_amount: number; created_at: string; status: string; customerName: string | null }

interface RecentOrdersProps {
  data: RecentSaleEntry[];
}

export function RecentOrders({ data }: RecentOrdersProps) {
  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-base md:text-lg font-bold text-gray-800">Ventas Recientes</h2>
        <i className="ri-time-line text-xl md:text-2xl text-gray-400"></i>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <i className="ri-inbox-line text-4xl mb-2 block"></i>
          <p className="text-sm">Sin ventas recientes</p>
        </div>
      ) : (
        <>
          {/* Vista de tabla en desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-xs font-semibold text-gray-600 pb-3">Pedido</th>
                  <th className="text-left text-xs font-semibold text-gray-600 pb-3">Cliente</th>
                  <th className="text-left text-xs font-semibold text-gray-600 pb-3">Estado</th>
                  <th className="text-right text-xs font-semibold text-gray-600 pb-3">Total</th>
                  <th className="text-right text-xs font-semibold text-gray-600 pb-3">Hora</th>
                </tr>
              </thead>
              <tbody>
                {data.map((order) => (
                  <tr key={order.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="py-3 text-sm text-gray-600">{order.doc_number}</td>
                    <td className="py-3 text-sm font-medium text-gray-800">{order.customerName ?? 'Consumidor Final'}</td>
                    <td className="py-3">
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700">
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 text-sm font-bold text-gray-800 text-right">
                      ${order.total_amount.toLocaleString('es-AR')}
                    </td>
                    <td className="py-3 text-sm text-gray-600 text-right">{formatTime(order.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vista de tarjetas en mobile */}
          <div className="md:hidden space-y-3">
            {data.map((order) => (
              <div key={order.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">{order.customerName ?? 'Consumidor Final'}</p>
                    <p className="text-xs text-gray-500">{order.doc_number}</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ml-2 bg-green-100 text-green-700">
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-800">
                    ${order.total_amount.toLocaleString('es-AR')}
                  </span>
                  <span className="text-sm text-gray-600">{formatTime(order.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
