import { useState, useMemo, useEffect } from 'react';
import { AppLayout } from '../../components/feature/AppLayout';
import { listSales, getSale, type Sale } from '../../services/sales.service';
import { listCustomers, type Customer } from '../../services/customers.service';
import { listSessions, type CashSession } from '../../services/cash.service';
import { getReports, type TopSeller, type TopProduct } from '../../services/reports.service';

// ── Display types ──────────────────────────────────────────────────

interface DisplaySale {
  saleId: number;
  id: string;
  date: string;
  clientName: string;
  clientId: string | null;
  total: number;
  paymentMethod: string;
  orderType: string;
  deliveryPlatform: string | null;
  seller: string;
  status: string;
}

interface DisplaySession {
  id: string;
  userName: string;
  openedAt: string;
  closedAt: string;
  totalOrders: number;
  totalSales: number;
  initialCash: number;
  totalCash: number;
  expectedCash: number;
  actualCash: number;
  cashDifference: number;
  totalCard: number;
  actualCard: number;
  cardDifference: number;
  totalMercadoPago: number;
  actualMercadoPago: number;
  mpDifference: number;
  totalsJson: Record<string, number>;
  actualJson: Record<string, number>;
}

interface TopClient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  totalSpent: number;
  totalOrders: number;
}

// ── Mappers ────────────────────────────────────────────────────────

function toDisplaySale(s: Sale): DisplaySale {
  const platform = s.deliveryPlatform?.toUpperCase() ?? null;
  const orderType = platform === 'PEDIDOSYA' ? 'Pedidos Ya'
    : platform === 'RAPPI' ? 'Rappi'
    : 'Particular';
  return {
    saleId: s.id,
    id: s.docText || `#${s.id}`,
    date: s.createdAt,
    clientName: s.customerName || 'Sin cliente',
    clientId: s.customerId ? String(s.customerId) : null,
    total: s.total,
    paymentMethod: '—',
    orderType,
    deliveryPlatform: s.deliveryPlatform ?? null,
    seller: '—',
    status: s.status,
  };
}

function toDisplaySession(s: CashSession): DisplaySession {
  const totals = s.totalsJson ?? s.totalsPerMethod ?? {};
  const actual = s.actualJson ?? {};

  const totalCash = totals.CASH ?? 0;
  const expectedCash = s.initialCash + totalCash;
  const actualCash = (actual.CASH !== undefined) ? actual.CASH : expectedCash;

  const totalCard = (totals.CREDIT_CARD ?? 0) + (totals.DEBIT_CARD ?? 0);
  const actualCard = (actual.CREDIT_CARD !== undefined || actual.DEBIT_CARD !== undefined)
    ? (actual.CREDIT_CARD ?? 0) + (actual.DEBIT_CARD ?? 0)
    : totalCard;

  const totalMp = totals.MERCADO_PAGO ?? 0;
  const actualMp = (actual.MERCADO_PAGO !== undefined) ? actual.MERCADO_PAGO : totalMp;

  return {
    id: `CAJA-${String(s.id).padStart(4, '0')}`,
    userName: s.userName,
    openedAt: s.openedAt,
    closedAt: s.closedAt || '',
    totalOrders: s.totalOrders,
    totalSales: s.totalSales,
    initialCash: s.initialCash,
    totalCash,
    expectedCash,
    actualCash,
    cashDifference: actualCash - expectedCash,
    totalCard,
    actualCard,
    cardDifference: actualCard - totalCard,
    totalMercadoPago: totalMp,
    actualMercadoPago: actualMp,
    mpDifference: actualMp - totalMp,
    totalsJson: totals,
    actualJson: actual,
  };
}

// ── Page ───────────────────────────────────────────────────────────

export default function ReportsPage() {
  const todayStr = new Date().toISOString().slice(0, 10);
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo, setDateTo] = useState(todayStr);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<'clients' | 'sellers' | 'products' | 'cash' | 'ordertype' | 'history' | 'cashhistory'>('history');
  const [selectedOrder, setSelectedOrder] = useState<DisplaySale | null>(null);
  const [saleDetail, setSaleDetail] = useState<{ items: { nameSnapshot: string; qty: number; unitPrice: number; total: number }[]; payments: { method: string; amount: number }[] } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedCashSession, setSelectedCashSession] = useState<DisplaySession | null>(null);
  const [typeDetailFilter, setTypeDetailFilter] = useState<'Particular' | 'Pedidos Ya' | 'Rappi'>('Particular');

  // API data
  const [rawSales, setRawSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [rawSessions, setRawSessions] = useState<CashSession[]>([]);
  const [topSellers, setTopSellers] = useState<TopSeller[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    listCustomers({ limit: 500 }).then(res => setCustomers(res.items)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setLoadError('');
    Promise.all([
      listSales({ from: dateFrom, to: dateTo, limit: 500 }).then(res => setRawSales(res.items)).catch(() => setRawSales([])),
      listSessions({ from: dateFrom, to: dateTo, limit: 200 }).then(res => setRawSessions(res.items)).catch((e) => {
        setRawSessions([]);
        setLoadError((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error al cargar los datos');
      }),
      getReports({ from: dateFrom, to: dateTo }).then(res => {
        setTopSellers(res.bySeller ?? []);
        setTopProducts(res.topProducts ?? []);
      }).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [dateFrom, dateTo]);

  const filteredSales = useMemo(() => rawSales.map(toDisplaySale), [rawSales]);
  const filteredSessions = useMemo(() =>
    rawSessions.filter(s => s.status === 'CLOSED').map(toDisplaySession),
    [rawSessions]
  );

  const q = searchQuery.toLowerCase().trim();

  const topClients = useMemo<TopClient[]>(() => {
    const byCustomer = new Map<string, { id: string; name: string; total: number; orders: number }>();
    for (const sale of filteredSales) {
      if (!sale.clientId) continue;
      const existing = byCustomer.get(sale.clientId);
      if (existing) {
        existing.total += sale.total;
        existing.orders += 1;
      } else {
        byCustomer.set(sale.clientId, { id: sale.clientId, name: sale.clientName, total: sale.total, orders: 1 });
      }
    }
    return Array.from(byCustomer.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .filter(c => q === '' || c.name.toLowerCase().includes(q))
      .map(c => {
        const customer = customers.find(cu => String(cu.id) === c.id);
        const nameParts = c.name.split(' ');
        return {
          id: c.id,
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          phone: customer?.phone || '—',
          address: customer?.address || '—',
          totalSpent: c.total,
          totalOrders: c.orders,
        };
      });
  }, [filteredSales, customers, q]);

  // Cash status aggregated from closed sessions
  const cashStatus = useMemo(() => {
    const totalSales = filteredSessions.reduce((a, s) => a + s.totalSales, 0);
    return {
      totalSales,
      cash: filteredSessions.reduce((a, s) => a + s.totalCash, 0),
      creditCard: filteredSessions.reduce((a, s) => a + s.totalCard, 0),
      debitCard: 0,
      mercadoPago: filteredSessions.reduce((a, s) => a + s.totalMercadoPago, 0),
      expenses: 0,
      netBalance: totalSales,
    };
  }, [filteredSessions]);

  const sumTotal = (orders: DisplaySale[]) => orders.reduce((acc, o) => acc + o.total, 0);
  const avgTicket = (orders: DisplaySale[]) => orders.length > 0 ? Math.round(sumTotal(orders) / orders.length) : 0;

  const particularSales = filteredSales.filter(o => o.orderType === 'Particular');
  const pedidosYaSales  = filteredSales.filter(o => o.orderType === 'Pedidos Ya');
  const rappiSales      = filteredSales.filter(o => o.orderType === 'Rappi');
  const appSales        = [...pedidosYaSales, ...rappiSales];

  const typeStats = {
    particular: { count: particularSales.length, total: sumTotal(particularSales), avg: avgTicket(particularSales) },
    app:        { count: appSales.length,         total: sumTotal(appSales),        avg: avgTicket(appSales) },
    pedidosYa:  { count: pedidosYaSales.length,   total: sumTotal(pedidosYaSales),  avg: avgTicket(pedidosYaSales) },
    rappi:      { count: rappiSales.length,        total: sumTotal(rappiSales),      avg: avgTicket(rappiSales) },
  };
  const totalAll = sumTotal(filteredSales) || 1;
  const pct = (n: number) => Math.round((n / totalAll) * 100);
  const particularPct = pct(typeStats.particular.total);
  const appPct        = pct(typeStats.app.total);
  const pedidosYaPct  = pct(typeStats.pedidosYa.total);
  const rappiPct      = pct(typeStats.rappi.total);

  const detailOrders = useMemo(() => {
    const base = typeDetailFilter === 'Pedidos Ya' ? pedidosYaSales
      : typeDetailFilter === 'Rappi' ? rappiSales
      : particularSales;
    return base.filter(o => q === '' || o.clientName.toLowerCase().includes(q) || o.id.toLowerCase().includes(q));
  }, [typeDetailFilter, particularSales, pedidosYaSales, rappiSales, q]);

  const historyOrders = useMemo(() =>
    filteredSales.filter(o => q === '' || o.clientName.toLowerCase().includes(q) || o.id.toLowerCase().includes(q)),
    [filteredSales, q]
  );

  const cashSessionTotals = useMemo(() => ({
    totalSales: filteredSessions.reduce((a, s) => a + s.totalSales, 0),
    totalOrders: filteredSessions.reduce((a, s) => a + s.totalOrders, 0),
    totalCash: filteredSessions.reduce((a, s) => a + s.actualCash, 0),
    totalCard: filteredSessions.reduce((a, s) => a + s.actualCard, 0),
    totalMp: filteredSessions.reduce((a, s) => a + s.actualMercadoPago, 0),
    sessionsWithDiff: filteredSessions.filter(s => s.cashDifference !== 0).length,
  }), [filteredSessions]);

  const filteredCashSessions = useMemo(() =>
    filteredSessions.filter(s =>
      q === '' ||
      s.userName.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q)
    ),
    [filteredSessions, q]
  );

  const openOrderDetail = (order: DisplaySale) => {
    setSelectedOrder(order);
    setSaleDetail(null);
    setLoadingDetail(true);
    getSale(order.saleId)
      .then(d => setSaleDetail({ items: d.items as any, payments: d.payments as any }))
      .catch(() => setSaleDetail(null))
      .finally(() => setLoadingDetail(false));
  };

  const tabs = [
    { id: 'clients', label: 'Mejores Clientes', icon: 'ri-user-star-line' },
    { id: 'sellers', label: 'Mejores Vendedores', icon: 'ri-team-line' },
    { id: 'products', label: 'Más Vendidos', icon: 'ri-shopping-bag-line' },
    { id: 'cash', label: 'Estado de Caja', icon: 'ri-money-dollar-circle-line' },
    { id: 'ordertype', label: 'Por Tipo de Pedido', icon: 'ri-pie-chart-line' },
    { id: 'history', label: 'Historial', icon: 'ri-file-list-line' },
    { id: 'cashhistory', label: 'Cierres de Caja', icon: 'ri-safe-line' }
  ];

  const detailTabs: { id: 'Particular' | 'Pedidos Ya' | 'Rappi'; label: string; icon: string; color: string; activeClass: string }[] = [
    { id: 'Particular', label: 'Particular', icon: 'ri-store-2-line', color: 'text-orange-600', activeClass: 'bg-orange-500 text-white shadow' },
    { id: 'Pedidos Ya', label: 'Pedidos Ya', icon: 'ri-motorbike-line', color: 'text-yellow-600', activeClass: 'bg-yellow-500 text-white shadow' },
    { id: 'Rappi', label: 'Rappi', icon: 'ri-e-bike-line', color: 'text-red-600', activeClass: 'bg-red-500 text-white shadow' }
  ];

  return (
    <AppLayout>
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-3xl font-bold text-gray-800 mb-1">Reportes</h1>
        <p className="text-sm text-gray-600">Análisis y estadísticas de ventas</p>
      </div>

      {/* Barra de filtros global */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3 mb-4 flex flex-col md:flex-row md:flex-wrap md:items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 shrink-0">
          <div className="w-5 h-5 flex items-center justify-center">
            <i className="ri-filter-3-line text-orange-500 text-base"></i>
          </div>
          Filtros
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 w-full sm:w-auto">
            <div className="w-4 h-4 flex items-center justify-center">
              <i className="ri-calendar-line text-gray-400 text-sm"></i>
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap">Desde</span>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="text-sm text-gray-700 bg-transparent outline-none cursor-pointer w-full" />
          </div>
          <div className="hidden sm:block w-3 h-px bg-gray-300"></div>
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 w-full sm:w-auto">
            <div className="w-4 h-4 flex items-center justify-center">
              <i className="ri-calendar-line text-gray-400 text-sm"></i>
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap">Hasta</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="text-sm text-gray-700 bg-transparent outline-none cursor-pointer w-full" />
          </div>
        </div>
        <div className="flex-1 min-w-0 md:min-w-[200px]">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus-within:border-orange-400 focus-within:ring-1 focus-within:ring-orange-200 transition-all">
            <div className="w-4 h-4 flex items-center justify-center shrink-0">
              <i className="ri-search-line text-gray-400 text-sm"></i>
            </div>
            <input type="text" placeholder="Buscar..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="flex-1 text-sm text-gray-700 bg-transparent outline-none placeholder-gray-400 min-w-0" />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer">
                <i className="ri-close-line text-sm"></i>
              </button>
            )}
          </div>
        </div>
        {(searchQuery || dateFrom !== firstOfMonth || dateTo !== todayStr) && (
          <button onClick={() => { setSearchQuery(''); setDateFrom(firstOfMonth); setDateTo(todayStr); }} className="flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-700 font-medium cursor-pointer whitespace-nowrap bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 transition-colors">
            <div className="w-3 h-3 flex items-center justify-center"><i className="ri-refresh-line text-xs"></i></div>
            Limpiar filtros
          </button>
        )}
        {loading && <i className="ri-loader-4-line animate-spin text-orange-500 text-lg ml-auto"></i>}
      </div>

      {/* Contenedor principal */}
      <div className="bg-white rounded-xl shadow-md mb-6 flex flex-col md:flex-row min-h-[500px]">

        {/* MÓVIL: tabs horizontales */}
        <div className="md:hidden overflow-x-auto border-b border-gray-100">
          <div className="flex gap-1 px-3 py-2 min-w-max">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setSelectedReport(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-xs transition-all cursor-pointer whitespace-nowrap ${selectedReport === tab.id ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md' : 'text-gray-600 bg-gray-50 hover:bg-orange-50 hover:text-orange-600'}`}>
                <i className={`${tab.icon} text-sm`}></i>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ESCRITORIO: menú lateral */}
        <div className="hidden md:flex w-56 shrink-0 border-r border-gray-100 py-4 flex-col gap-1">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setSelectedReport(tab.id as any)}
              className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg font-medium text-sm transition-all cursor-pointer text-left whitespace-nowrap ${selectedReport === tab.id ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md' : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'}`}>
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                <i className={`${tab.icon} text-base`}></i>
              </div>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenido del reporte */}
        <div className="flex-1 p-4 md:p-6 overflow-auto min-w-0">

          {/* ── Mejores Clientes ── */}
          {selectedReport === 'clients' && (
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4">Top 5 Mejores Clientes</h2>
              {topClients.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <div className="w-12 h-12 flex items-center justify-center mb-3"><i className="ri-user-search-line text-4xl"></i></div>
                  <p className="text-sm">No se encontraron clientes con los filtros aplicados</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topClients.map((client, index) => (
                    <div key={client.id} className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-3 md:p-4 border border-orange-200 flex justify-between items-center gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 md:w-12 md:h-12 shrink-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-base md:text-lg">{index + 1}</div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-800 text-sm md:text-base truncate">{client.firstName} {client.lastName}</h3>
                          <p className="text-xs md:text-sm text-gray-600">{client.phone}</p>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">{client.address}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg md:text-2xl font-bold text-orange-600">${client.totalSpent.toLocaleString()}</p>
                        <p className="text-xs md:text-sm text-gray-600">{client.totalOrders} pedidos</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Mejores Vendedores ── */}
          {selectedReport === 'sellers' && (
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4">Rendimiento de Vendedores</h2>
              {topSellers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <div className="w-12 h-12 flex items-center justify-center mb-3"><i className="ri-team-line text-4xl"></i></div>
                  <p className="text-sm">Sin datos de vendedores en el período seleccionado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Vendedor</th>
                        <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase">Pedidos</th>
                        <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase">Total Vendido</th>
                        <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase">Ticket Prom.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {topSellers.map((s, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-3 py-2.5 text-gray-400 font-medium">{i + 1}</td>
                          <td className="px-3 py-2.5 font-medium text-gray-800">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                                <i className="ri-user-line text-orange-500 text-sm"></i>
                              </div>
                              {s.sellerName || 'Sin asignar'}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-right text-gray-700">{Number(s.orders).toLocaleString()}</td>
                          <td className="px-3 py-2.5 text-right font-semibold text-gray-800">${Number(s.total).toLocaleString()}</td>
                          <td className="px-3 py-2.5 text-right text-gray-600">${s.orders > 0 ? Math.round(Number(s.total) / Number(s.orders)).toLocaleString() : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Más Vendidos ── */}
          {selectedReport === 'products' && (
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4">Productos Más Vendidos</h2>
              {topProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <div className="w-12 h-12 flex items-center justify-center mb-3"><i className="ri-shopping-bag-line text-4xl"></i></div>
                  <p className="text-sm">Sin datos de productos en el período seleccionado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Producto</th>
                        <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase">Unidades</th>
                        <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase">Total Vendido</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {topProducts.map((p, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-3 py-2.5 text-gray-400 font-medium">{i + 1}</td>
                          <td className="px-3 py-2.5 font-medium text-gray-800">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                                <i className="ri-shopping-bag-line text-orange-500 text-sm"></i>
                              </div>
                              {p.productName}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-right text-gray-700">{Number(p.quantity).toLocaleString()}</td>
                          <td className="px-3 py-2.5 text-right font-semibold text-gray-800">${Number(p.total).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Estado de Caja ── */}
          {selectedReport === 'cash' && (
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4 md:mb-6">Estado de Caja</h2>
              <div className="mb-6">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 md:p-6 border border-green-200 flex justify-between items-center">
                  <div><p className="text-sm text-gray-600 mb-1">Ventas Totales</p><p className="text-2xl md:text-3xl font-bold text-green-600">${cashStatus.totalSales.toLocaleString()}</p></div>
                  <i className="ri-arrow-up-circle-line text-4xl md:text-5xl text-green-500"></i>
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Desglose por Método de Pago</h3>
                <div className="space-y-3">
                  {[
                    { icon: 'ri-money-dollar-circle-line', color: 'text-green-600', label: 'Efectivo', value: cashStatus.cash },
                    { icon: 'ri-bank-card-line', color: 'text-orange-600', label: 'Tarjeta', value: cashStatus.creditCard },
                    { icon: 'ri-smartphone-line', color: 'text-teal-600', label: 'Mercado Pago', value: cashStatus.mercadoPago }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3"><i className={`${item.icon} text-xl md:text-2xl ${item.color}`}></i><span className="font-medium text-gray-700 text-sm">{item.label}</span></div>
                      <span className="font-bold text-gray-800 text-sm">${item.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Por Tipo de Pedido ── */}
          {selectedReport === 'ordertype' && (
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4 md:mb-5">Reporte por Tipo de Pedido</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-200 p-4 md:p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center bg-orange-500 rounded-lg text-white shrink-0">
                      <i className="ri-store-2-line text-lg md:text-xl"></i>
                    </div>
                    <h3 className="text-base md:text-lg font-bold text-gray-800">Particular</h3>
                    <span className="ml-auto bg-orange-100 text-orange-700 text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap">{particularPct}% del total</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 md:gap-3">
                    <div className="bg-white rounded-lg p-3 border border-orange-100"><p className="text-xs text-gray-500 mb-1">Pedidos</p><p className="text-xl md:text-2xl font-bold text-orange-600">{typeStats.particular.count}</p></div>
                    <div className="bg-white rounded-lg p-3 border border-orange-100"><p className="text-xs text-gray-500 mb-1">Total facturado</p><p className="text-base md:text-xl font-bold text-gray-800">${typeStats.particular.total.toLocaleString()}</p></div>
                    <div className="bg-white rounded-lg p-3 border border-orange-100 col-span-2"><p className="text-xs text-gray-500 mb-1">Ticket promedio</p><p className="text-base md:text-xl font-bold text-gray-800">${typeStats.particular.avg.toLocaleString()}</p></div>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Participación en ventas</span><span>{particularPct}%</span></div>
                    <div className="w-full bg-orange-100 rounded-full h-2"><div className="bg-orange-500 h-2 rounded-full transition-all" style={{ width: `${particularPct}%` }}></div></div>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  {/* Pedidos Ya */}
                  <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl border border-yellow-200 p-4 md:p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 flex items-center justify-center bg-yellow-400 rounded-lg text-white shrink-0">
                        <i className="ri-motorbike-line text-lg"></i>
                      </div>
                      <h3 className="text-base font-bold text-gray-800">Pedidos Ya</h3>
                      <span className="ml-auto bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap">{pedidosYaPct}% del total</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white rounded-lg p-2.5 border border-yellow-100"><p className="text-xs text-gray-500 mb-1">Pedidos</p><p className="text-xl font-bold text-yellow-600">{typeStats.pedidosYa.count}</p></div>
                      <div className="bg-white rounded-lg p-2.5 border border-yellow-100"><p className="text-xs text-gray-500 mb-1">Total</p><p className="text-sm font-bold text-gray-800">${typeStats.pedidosYa.total.toLocaleString()}</p></div>
                    </div>
                    <div className="mt-3">
                      <div className="w-full bg-yellow-100 rounded-full h-2"><div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${pedidosYaPct}%` }}></div></div>
                    </div>
                  </div>
                  {/* Rappi */}
                  <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl border border-red-200 p-4 md:p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 flex items-center justify-center bg-red-500 rounded-lg text-white shrink-0">
                        <i className="ri-e-bike-line text-lg"></i>
                      </div>
                      <h3 className="text-base font-bold text-gray-800">Rappi</h3>
                      <span className="ml-auto bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap">{rappiPct}% del total</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white rounded-lg p-2.5 border border-red-100"><p className="text-xs text-gray-500 mb-1">Pedidos</p><p className="text-xl font-bold text-red-600">{typeStats.rappi.count}</p></div>
                      <div className="bg-white rounded-lg p-2.5 border border-red-100"><p className="text-xs text-gray-500 mb-1">Total</p><p className="text-sm font-bold text-gray-800">${typeStats.rappi.total.toLocaleString()}</p></div>
                    </div>
                    <div className="mt-3">
                      <div className="w-full bg-red-100 rounded-full h-2"><div className="bg-red-500 h-2 rounded-full" style={{ width: `${rappiPct}%` }}></div></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <h3 className="font-bold text-gray-800">Detalle de pedidos</h3>
                  <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                    <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
                      {detailTabs.map(tab => (
                        <button key={tab.id} onClick={() => setTypeDetailFilter(tab.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${typeDetailFilter === tab.id ? tab.activeClass : 'text-gray-600 hover:text-gray-800'}`}>
                          <i className={`${tab.icon} text-xs`}></i>
                          {tab.label}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        const headers = ['ID', 'Fecha', 'Hora', 'Cliente', 'Total', 'Tipo'];
                        const rows = detailOrders.map(o => [
                          o.id,
                          new Date(o.date).toLocaleDateString('es-AR'),
                          new Date(o.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
                          `"${o.clientName.replace(/"/g, '""')}"`,
                          o.total,
                          o.orderType,
                        ]);
                        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
                        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `pedidos_${typeDetailFilter.replace(/ /g, '_')}_${dateFrom}_${dateTo}.csv`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <i className="ri-download-2-line text-xs"></i>
                      Exportar CSV
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
                  <table className="w-full min-w-[560px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Fecha</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Cliente</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Total</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Ver</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {detailOrders.length === 0 ? (
                        <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">No hay pedidos que coincidan con los filtros</td></tr>
                      ) : detailOrders.map(order => (
                        <tr key={order.id} className="hover:bg-orange-50 transition-colors">
                          <td className="px-3 py-2.5 text-xs font-medium text-gray-800">{order.id}</td>
                          <td className="px-3 py-2.5 text-xs text-gray-600 whitespace-nowrap">
                            <p>{new Date(order.date).toLocaleDateString('es-AR')}</p>
                            <p className="text-gray-400">{new Date(order.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</p>
                          </td>
                          <td className="px-3 py-2.5 text-xs text-gray-600">{order.clientName}</td>
                          <td className="px-3 py-2.5 text-xs font-semibold text-gray-800 whitespace-nowrap">${order.total.toLocaleString()}</td>
                          <td className="px-3 py-2.5">
                            <button onClick={() => openOrderDetail(order)}
                              className="w-7 h-7 flex items-center justify-center bg-orange-100 hover:bg-orange-200 text-orange-600 rounded-lg transition-colors cursor-pointer">
                              <i className="ri-eye-line text-sm"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Historial ── */}
          {selectedReport === 'history' && (
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4">Historial de Pedidos</h2>
              <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
                <table className="w-full min-w-[500px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Comprobante</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Fecha</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Cliente</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Total</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Ver</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {historyOrders.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">No hay pedidos que coincidan con los filtros</td></tr>
                    ) : historyOrders.map(order => (
                      <tr key={order.id} className="hover:bg-orange-50 transition-colors">
                        <td className="px-3 py-2.5 text-xs font-medium text-gray-800">{order.id}</td>
                        <td className="px-3 py-2.5 text-xs text-gray-600 whitespace-nowrap">
                          <p>{new Date(order.date).toLocaleDateString('es-AR')}</p>
                          <p className="text-gray-400">{new Date(order.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</p>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-gray-600">{order.clientName}</td>
                        <td className="px-3 py-2.5 text-xs font-semibold text-gray-800 whitespace-nowrap">${order.total.toLocaleString()}</td>
                        <td className="px-3 py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                            {order.status === 'COMPLETED' ? 'Completado' : order.status === 'CANCELLED' ? 'Cancelado' : order.status}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <button onClick={() => openOrderDetail(order)} className="w-7 h-7 flex items-center justify-center bg-orange-100 hover:bg-orange-200 text-orange-600 rounded-lg transition-colors cursor-pointer">
                            <i className="ri-eye-line text-sm"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Cierres de Caja ── */}
          {selectedReport === 'cashhistory' && (
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4 md:mb-5">Historial de Cierres de Caja</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-5 md:mb-6">
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-3 md:p-4">
                  <p className="text-xs text-gray-500 mb-1">Total Facturado</p>
                  <p className="text-base md:text-xl font-bold text-orange-600">${cashSessionTotals.totalSales.toLocaleString('es-AR')}</p>
                  <p className="text-xs text-gray-400 mt-1">{filteredCashSessions.length} turnos</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3 md:p-4">
                  <p className="text-xs text-gray-500 mb-1">Efectivo Total</p>
                  <p className="text-base md:text-xl font-bold text-green-600">${cashSessionTotals.totalCash.toLocaleString('es-AR')}</p>
                  <p className="text-xs text-gray-400 mt-1">Contado real</p>
                </div>
                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-xl p-3 md:p-4">
                  <p className="text-xs text-gray-500 mb-1">Tarjetas + MP</p>
                  <p className="text-base md:text-xl font-bold text-teal-600">${(cashSessionTotals.totalCard + cashSessionTotals.totalMp).toLocaleString('es-AR')}</p>
                  <p className="text-xs text-gray-400 mt-1">Digital total</p>
                </div>
                <div className={`rounded-xl p-3 md:p-4 border ${cashSessionTotals.sessionsWithDiff > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                  <p className="text-xs text-gray-500 mb-1">Con diferencia</p>
                  <p className={`text-base md:text-xl font-bold ${cashSessionTotals.sessionsWithDiff > 0 ? 'text-red-600' : 'text-gray-600'}`}>{cashSessionTotals.sessionsWithDiff}</p>
                  <p className="text-xs text-gray-400 mt-1">de {filteredCashSessions.length} turnos</p>
                </div>
              </div>
              {loadError ? (
                <div className="flex flex-col items-center justify-center py-16 text-red-400">
                  <div className="w-12 h-12 flex items-center justify-center mb-3"><i className="ri-error-warning-line text-4xl"></i></div>
                  <p className="text-sm font-semibold">Error al cargar los datos</p>
                  <p className="text-xs mt-1">{loadError}</p>
                </div>
              ) : filteredCashSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <div className="w-12 h-12 flex items-center justify-center mb-3"><i className="ri-safe-line text-4xl"></i></div>
                  <p className="text-sm">No se encontraron cierres de caja con los filtros aplicados</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0 rounded-xl border border-gray-200">
                  <table className="w-full min-w-[620px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Cajero</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Apertura</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Cierre</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Pedidos</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Total</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Diferencia</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Ver</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredCashSessions.map(session => {
                        const hasDiff = session.cashDifference !== 0;
                        return (
                          <tr key={session.id} className="hover:bg-orange-50 transition-colors">
                            <td className="px-3 py-2.5 text-xs font-medium text-gray-700">{session.id}</td>
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-1.5">
                                <div className="w-6 h-6 flex items-center justify-center bg-orange-100 rounded-full shrink-0"><i className="ri-user-line text-orange-600 text-xs"></i></div>
                                <span className="text-xs text-gray-700 whitespace-nowrap">{session.userName}</span>
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-xs text-gray-600 whitespace-nowrap">
                              <p>{new Date(session.openedAt).toLocaleDateString('es-AR')}</p>
                              <p className="text-gray-400">{new Date(session.openedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</p>
                            </td>
                            <td className="px-3 py-2.5 text-xs text-gray-600 whitespace-nowrap">
                              <p>{new Date(session.closedAt).toLocaleDateString('es-AR')}</p>
                              <p className="text-gray-400">{new Date(session.closedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</p>
                            </td>
                            <td className="px-3 py-2.5 text-xs text-center font-semibold text-gray-700">{session.totalOrders}</td>
                            <td className="px-3 py-2.5 text-xs font-bold text-orange-600 whitespace-nowrap">${session.totalSales.toLocaleString('es-AR')}</td>
                            <td className="px-3 py-2.5">
                              {hasDiff ? (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${session.cashDifference > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  <i className={`${session.cashDifference > 0 ? 'ri-arrow-up-line' : 'ri-arrow-down-line'} text-xs`}></i>
                                  ${Math.abs(session.cashDifference).toLocaleString('es-AR')}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 whitespace-nowrap">
                                  <i className="ri-check-line text-xs"></i>OK
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2.5">
                              <button onClick={() => setSelectedCashSession(session)} className="w-7 h-7 flex items-center justify-center bg-orange-100 hover:bg-orange-200 text-orange-600 rounded-lg transition-colors cursor-pointer">
                                <i className="ri-eye-line text-sm"></i>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Detalle Pedido */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-t-2xl p-4 md:p-5 flex items-center justify-between">
              <div>
                <h2 className="text-white font-bold text-base md:text-lg">Detalle del Pedido</h2>
                <p className="text-orange-100 text-sm">{selectedOrder.id}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors cursor-pointer">
                <i className="ri-close-line text-lg"></i>
              </button>
            </div>
            <div className="p-4 md:p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500 mb-1">Cliente</p><p className="font-semibold text-gray-800 text-sm">{selectedOrder.clientName}</p></div>
                <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500 mb-1">Fecha y Hora</p><p className="font-semibold text-gray-800 text-sm">{new Date(selectedOrder.date).toLocaleDateString('es-AR')}</p><p className="text-xs text-gray-500">{new Date(selectedOrder.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</p></div>
                <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500 mb-1">Estado</p><p className="font-semibold text-gray-800 text-sm">{selectedOrder.status}</p></div>
                <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500 mb-1">Tipo</p><p className="font-semibold text-gray-800 text-sm">{selectedOrder.orderType}</p></div>
              </div>

              {/* Ítems del pedido */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Productos</h3>
                {loadingDetail ? (
                  <div className="flex justify-center py-4"><i className="ri-loader-4-line animate-spin text-xl text-orange-500"></i></div>
                ) : saleDetail && saleDetail.items.length > 0 ? (
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
                        {saleDetail.items.map((item, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2 text-xs text-gray-800">{item.nameSnapshot}</td>
                            <td className="px-3 py-2 text-xs text-center text-gray-700">{item.qty}</td>
                            <td className="px-3 py-2 text-xs text-right text-gray-700">${item.unitPrice.toLocaleString()}</td>
                            <td className="px-3 py-2 text-xs text-right font-semibold text-gray-800">${item.total.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 text-center py-3">Sin ítems</p>
                )}
              </div>

              {/* Método de pago */}
              {saleDetail && saleDetail.payments.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Pago</h3>
                  <div className="space-y-1">
                    {saleDetail.payments.map((p, i) => (
                      <div key={i} className="flex justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                        <span className="text-gray-600">{p.method}</span>
                        <span className="font-semibold text-gray-800">${p.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200 flex justify-between items-center">
                <span className="font-bold text-gray-800">Total</span>
                <span className="text-xl font-bold text-orange-600">${selectedOrder.total.toLocaleString()}</span>
              </div>
              <button onClick={() => { setSelectedOrder(null); setSaleDetail(null); }} className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all cursor-pointer whitespace-nowrap">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalle Cierre de Caja */}
      {selectedCashSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-t-2xl p-4 md:p-5 flex items-center justify-between">
              <div>
                <h2 className="text-white font-bold text-base md:text-lg">Detalle de Cierre de Caja</h2>
                <p className="text-orange-100 text-sm">{selectedCashSession.id}</p>
              </div>
              <button onClick={() => setSelectedCashSession(null)} className="w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors cursor-pointer">
                <i className="ri-close-line text-lg"></i>
              </button>
            </div>
            <div className="p-4 md:p-6 space-y-4 md:space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 md:p-4"><p className="text-xs text-gray-500 mb-1">Cajero</p><p className="font-semibold text-gray-800 text-sm">{selectedCashSession.userName}</p></div>
                <div className="bg-gray-50 rounded-xl p-3 md:p-4"><p className="text-xs text-gray-500 mb-1">Pedidos del turno</p><p className="font-semibold text-gray-800 text-sm">{selectedCashSession.totalOrders} pedidos</p></div>
                <div className="bg-gray-50 rounded-xl p-3 md:p-4">
                  <p className="text-xs text-gray-500 mb-1">Apertura</p>
                  <p className="font-semibold text-gray-800 text-sm">{new Date(selectedCashSession.openedAt).toLocaleDateString('es-AR')}</p>
                  <p className="text-xs text-gray-400">{new Date(selectedCashSession.openedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 md:p-4">
                  <p className="text-xs text-gray-500 mb-1">Cierre</p>
                  <p className="font-semibold text-gray-800 text-sm">{new Date(selectedCashSession.closedAt).toLocaleDateString('es-AR')}</p>
                  <p className="text-xs text-gray-400">{new Date(selectedCashSession.closedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="col-span-2 bg-green-50 border border-green-200 rounded-xl p-3 md:p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <i className="ri-safe-line text-green-600 text-lg"></i>
                    <p className="text-xs text-gray-600 font-medium">Efectivo Inicial</p>
                  </div>
                  <p className="font-bold text-green-700 text-sm">${selectedCashSession.initialCash.toLocaleString('es-AR')}</p>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm md:text-base">
                  <i className="ri-bank-card-line text-orange-500"></i>
                  Desglose por Método de Pago
                </h3>
                <div className="border border-gray-200 rounded-xl overflow-hidden overflow-x-auto">
                  <table className="w-full min-w-[340px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Método</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Esperado</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Real</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Dif.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {Object.keys(selectedCashSession.totalsJson).map((key) => {
                        const labelMap: Record<string, string> = {
                          CASH: 'Efectivo', CREDIT_CARD: 'Tarjeta de Crédito', DEBIT_CARD: 'Tarjeta de Débito',
                          BANK_TRANSFER: 'Transferencia', MERCADO_PAGO: 'Mercado Pago',
                        };
                        const iconMap: Record<string, string> = {
                          CASH: 'ri-money-dollar-circle-line', CREDIT_CARD: 'ri-bank-card-line', DEBIT_CARD: 'ri-bank-card-2-line',
                          BANK_TRANSFER: 'ri-bank-line', MERCADO_PAGO: 'ri-smartphone-line',
                        };
                        const salesAmt = selectedCashSession.totalsJson[key] ?? 0;
                        const expected = key === 'CASH' ? selectedCashSession.initialCash + salesAmt : salesAmt;
                        const actualAmt = selectedCashSession.actualJson[key] !== undefined ? selectedCashSession.actualJson[key] : expected;
                        const diff = actualAmt - expected;
                        return (
                          <tr key={key} className="hover:bg-orange-50 transition-colors">
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-2">
                                <i className={`${iconMap[key] ?? 'ri-wallet-line'} text-orange-500 text-sm`}></i>
                                <span className="text-xs text-gray-700">{labelMap[key] ?? key}</span>
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-xs text-gray-600 text-right">${expected.toLocaleString('es-AR')}</td>
                            <td className="px-3 py-2.5 text-xs font-semibold text-gray-800 text-right">${actualAmt.toLocaleString('es-AR')}</td>
                            <td className="px-3 py-2.5 text-right">
                              {diff === 0 ? (
                                <span className="text-xs text-gray-400">—</span>
                              ) : (
                                <span className={`text-xs font-bold ${diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {diff > 0 ? '+' : ''}${diff.toLocaleString('es-AR')}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-800 text-sm">Total Ventas del Turno</span>
                  <span className="text-lg md:text-xl font-bold text-orange-600">${selectedCashSession.totalSales.toLocaleString('es-AR')}</span>
                </div>
              </div>
              <button onClick={() => setSelectedCashSession(null)} className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all cursor-pointer whitespace-nowrap">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
