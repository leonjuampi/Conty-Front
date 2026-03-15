import { useState, useEffect } from 'react';
import { AppLayout } from '../../components/feature/AppLayout';
import { listAuditLogs } from '../../services/audit.service';

interface AuditLog {
  id: number;
  action_type: string;
  entity_type: string | null;
  entity_id: number | null;
  details_json: Record<string, unknown> | null;
  created_at: string;
  performedBy: string | null;
  orgName: string | null;
}

const PAGE_SIZE = 50;

// Mapas de nombres legibles para claves de details_json
const FIELD_LABELS: Record<string, string> = {
  // camelCase (JS object keys)
  username: 'Usuario',
  usernameAttempt: 'Usuario intentado',
  reason: 'Motivo',
  total: 'Total',
  docNumber: 'Comprobante',
  customerName: 'Cliente',
  branchName: 'Sucursal',
  name: 'Nombre',
  email: 'Email',
  phone: 'Teléfono',
  address: 'Dirección',
  notes: 'Notas',
  updatedFields: 'Campos modificados',
  price: 'Precio',
  cost: 'Costo',
  stock: 'Stock',
  qty: 'Cantidad',
  status: 'Estado',
  role: 'Rol',
  sku: 'SKU',
  barcode: 'Código de barras',
  description: 'Descripción',
  taxId: 'CUIT/CUIL',
  context: 'Contexto',
  newName: 'Nuevo nombre',
  assignedBranchIds: 'Sucursales asignadas',
  itemsCount: 'Cantidad de ítems',
  successCount: 'Éxitos',
  errorCount: 'Errores',
  // snake_case (columnas SQL)
  category_id: 'Categoría',
  subcategory_id: 'Subcategoría',
  image_url: 'Imagen',
  vat_percent: 'IVA %',
  is_default: 'Por defecto',
  is_active: 'Activo',
  active: 'Activo',
  legal_name: 'Razón social',
  tax_id: 'CUIT/CUIL',
  tax_kind: 'Tipo impositivo',
  origin: 'Origen',
  unitPrice: 'Precio de compra',
  unit_price: 'Precio de compra',
};

function labelFor(key: string): string {
  return FIELD_LABELS[key] ?? key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export default function AuditPage() {
  const todayStr = new Date().toISOString().slice(0, 10);
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo, setDateTo] = useState(todayStr);
  const [offset, setOffset] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    setLoading(true);
    setError('');
    listAuditLogs({
      actionType: filterType || undefined,
      from: dateFrom,
      to: dateTo,
      limit: PAGE_SIZE,
      offset,
    })
      .then(res => {
        setLogs(res.items ?? []);
        setTotal(res.total ?? 0);
      })
      .catch(() => setError('Error al cargar los logs de auditoría'))
      .finally(() => setLoading(false));
  }, [filterType, dateFrom, dateTo, offset]);

  useEffect(() => { setOffset(0); }, [filterType, dateFrom, dateTo]);

  const filtered = logs.filter(log => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      (log.performedBy ?? '').toLowerCase().includes(q) ||
      (log.entity_type ?? '').toLowerCase().includes(q) ||
      Object.values(log.details_json ?? {}).some(v => String(v).toLowerCase().includes(q))
    );
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">Auditoría</h1>
        <p className="text-sm text-gray-600">Registro de actividades del sistema</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3 mb-4 flex flex-col md:flex-row md:flex-wrap md:items-center gap-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            <i className="ri-calendar-line text-gray-400 text-sm"></i>
            <span className="text-xs text-gray-500 whitespace-nowrap">Desde</span>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="text-sm text-gray-700 bg-transparent outline-none cursor-pointer" />
          </div>
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            <i className="ri-calendar-line text-gray-400 text-sm"></i>
            <span className="text-xs text-gray-500 whitespace-nowrap">Hasta</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="text-sm text-gray-700 bg-transparent outline-none cursor-pointer" />
          </div>
        </div>

        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-sm cursor-pointer text-gray-700 outline-none focus:border-orange-400"
        >
          <option value="">Todas las acciones</option>
          <option value="LOGIN_SUCCESS">Inicio de sesión</option>
          <option value="LOGIN_FAIL">Intento fallido</option>
          <option value="CREATE">Crear</option>
          <option value="UPDATE">Actualizar</option>
          <option value="DELETE">Eliminar</option>
        </select>

        <div className="flex-1 min-w-0 md:min-w-[200px]">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus-within:border-orange-400 focus-within:ring-1 focus-within:ring-orange-200 transition-all">
            <i className="ri-search-line text-gray-400 text-sm shrink-0"></i>
            <input
              type="text"
              placeholder="Buscar por usuario, entidad o detalle..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="flex-1 text-sm text-gray-700 bg-transparent outline-none placeholder-gray-400 min-w-0"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <i className="ri-close-line text-sm"></i>
              </button>
            )}
          </div>
        </div>

        {loading && <i className="ri-loader-4-line animate-spin text-orange-500 text-lg ml-auto"></i>}
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center py-16 text-red-400">
          <i className="ri-error-warning-line text-4xl mb-3"></i>
          <p className="text-sm font-semibold">{error}</p>
        </div>
      ) : (
        <>
          {/* Vista desktop */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 uppercase">Fecha y Hora</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 uppercase">Usuario</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 uppercase">Acción</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 uppercase">Entidad</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 uppercase">Detalles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-gray-400 text-sm">
                        {loading ? 'Cargando...' : 'No se encontraron registros con los filtros aplicados'}
                      </td>
                    </tr>
                  ) : filtered.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 text-sm text-gray-600 whitespace-nowrap">
                        <p>{new Date(log.created_at).toLocaleDateString('es-AR')}</p>
                        <p className="text-xs text-gray-400">{new Date(log.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 flex items-center justify-center bg-gradient-to-r from-orange-500 to-red-500 rounded-full text-white font-bold text-xs shrink-0">
                            {(log.performedBy ?? '?').charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-800">{log.performedBy ?? 'Sistema'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${getActionColor(log.action_type)}`}>
                          <i className={`${getActionIcon(log.action_type)} text-sm`}></i>
                          {getActionLabel(log.action_type)}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {log.entity_type ? (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">
                            {getEntityLabel(log.entity_type)}{log.entity_id ? ` #${log.entity_id}` : ''}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <i className="ri-eye-line text-sm"></i>
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Vista mobile */}
          <div className="md:hidden space-y-3">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <i className="ri-file-list-line text-4xl mb-3"></i>
                <p className="text-sm">{loading ? 'Cargando...' : 'No se encontraron registros'}</p>
              </div>
            ) : filtered.map(log => (
              <div key={log.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-9 h-9 flex items-center justify-center bg-gradient-to-r from-orange-500 to-red-500 rounded-full text-white font-bold text-sm shrink-0">
                      {(log.performedBy ?? '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{log.performedBy ?? 'Sistema'}</p>
                      <p className="text-xs text-gray-400">{new Date(log.created_at).toLocaleDateString('es-AR')} {new Date(log.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold shrink-0 ${getActionColor(log.action_type)}`}>
                    <i className={`${getActionIcon(log.action_type)} text-sm`}></i>
                    {getActionLabel(log.action_type)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  {log.entity_type ? (
                    <span className="text-xs font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                      {getEntityLabel(log.entity_type)}{log.entity_id ? ` #${log.entity_id}` : ''}
                    </span>
                  ) : <span />}
                  <button
                    onClick={() => setSelectedLog(log)}
                    className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-lg cursor-pointer"
                  >
                    <i className="ri-eye-line text-sm"></i>
                    Ver detalle
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 px-1">
              <p className="text-sm text-gray-500">
                Mostrando {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} de {total} registros
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                  disabled={offset === 0}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
                >
                  <i className="ri-arrow-left-s-line"></i>
                </button>
                <span className="text-sm text-gray-600">{currentPage} / {totalPages}</span>
                <button
                  onClick={() => setOffset(offset + PAGE_SIZE)}
                  disabled={offset + PAGE_SIZE >= total}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
                >
                  <i className="ri-arrow-right-s-line"></i>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de detalle */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className={`rounded-t-2xl p-4 flex items-center justify-between ${getModalHeaderColor(selectedLog.action_type)}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center bg-white/20 rounded-xl">
                  <i className={`${getActionIcon(selectedLog.action_type)} text-xl text-white`}></i>
                </div>
                <div>
                  <h2 className="text-white font-bold text-base">{getActionLabel(selectedLog.action_type)}</h2>
                  <p className="text-white/70 text-xs">
                    {new Date(selectedLog.created_at).toLocaleDateString('es-AR')} a las {new Date(selectedLog.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-lg"></i>
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Info principal */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Usuario</p>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 flex items-center justify-center bg-gradient-to-r from-orange-500 to-red-500 rounded-full text-white font-bold text-xs shrink-0">
                      {(selectedLog.performedBy ?? '?').charAt(0).toUpperCase()}
                    </div>
                    <p className="font-semibold text-gray-800 text-sm">{selectedLog.performedBy ?? 'Sistema'}</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Entidad afectada</p>
                  {selectedLog.entity_type ? (
                    <p className="font-semibold text-gray-800 text-sm">
                      {getEntityLabel(selectedLog.entity_type)}
                      {selectedLog.entity_id ? <span className="text-gray-400 font-normal"> #{selectedLog.entity_id}</span> : ''}
                    </p>
                  ) : (
                    <p className="text-gray-400 text-sm">—</p>
                  )}
                </div>
              </div>

              {/* Detalles */}
              {selectedLog.details_json && Object.keys(selectedLog.details_json).length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                    {selectedLog.action_type === 'UPDATE' ? 'Nuevos valores' : 'Información'}
                  </h3>
                  <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                    {Object.entries(selectedLog.details_json).map(([key, value]) => (
                      <div key={key} className="flex items-start justify-between px-4 py-2.5 hover:bg-gray-50 gap-4">
                        <span className="text-xs text-gray-500 shrink-0 pt-0.5 min-w-[110px]">{labelFor(key)}</span>
                        <span className="text-sm font-semibold text-gray-800 text-right break-all">{formatValue(value)}</span>
                      </div>
                    ))}
                  </div>
                  {selectedLog.action_type === 'UPDATE' && (
                    <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                      <i className="ri-information-line"></i>
                      Se muestran los nuevos valores guardados.
                    </p>
                  )}
                </div>
              )}

              <button
                onClick={() => setSelectedLog(null)}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function getModalHeaderColor(action: string) {
  const colors: Record<string, string> = {
    CREATE: 'bg-gradient-to-r from-green-500 to-emerald-600',
    UPDATE: 'bg-gradient-to-r from-teal-500 to-cyan-600',
    DELETE: 'bg-gradient-to-r from-red-500 to-rose-600',
    LOGIN_SUCCESS: 'bg-gradient-to-r from-orange-500 to-red-500',
    LOGIN_FAIL: 'bg-gradient-to-r from-red-600 to-rose-700',
  };
  return colors[action] || 'bg-gradient-to-r from-gray-500 to-gray-600';
}

function getEntityLabel(entity: string): string {
  const labels: Record<string, string> = {
    SALE: 'Venta',
    PRODUCT: 'Producto',
    CUSTOMER: 'Cliente',
    BRANCH: 'Sucursal',
    USER: 'Usuario',
    CASH_SESSION: 'Sesión de caja',
    PAYMENT_METHOD: 'Método de pago',
    CATEGORY: 'Categoría',
    STOCK: 'Stock',
    RAW_MATERIAL: 'Mercadería',
    ELABORATION_COST: 'Costo de elaboración',
  };
  return labels[entity] ?? entity;
}

function getActionIcon(action: string) {
  const icons: Record<string, string> = {
    CREATE: 'ri-add-circle-line',
    UPDATE: 'ri-edit-line',
    DELETE: 'ri-delete-bin-line',
    LOGIN_SUCCESS: 'ri-login-box-line',
    LOGIN_FAIL: 'ri-error-warning-line',
  };
  return icons[action] || 'ri-file-list-line';
}

function getActionColor(action: string) {
  const colors: Record<string, string> = {
    CREATE: 'text-green-700 bg-green-50',
    UPDATE: 'text-teal-700 bg-teal-50',
    DELETE: 'text-red-700 bg-red-50',
    LOGIN_SUCCESS: 'text-orange-700 bg-orange-50',
    LOGIN_FAIL: 'text-red-700 bg-red-100',
  };
  return colors[action] || 'text-gray-600 bg-gray-100';
}

function getActionLabel(action: string) {
  const labels: Record<string, string> = {
    CREATE: 'Crear',
    UPDATE: 'Actualizar',
    DELETE: 'Eliminar',
    LOGIN_SUCCESS: 'Inicio de sesión',
    LOGIN_FAIL: 'Intento fallido',
  };
  return labels[action] || action;
}
