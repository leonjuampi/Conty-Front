
import { useState, useEffect } from 'react';
import { AppLayout } from '../../components/feature/AppLayout';
import UserManagement from './components/UserManagement';
import BranchesManagement from './components/BranchesManagement';
import PaymentMethodsManagement from './components/PaymentMethodsManagement';
import PriceListsManagement from './components/PriceListsManagement';
import NumberingManagement from './components/NumberingManagement';
import { useCashAlertLimit } from '../../hooks/useCashAlertLimit';
import { useAuth } from '../../context/AuthContext';
import { getOrganization, updateOrganization } from '../../services/organization.service';

const LOW_STOCK_KEY = 'conty_low_stock_threshold';
function getLowStockThreshold(): number {
  const v = localStorage.getItem(LOW_STOCK_KEY);
  return v ? parseInt(v) : 5;
}

export default function SettingsPage() {
  const { currentUser } = useAuth();
  const [settings, setSettings] = useState({
    businessName: '',
    address: '',
    email: '',
    taxId: '',
    currency: 'ARS',
    timezone: 'America/Argentina/Buenos_Aires',
  });
  const [loadingOrg, setLoadingOrg] = useState(true);

  const { limitHours, limitMins, updateLimit } = useCashAlertLimit();
  const [alertHours, setAlertHours] = useState(limitHours);
  const [alertMins, setAlertMins] = useState(limitMins);
  const [lowStockThreshold, setLowStockThreshold] = useState(getLowStockThreshold);

  const [activeTab, setActiveTab] = useState('general');
  const [savedMsg, setSavedMsg] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (!currentUser?.orgId) { setLoadingOrg(false); return; }
    getOrganization(currentUser.orgId)
      .then(org => {
        setSettings(prev => ({
          ...prev,
          businessName: org.legalName || '',
          address: org.address || '',
          email: org.senderEmail || '',
          taxId: org.taxId || '',
          currency: org.currency || 'ARS',
          timezone: org.timezone || 'America/Argentina/Buenos_Aires',
        }));
      })
      .catch(() => {})
      .finally(() => setLoadingOrg(false));
  }, [currentUser?.orgId]);

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaveError('');
    setSaving(true);
    updateLimit(alertHours, alertMins);
    localStorage.setItem(LOW_STOCK_KEY, String(lowStockThreshold));

    if (currentUser?.orgId) {
      try {
        await updateOrganization(currentUser.orgId, {
          legalName: settings.businessName,
          address: settings.address,
          senderEmail: settings.email,
          taxId: settings.taxId,
          currency: settings.currency,
          timezone: settings.timezone,
        });
      } catch {
        setSaveError('Error al guardar');
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
  };

  const totalAlertMinutes = alertHours * 60 + alertMins;

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Configuración del Sistema</h1>
          <p className="text-gray-600 text-sm">Administra los ajustes generales de tu negocio</p>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-hide">
            {[
              { id: 'general', label: 'General', icon: 'ri-settings-3-line' },
              { id: 'business', label: 'Negocio', icon: 'ri-store-line' },
              { id: 'branches', label: 'Sucursales', icon: 'ri-map-pin-line' },
              { id: 'payment', label: 'Medios de Pago', icon: 'ri-bank-card-line' },
              { id: 'pricelists', label: 'Listas de Precio', icon: 'ri-price-tag-3-line' },
              { id: 'numbering', label: 'Numeracion', icon: 'ri-hashtag' },
              { id: 'users', label: 'Usuarios', icon: 'ri-team-line' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 md:px-5 py-3 md:py-4 font-semibold transition-all whitespace-nowrap cursor-pointer text-sm min-h-[52px] ${
                  activeTab === tab.id
                    ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50'
                    : 'text-gray-600 hover:text-brand-600 hover:bg-brand-50'
                }`}
              >
                <i className={`${tab.icon} text-lg`}></i>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="p-4 md:p-6">
            {activeTab === 'general' && (
              <div className="space-y-8">
                <div className="space-y-4">
                  <h2 className="text-lg md:text-xl font-bold text-gray-800">Configuración General</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Moneda</label>
                      <select
                        value={settings.currency}
                        onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm min-h-[48px]"
                      >
                        <option value="ARS">Peso Argentino (ARS)</option>
                        <option value="USD">Dólar (USD)</option>
                        <option value="EUR">Euro (EUR)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Zona Horaria</label>
                      <select
                        value={settings.timezone}
                        onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm min-h-[48px]"
                      >
                        <option value="America/Argentina/Buenos_Aires">Buenos Aires (GMT-3)</option>
                        <option value="America/New_York">Nueva York (GMT-5)</option>
                        <option value="Europe/Madrid">Madrid (GMT+1)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Umbral de stock bajo */}
                <div className="border-t border-gray-100 pt-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-100">
                      <i className="ri-alert-line text-red-600 text-lg"></i>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-800">Alerta de Stock Bajo</h3>
                      <p className="text-xs text-gray-500">Se mostrará una alerta cuando el stock de un producto sea menor o igual a este valor</p>
                    </div>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setLowStockThreshold(v => Math.max(0, v - 1))}
                          disabled={lowStockThreshold === 0}
                          className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 font-bold text-lg transition-all cursor-pointer"
                        >
                          <i className="ri-subtract-line"></i>
                        </button>
                        <input
                          type="number"
                          value={lowStockThreshold}
                          onChange={(e) => setLowStockThreshold(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-20 text-center px-2 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-transparent text-sm font-semibold min-h-[44px]"
                          min="0"
                        />
                        <button
                          onClick={() => setLowStockThreshold(v => v + 1)}
                          className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-bold text-lg transition-all cursor-pointer"
                        >
                          <i className="ri-add-line"></i>
                        </button>
                      </div>
                      <div>
                        <p className="text-sm text-red-800">
                          Umbral: <strong>{lowStockThreshold} unidades</strong>
                        </p>
                        <p className="text-xs text-red-600 mt-0.5">
                          {lowStockThreshold === 0 ? 'Alertas de stock bajo desactivadas' : `Alerta cuando stock <= ${lowStockThreshold}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {[0, 3, 5, 10, 20].map(v => (
                        <button
                          key={v}
                          onClick={() => setLowStockThreshold(v)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                            lowStockThreshold === v
                              ? 'bg-red-500 text-white border-red-500'
                              : 'bg-white text-gray-600 border-gray-300 hover:border-red-400 hover:text-red-600'
                          }`}
                        >
                          {v === 0 ? 'Desactivado' : `<= ${v}`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Alerta de caja abierta */}
                <div className="border-t border-gray-100 pt-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-amber-100">
                      <i className="ri-alarm-warning-line text-amber-600 text-lg"></i>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-800">Alerta de Caja Abierta</h3>
                      <p className="text-xs text-gray-500">Notificación cuando la caja supere el tiempo configurado</p>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-4">
                    <p className="text-sm text-amber-800">
                      Se mostrará una alerta cuando la caja lleve más de{' '}
                      <strong>
                        {alertHours > 0 && `${alertHours}h `}
                        {alertMins > 0 && `${alertMins}m`}
                        {alertHours === 0 && alertMins === 0 && '0m'}
                      </strong>{' '}
                      abierta sin cerrar el turno.
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          <i className="ri-time-line mr-1 text-amber-600"></i>
                          Horas
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setAlertHours(h => Math.max(0, h - 1))}
                            disabled={alertHours === 0}
                            className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 font-bold text-lg transition-all cursor-pointer"
                          >
                            <i className="ri-subtract-line"></i>
                          </button>
                          <input
                            type="number"
                            value={alertHours}
                            onChange={(e) => {
                              const v = Math.max(0, Math.min(23, parseInt(e.target.value) || 0));
                              setAlertHours(v);
                            }}
                            className="flex-1 text-center px-2 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm font-semibold min-h-[44px]"
                            min="0"
                            max="23"
                          />
                          <button
                            onClick={() => setAlertHours(h => Math.min(23, h + 1))}
                            disabled={alertHours === 23}
                            className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 font-bold text-lg transition-all cursor-pointer"
                          >
                            <i className="ri-add-line"></i>
                          </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-1 text-center">0 – 23 horas</p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          <i className="ri-timer-line mr-1 text-amber-600"></i>
                          Minutos
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setAlertMins(m => Math.max(0, m - 15))}
                            disabled={alertMins === 0}
                            className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 font-bold text-lg transition-all cursor-pointer"
                          >
                            <i className="ri-subtract-line"></i>
                          </button>
                          <input
                            type="number"
                            value={alertMins}
                            onChange={(e) => {
                              const v = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
                              setAlertMins(v);
                            }}
                            className="flex-1 text-center px-2 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm font-semibold min-h-[44px]"
                            min="0"
                            max="59"
                          />
                          <button
                            onClick={() => setAlertMins(m => Math.min(59, m + 15))}
                            disabled={alertMins >= 45}
                            className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 font-bold text-lg transition-all cursor-pointer"
                          >
                            <i className="ri-add-line"></i>
                          </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-1 text-center">en pasos de 15 min</p>
                      </div>
                    </div>

                    {totalAlertMinutes === 0 && (
                      <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
                        <i className="ri-error-warning-line"></i>
                        El límite debe ser mayor a 0. Se usará el valor anterior.
                      </div>
                    )}

                    {/* Accesos rápidos */}
                    <div>
                      <p className="text-xs text-gray-500 mb-2 font-medium">Valores rápidos:</p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { label: '4h', h: 4, m: 0 },
                          { label: '6h', h: 6, m: 0 },
                          { label: '8h', h: 8, m: 0 },
                          { label: '10h', h: 10, m: 0 },
                          { label: '12h', h: 12, m: 0 },
                        ].map(preset => (
                          <button
                            key={preset.label}
                            onClick={() => { setAlertHours(preset.h); setAlertMins(preset.m); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                              alertHours === preset.h && alertMins === preset.m
                                ? 'bg-amber-500 text-white border-amber-500'
                                : 'bg-white text-gray-600 border-gray-300 hover:border-amber-400 hover:text-amber-600'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'business' && (
              <div className="space-y-6">
                <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4">Datos del Negocio</h2>
                {loadingOrg ? (
                  <div className="flex justify-center py-8">
                    <i className="ri-loader-4-line animate-spin text-3xl text-brand-500"></i>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre del Negocio</label>
                      <input
                        type="text"
                        value={settings.businessName}
                        onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm min-h-[48px]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Dirección</label>
                      <input
                        type="text"
                        value={settings.address}
                        onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm min-h-[48px]"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email de contacto</label>
                        <input
                          type="email"
                          value={settings.email}
                          onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm min-h-[48px]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">CUIT/CUIL</label>
                        <input
                          type="text"
                          value={settings.taxId}
                          onChange={(e) => setSettings({ ...settings, taxId: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm min-h-[48px]"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'branches' && <BranchesManagement />}
            {activeTab === 'payment' && <PaymentMethodsManagement />}
            {activeTab === 'pricelists' && <PriceListsManagement />}
            {activeTab === 'numbering' && <NumberingManagement />}
            {activeTab === 'users' && <UserManagement />}
          </div>

          {(activeTab === 'general' || activeTab === 'business') && (
            <div className="p-4 md:p-6 border-t border-gray-200 bg-gray-50">
              {savedMsg && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">
                  <i className="ri-checkbox-circle-line text-lg"></i>
                  Configuracion guardada exitosamente
                </div>
              )}
              {saveError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                  <i className="ri-error-warning-line text-lg"></i>
                  {saveError}
                </div>
              )}
              <button
                onClick={handleSave}
                disabled={saving || (activeTab === 'general' && totalAlertMinutes === 0)}
                className="w-full bg-gradient-to-r from-brand-500 to-brand-600 text-white py-3 md:py-4 rounded-lg font-semibold hover:from-brand-600 hover:to-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap cursor-pointer text-sm md:text-base min-h-[52px]"
              >
                {saving ? <><i className="ri-loader-4-line animate-spin mr-2"></i>Guardando...</> : <><i className="ri-save-line mr-2"></i>Guardar Configuracion</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
