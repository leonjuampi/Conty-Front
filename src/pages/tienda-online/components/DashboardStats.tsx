import { useEffect, useState } from 'react';
import { TrendingUp, ClipboardCheck, Clock } from 'lucide-react';
import { getStoreDashboard, type StoreDashboardStats } from '../../../services/store.service';

function moneyAR(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n);
}

export default function DashboardStats() {
  const [stats, setStats] = useState<StoreDashboardStats | null>(null);

  useEffect(() => {
    let alive = true;
    getStoreDashboard().then((s) => alive && setStats(s)).catch(() => {});
    const interval = setInterval(() => {
      getStoreDashboard().then((s) => alive && setStats(s)).catch(() => {});
    }, 30000);
    return () => { alive = false; clearInterval(interval); };
  }, []);

  const cards = [
    {
      label: 'Vendido hoy',
      value: stats ? moneyAR(stats.soldToday) : '—',
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'from-emerald-500 to-green-600',
    },
    {
      label: 'Pedidos confirmados',
      value: stats ? String(stats.confirmed) : '—',
      icon: <ClipboardCheck className="h-5 w-5" />,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      label: 'Por confirmar',
      value: stats ? String(stats.pending) : '—',
      icon: <Clock className="h-5 w-5" />,
      color: 'from-amber-400 to-orange-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
      {cards.map((c) => (
        <div key={c.label} className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${c.color} text-white`}>
            {c.icon}
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">{c.label}</div>
            <div className="text-2xl font-bold text-gray-900">{c.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
