interface ChartEntry { date: string; total: number }

interface SalesChartProps {
  data: ChartEntry[];
}

const DAY_LABELS: Record<number, string> = { 0: 'Dom', 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb' };

export function SalesChart({ data }: SalesChartProps) {
  const maxSales = data.length > 0 ? Math.max(...data.map(d => d.total), 1) : 1;
  const totalSum = data.reduce((s, d) => s + d.total, 0);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(amount);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-2">
        <div>
          <h2 className="text-base md:text-lg font-bold text-gray-800">Ventas de la Semana</h2>
          <p className="text-xs md:text-sm text-gray-600">Últimos 7 días</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs md:text-sm text-gray-600">Total:</span>
          <span className="text-base md:text-lg font-bold text-green-600">{formatCurrency(totalSum)}</span>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-[200px] text-gray-400">
          <div className="text-center">
            <i className="ri-bar-chart-2-line text-4xl mb-2 block"></i>
            <p className="text-sm">Sin datos de ventas</p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <div className="min-w-[400px] md:min-w-0">
            <div className="flex items-end justify-between gap-2 md:gap-4" style={{ height: '220px' }}>
              {data.map((item, index) => {
                const barHeight = Math.round((item.total / maxSales) * 160);
                const dayLabel = DAY_LABELS[new Date(item.date + 'T12:00:00').getDay()] ?? item.date.slice(5, 10);
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-semibold text-gray-700 text-center leading-tight">
                      {item.total >= 1000 ? `$${(item.total / 1000).toFixed(1)}k` : `$${item.total}`}
                    </span>
                    <div
                      className="w-full bg-gradient-to-t from-orange-500 to-red-500 rounded-t-lg transition-all hover:opacity-80 cursor-pointer"
                      style={{ height: `${barHeight}px` }}
                    ></div>
                    <span className="text-xs font-medium text-gray-600">{dayLabel}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
