interface TopProductEntry { productName: string; quantity: number; total: number }

interface TopProductsProps {
  data: TopProductEntry[];
}

export function TopProducts({ data }: TopProductsProps) {
  const maxQty = data.length > 0 ? Math.max(...data.map(p => p.quantity), 1) : 1;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-base md:text-lg font-bold text-gray-800">Productos Más Vendidos</h2>
        <i className="ri-fire-line text-xl md:text-2xl text-orange-500"></i>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-6 text-gray-400">
          <i className="ri-inbox-line text-4xl mb-2 block"></i>
          <p className="text-sm">Sin datos del mes</p>
        </div>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {data.map((product, index) => {
            const percentage = (product.quantity / maxQty) * 100;
            return (
              <div key={index}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs md:text-sm font-medium text-gray-700 truncate pr-2">
                    {product.productName}
                  </span>
                  <span className="text-xs md:text-sm font-bold text-gray-800 whitespace-nowrap">
                    {product.quantity} uds
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  ${product.total.toLocaleString('es-AR')}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
