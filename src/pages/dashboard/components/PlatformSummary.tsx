interface PlatformEntry { platform: string; salesCount: number; total: number }

const PLATFORM_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  PARTICULAR: { label: 'Particular', icon: 'ri-store-2-line',   color: 'text-orange-600', bg: 'bg-orange-100' },
  PEDIDOSYA:  { label: 'Pedidos Ya', icon: 'ri-motorbike-line', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  RAPPI:      { label: 'Rappi',      icon: 'ri-e-bike-line',    color: 'text-red-600',    bg: 'bg-red-100' },
};

function fmt(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n);
}

export function PlatformSummary({ data = [] }: { data?: PlatformEntry[] }) {
  const total = data.reduce((s, r) => s + r.total, 0) || 1;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base md:text-lg font-bold text-gray-800">Pedidos por Plataforma</h2>
          <p className="text-xs text-gray-500 mt-0.5">Este mes</p>
        </div>
        <div className="w-10 h-10 flex items-center justify-center bg-orange-100 rounded-xl">
          <i className="ri-pie-chart-2-line text-xl text-orange-500"></i>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-6 text-gray-400">
          <i className="ri-pie-chart-2-line text-4xl mb-2 block"></i>
          <p className="text-sm">Sin ventas este mes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map(row => {
            const cfg = PLATFORM_CONFIG[row.platform.toUpperCase()] ?? PLATFORM_CONFIG.PARTICULAR;
            const pct = Math.round((row.total / total) * 100);
            return (
              <div key={row.platform}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 flex items-center justify-center rounded-lg ${cfg.bg}`}>
                      <i className={`${cfg.icon} text-sm ${cfg.color}`}></i>
                    </div>
                    <span className="text-sm font-medium text-gray-700">{cfg.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-800">{fmt(row.total)}</span>
                    <span className="text-xs text-gray-400 ml-2">({row.salesCount} ped.)</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${cfg.color.replace('text-', 'bg-')}`} style={{ width: `${pct}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
