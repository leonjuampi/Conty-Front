import { useEffect, useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Calendar, DollarSign, ShoppingBag, TrendingUp, XCircle } from 'lucide-react';
import { getStoreReports, type StoreReports } from '../../../services/store.service';

function moneyAR(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n);
}

function todayISO() { return new Date().toISOString().slice(0, 10); }
function daysAgoISO(days: number) {
  const d = new Date(); d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function TiendaOnlineReports() {
  const [preset, setPreset] = useState<'today' | '7d' | '30d' | 'custom'>('30d');
  const [from, setFrom] = useState<string>(daysAgoISO(30));
  const [to, setTo] = useState<string>(todayISO());
  const [data, setData] = useState<StoreReports | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (preset === 'today') { setFrom(todayISO()); setTo(todayISO()); }
    else if (preset === '7d') { setFrom(daysAgoISO(7)); setTo(todayISO()); }
    else if (preset === '30d') { setFrom(daysAgoISO(30)); setTo(todayISO()); }
  }, [preset]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getStoreReports(from, to)
      .then((r) => { if (alive) setData(r); })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [from, to]);

  const deliveryPie = useMemo(() => {
    if (!data) return [];
    return [
      { name: 'Retiro', value: data.delivery_mix.pickup_count },
      { name: 'Envío', value: data.delivery_mix.delivery_count },
    ].filter((x) => x.value > 0);
  }, [data]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="inline-flex rounded-lg bg-gray-100 p-1">
          {[
            { id: 'today', label: 'Hoy' },
            { id: '7d', label: '7 días' },
            { id: '30d', label: '30 días' },
            { id: 'custom', label: 'Personalizado' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setPreset(p.id as any)}
              className={`px-3 py-1.5 rounded-md text-sm font-semibold ${preset === p.id ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {preset === 'custom' && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-gray-400" />
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="px-2 py-1 rounded border border-gray-200" />
            <span className="text-gray-400">a</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="px-2 py-1 rounded border border-gray-200" />
          </div>
        )}
      </div>

      {loading || !data ? (
        <div className="text-gray-400 py-12 text-center">Cargando reportes…</div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Vendido" value={moneyAR(data.summary.total_sold)} icon={<DollarSign className="h-5 w-5" />} gradient="from-emerald-500 to-green-600" />
            <StatCard label="Pedidos" value={String(data.summary.orders_confirmed)} icon={<ShoppingBag className="h-5 w-5" />} gradient="from-blue-500 to-indigo-600" />
            <StatCard label="Ticket promedio" value={moneyAR(data.summary.avg_ticket)} icon={<TrendingUp className="h-5 w-5" />} gradient="from-purple-500 to-fuchsia-600" />
            <StatCard label="Cancelados" value={String(data.summary.orders_cancelled)} icon={<XCircle className="h-5 w-5" />} gradient="from-gray-500 to-gray-700" />
          </div>

          {/* Sales by day */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-3">Ventas por día</h3>
            {data.sales_by_day.length === 0 ? (
              <div className="text-gray-400 text-sm text-center py-10">Sin ventas en el período</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={data.sales_by_day} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                  <Tooltip formatter={(v: number) => moneyAR(v)} />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Top products */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-3">Productos más vendidos</h3>
              {data.top_products.length === 0 ? (
                <div className="text-gray-400 text-sm text-center py-8">Sin datos</div>
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(200, data.top_products.length * 32)}>
                  <BarChart data={data.top_products} layout="vertical" margin={{ left: 20 }}>
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="product_name" tick={{ fontSize: 11 }} width={140} />
                    <Tooltip formatter={(v: number, key: string) => key === 'revenue' ? moneyAR(v) : v} />
                    <Bar dataKey="units" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Payment methods */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-3">Ventas por método de pago</h3>
              {data.by_payment_method.length === 0 ? (
                <div className="text-gray-400 text-sm text-center py-8">Sin datos</div>
              ) : (
                <div className="space-y-2">
                  {data.by_payment_method.map((pm, i) => {
                    const totalAll = data.by_payment_method.reduce((s, x) => s + x.revenue, 0) || 1;
                    const pct = (pm.revenue / totalAll) * 100;
                    return (
                      <div key={pm.name}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-semibold text-gray-700">{pm.name}</span>
                          <span className="text-gray-500">{pm.orders} pedidos · {moneyAR(pm.revenue)}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded overflow-hidden">
                          <div className="h-full" style={{ width: `${pct}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Top customers */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-3">Mejores clientes</h3>
              {data.top_customers.length === 0 ? (
                <div className="text-gray-400 text-sm text-center py-8">Sin datos</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase text-gray-500">
                    <tr><th className="py-2">Cliente</th><th>Pedidos</th><th className="text-right">Total</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.top_customers.map((c) => (
                      <tr key={`${c.customer_name}-${c.customer_phone}`}>
                        <td className="py-2">
                          <div className="font-semibold text-gray-800">{c.customer_name}</div>
                          <div className="text-xs text-gray-400">{c.customer_phone}</div>
                        </td>
                        <td className="text-gray-600">{c.orders_count}</td>
                        <td className="text-right font-bold text-emerald-600">{moneyAR(c.total_spent)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Delivery mix */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-3">Retiro vs Envío</h3>
              {deliveryPie.length === 0 ? (
                <div className="text-gray-400 text-sm text-center py-8">Sin datos</div>
              ) : (
                <div className="grid grid-cols-2 items-center">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={deliveryPie} dataKey="value" nameKey="name" outerRadius={80} label>
                        {deliveryPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 text-sm">
                    <div>
                      <div className="text-gray-500 text-xs uppercase">Retiro</div>
                      <div className="font-bold">{data.delivery_mix.pickup_count} pedidos</div>
                      <div className="text-emerald-600">{moneyAR(data.delivery_mix.pickup_revenue)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs uppercase">Envío</div>
                      <div className="font-bold">{data.delivery_mix.delivery_count} pedidos</div>
                      <div className="text-emerald-600">{moneyAR(data.delivery_mix.delivery_revenue)}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Coupons */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-3">Cupones usados</h3>
            {data.coupons.length === 0 ? (
              <div className="text-gray-400 text-sm text-center py-8">Ningún cupón aplicado en el período</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-gray-500">
                  <tr>
                    <th className="py-2">Código</th>
                    <th>Usos</th>
                    <th>Descuento otorgado</th>
                    <th className="text-right">Facturación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.coupons.map((c) => (
                    <tr key={c.code}>
                      <td className="py-2 font-mono font-bold">{c.code}</td>
                      <td>{c.uses}</td>
                      <td className="text-red-500">-{moneyAR(c.total_discount)}</td>
                      <td className="text-right font-bold text-emerald-600">{moneyAR(c.total_revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, gradient }: { label: string; value: string; icon: React.ReactNode; gradient: string }) {
  return (
    <div className={`rounded-2xl p-4 text-white bg-gradient-to-br ${gradient}`}>
      <div className="flex items-center justify-between mb-2 opacity-90">
        <span className="text-xs uppercase tracking-wide">{label}</span>
        {icon}
      </div>
      <div className="text-xl font-bold truncate">{value}</div>
    </div>
  );
}
