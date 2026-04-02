import { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '../../components/feature/AppLayout';
import {
  listOrgs, updateOrgPlan, listDevices, revokeDevice,
  OrgItem, DeviceItem,
} from '../../services/superadmin.service';

const PLAN_LABELS: Record<string, string> = {
  BASIC: 'Básico',
  PROFESSIONAL: 'Profesional',
  ENTERPRISE: 'Empresarial',
};

const PLAN_COLORS: Record<string, string> = {
  BASIC: 'bg-gray-100 text-gray-700',
  PROFESSIONAL: 'bg-blue-100 text-blue-700',
  ENTERPRISE: 'bg-purple-100 text-purple-700',
};

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function parseUserAgent(ua: string | null): { browser: string; os: string; device: string } {
  if (!ua) return { browser: 'Desconocido', os: 'Desconocido', device: 'desktop' };

  let browser = 'Otro';
  if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('OPR/') || ua.includes('Opera')) browser = 'Opera';
  else if (ua.includes('Chrome/') && !ua.includes('Edg/')) browser = 'Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Safari';
  else if (ua.includes('Firefox/')) browser = 'Firefox';

  let os = 'Otro';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Linux')) os = 'Linux';

  const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
  const isTablet = /iPad|Tablet/i.test(ua);
  const device = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';

  return { browser, os, device };
}

function deviceIcon(device: string) {
  if (device === 'mobile') return 'ri-smartphone-line';
  if (device === 'tablet') return 'ri-tablet-line';
  return 'ri-computer-line';
}

function limitLabel(value: number | null) {
  return value === null ? '∞' : String(value);
}

/* ─── Modal: Editar plan ─────────────────────────────────────────── */
interface EditPlanModalProps {
  org: OrgItem;
  onClose: () => void;
  onSaved: () => void;
}

const ORG_TYPE_LABELS: Record<string, string> = {
  FOOD: 'Comida / Restaurante',
  RETAIL: 'Retail / Tienda',
};

function EditPlanModal({ org, onClose, onSaved }: EditPlanModalProps) {
  const [plan, setPlan] = useState(org.plan);
  const [maxLicenses, setMaxLicenses] = useState(org.max_licenses);
  const [expiresAt, setExpiresAt] = useState(
    org.plan_expires_at ? org.plan_expires_at.slice(0, 10) : ''
  );
  const [orgType, setOrgType] = useState<'FOOD' | 'RETAIL'>(org.org_type ?? 'RETAIL');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const ceilings: Record<string, number | null> = {
    BASIC: 1,
    PROFESSIONAL: 5,
    ENTERPRISE: null,
  };
  const ceiling = ceilings[plan];

  async function handleSave() {
    setError('');
    setSaving(true);
    try {
      await updateOrgPlan(org.id, plan, maxLicenses, expiresAt || null, orgType);
      onSaved();
      onClose();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Editar plan — {org.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        <div className="space-y-4">
          {/* Plan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
            <select
              value={plan}
              onChange={e => {
                const p = e.target.value as OrgItem['plan'];
                setPlan(p);
                const c = ceilings[p];
                if (c !== null && maxLicenses > c) setMaxLicenses(c);
                if (c === 1) setMaxLicenses(1);
              }}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              <option value="BASIC">Básico</option>
              <option value="PROFESSIONAL">Profesional</option>
              <option value="ENTERPRISE">Empresarial</option>
            </select>
          </div>

          {/* Tipo de negocio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de negocio</label>
            <select
              value={orgType}
              onChange={e => setOrgType(e.target.value as 'FOOD' | 'RETAIL')}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {Object.entries(ORG_TYPE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">Define la estética del sistema para esta organización.</p>
          </div>

          {/* Licencias */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Licencias contratadas
              {ceiling !== null && <span className="text-gray-400 font-normal"> (máx. {ceiling})</span>}
              {ceiling === null && <span className="text-gray-400 font-normal"> (ilimitado)</span>}
            </label>
            <input
              type="number"
              min={1}
              max={ceiling ?? 999}
              value={maxLicenses}
              onChange={e => setMaxLicenses(Number(e.target.value))}
              disabled={plan === 'ENTERPRISE'}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:bg-gray-50 disabled:text-gray-400"
            />
            {plan === 'ENTERPRISE' && (
              <p className="text-xs text-gray-400 mt-1">El plan Empresarial tiene licencias ilimitadas.</p>
            )}
          </div>

          {/* Vencimiento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vencimiento del plan</label>
            <input
              type="date"
              value={expiresAt}
              onChange={e => setExpiresAt(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            <p className="text-xs text-gray-400 mt-1">Dejá en blanco si no tiene vencimiento.</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2.5 rounded-xl">
              <i className="ri-error-warning-line"></i>
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 cursor-pointer">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-xl disabled:opacity-60 cursor-pointer"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Modal: Dispositivos ────────────────────────────────────────── */
interface DevicesModalProps {
  org: OrgItem;
  onClose: () => void;
}

function DevicesModal({ org, onClose }: DevicesModalProps) {
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setDevices(await listDevices(org.id));
    } finally {
      setLoading(false);
    }
  }, [org.id]);

  useEffect(() => { load(); }, [load]);

  async function handleRevoke(deviceRowId: number) {
    setRevoking(deviceRowId);
    try {
      await revokeDevice(org.id, deviceRowId);
      await load();
    } finally {
      setRevoking(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Dispositivos — {org.name}</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {org.active_devices} activo{org.active_devices !== 1 ? 's' : ''} de {limitLabel(org.max_licenses)} licencia{org.max_licenses !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <i className="ri-loader-4-line animate-spin text-2xl text-gray-400"></i>
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">No hay dispositivos registrados.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {devices.map(d => {
              const parsed = parseUserAgent(d.user_agent);
              return (
                <div key={d.id} className="py-4 gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${d.is_active ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <i className={`${deviceIcon(parsed.device)} text-lg ${d.is_active ? 'text-green-600' : 'text-gray-400'}`}></i>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-800">
                            {parsed.browser} · {parsed.os}
                          </p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${d.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {d.is_active ? 'Activo' : 'Revocado'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                          <span className="text-xs text-gray-500">
                            <i className="ri-time-line mr-1"></i>
                            {formatDateTime(d.last_seen)}
                          </span>
                          {d.ip_address && (
                            <span className="text-xs text-gray-500">
                              <i className="ri-global-line mr-1"></i>
                              {d.ip_address}
                            </span>
                          )}
                          {d.registered_by_name && (
                            <span className="text-xs text-gray-500">
                              <i className="ri-user-line mr-1"></i>
                              {d.registered_by_name}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-300 mt-1 truncate">{d.device_id}</p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {d.is_active === 1 && (
                        <button
                          onClick={() => handleRevoke(d.id)}
                          disabled={revoking === d.id}
                          className="text-xs text-red-500 hover:text-red-700 font-medium cursor-pointer disabled:opacity-50 px-2 py-1 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          {revoking === d.id ? 'Revocando...' : 'Revocar'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 cursor-pointer">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Página principal ───────────────────────────────────────────── */
export default function SuperAdminPage() {
  const [orgs, setOrgs] = useState<OrgItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editOrg, setEditOrg] = useState<OrgItem | null>(null);
  const [devicesOrg, setDevicesOrg] = useState<OrgItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setOrgs(await listOrgs());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = orgs.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    (o.legal_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Panel Super Admin</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión de organizaciones, planes y licencias</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Organizaciones</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{orgs.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Dispositivos activos</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{orgs.reduce((s, o) => s + Number(o.active_devices), 0)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Plan Básico</p>
            <p className="text-3xl font-bold text-gray-600 mt-1">{orgs.filter(o => o.plan === 'BASIC').length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Plan Pro / Emp.</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{orgs.filter(o => o.plan !== 'BASIC').length}</p>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Organizaciones</h2>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="ri-search-line text-gray-400 text-sm"></i>
              </div>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="pl-8 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 w-52"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <i className="ri-loader-4-line animate-spin text-2xl text-gray-400"></i>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">No se encontraron organizaciones.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Organización</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Plan</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Productos</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sucursales</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Dispositivos</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vence</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(org => (
                    <tr key={org.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-800">{org.name}</p>
                        {org.legal_name && org.legal_name !== org.name && (
                          <p className="text-xs text-gray-400">{org.legal_name}</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${PLAN_COLORS[org.plan]}`}>
                          {PLAN_LABELS[org.plan]}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${org.org_type === 'FOOD' ? 'bg-brand-100 text-brand-700' : 'bg-blue-100 text-blue-700'}`}>
                          {org.org_type === 'FOOD' ? 'Comida' : 'Retail'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="text-gray-700">{org.product_count}</span>
                        <span className="text-gray-400">/{limitLabel(org.limits.max_products)}</span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="text-gray-700">{org.branch_count}</span>
                        <span className="text-gray-400">/{limitLabel(org.limits.max_branches)}</span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => setDevicesOrg(org)}
                          className="inline-flex items-center gap-1.5 text-gray-700 hover:text-brand-600 transition-colors cursor-pointer"
                        >
                          <i className="ri-device-line text-sm"></i>
                          <span>{org.active_devices}/{org.max_licenses}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3.5">
                        {org.plan_expires_at ? (
                          <span className={`text-xs ${new Date(org.plan_expires_at) < new Date() ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
                            {formatDate(org.plan_expires_at)}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">Sin venc.</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setDevicesOrg(org)}
                            title="Ver dispositivos"
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <i className="ri-computer-line text-base"></i>
                          </button>
                          <button
                            onClick={() => setEditOrg(org)}
                            title="Editar plan"
                            className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <i className="ri-edit-line text-base"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {editOrg && (
        <EditPlanModal
          org={editOrg}
          onClose={() => setEditOrg(null)}
          onSaved={load}
        />
      )}

      {devicesOrg && (
        <DevicesModal
          org={devicesOrg}
          onClose={() => setDevicesOrg(null)}
        />
      )}
    </AppLayout>
  );
}
