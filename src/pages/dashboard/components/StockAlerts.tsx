interface AlertEntry { productName: string; variantName: string; branchName: string; stock: number; minStock: number }

interface StockAlertsProps {
  data: AlertEntry[];
}

export function StockAlerts({ data }: StockAlertsProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-base md:text-lg font-bold text-gray-800">Alertas de Stock</h2>
        <i className="ri-alert-line text-xl md:text-2xl text-red-500"></i>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-6 text-gray-400">
          <i className="ri-checkbox-circle-line text-4xl mb-2 block text-green-400"></i>
          <p className="text-sm">Sin alertas de stock</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((alert, index) => {
            const level = alert.stock === 0 ? 'critical' : 'warning';
            return (
              <div
                key={index}
                className={`p-3 rounded-lg border-l-4 ${
                  level === 'critical'
                    ? 'bg-red-50 border-red-500'
                    : 'bg-yellow-50 border-yellow-500'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{alert.productName}</p>
                    <p className="text-xs text-gray-500 truncate">{alert.variantName}</p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Stock actual: <span className="font-bold">{alert.stock}</span>
                    </p>
                  </div>
                  <div className={`w-10 h-10 flex items-center justify-center rounded-lg shrink-0 ${
                    level === 'critical' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}>
                    <i className={`${
                      level === 'critical' ? 'ri-error-warning-line' : 'ri-alert-line'
                    } text-white text-lg`}></i>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${
                        level === 'critical' ? 'bg-red-500' : 'bg-yellow-500'
                      }`}
                      style={{ width: `${Math.min((alert.stock / alert.minStock) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-600 whitespace-nowrap">
                    Mín: {alert.minStock}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
