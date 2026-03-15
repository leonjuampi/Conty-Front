import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { createOrganization } from '../../services/organization.service';

const STEPS = ['Bienvenida', 'Tu Negocio', 'Configuracion'];

export default function SetupPage() {
  const { currentUser, updateAuth } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    legalName: '',
    taxId: '',
    taxCondition: 'CF',
    address: '',
    currency: 'ARS',
    timezone: 'America/Argentina/Buenos_Aires',
    senderEmail: currentUser?.email || '',
  });

  // Si ya tiene org o no es Owner, redirigir
  if (!currentUser || currentUser.roleId !== 2 || currentUser.orgId !== null) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleCreate = async () => {
    if (!form.legalName.trim()) {
      setError('El nombre del negocio es obligatorio');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const result = await createOrganization({
        legalName: form.legalName.trim(),
        taxId: form.taxId.trim() || undefined,
        taxCondition: form.taxCondition || undefined,
        address: form.address.trim() || undefined,
        currency: form.currency,
        timezone: form.timezone,
        senderEmail: form.senderEmail.trim() || undefined,
      });
      // Actualizar token y contexto con el nuevo orgId
      updateAuth(result.token, {
        id: result.user.id,
        name: currentUser!.name,
        email: result.user.email,
        username: result.user.username,
        roleId: result.user.roleId,
        orgId: result.user.orgId,
        branchId: result.user.branchId,
        branchIds: result.user.branchIds,
      });
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Error al crear la organización');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4">
            <i className="ri-building-2-line text-white text-3xl"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Configurá tu organización</h1>
          <p className="text-gray-500 text-sm mt-1">Completá los datos para empezar a usar el sistema</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                i < step ? 'bg-green-500 text-white' : i === step ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {i < step ? <i className="ri-check-line"></i> : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-orange-600' : 'text-gray-400'}`}>{label}</span>
              {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 ${i < step ? 'bg-green-400' : 'bg-gray-200'}`}></div>}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 space-y-5">

          {step === 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                <i className="ri-user-star-line text-orange-500 text-2xl shrink-0"></i>
                <div>
                  <p className="font-semibold text-gray-800">Hola, {currentUser?.name}!</p>
                  <p className="text-sm text-gray-500">Tu cuenta fue creada como <span className="font-semibold text-purple-600">Owner</span>. Ahora necesitás configurar tu organización para empezar.</p>
                </div>
              </div>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <i className="ri-store-line text-orange-500 text-xs"></i>
                  </div>
                  <p>Configurá los datos de tu negocio (nombre, CUIT, dirección)</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <i className="ri-settings-line text-orange-500 text-xs"></i>
                  </div>
                  <p>Elegí la moneda y zona horaria que usará el sistema</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <i className="ri-rocket-line text-orange-500 text-xs"></i>
                  </div>
                  <p>¡Listo! Ya podés empezar a gestionar tu negocio</p>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-gray-800">Datos del Negocio</h2>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre del negocio *</label>
                <input
                  type="text"
                  value={form.legalName}
                  onChange={e => setForm({ ...form, legalName: e.target.value })}
                  placeholder="Ej: Rotisería El Buen Sabor"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm min-h-[48px]"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">CUIT/CUIL</label>
                  <input
                    type="text"
                    value={form.taxId}
                    onChange={e => setForm({ ...form, taxId: e.target.value })}
                    placeholder="Ej: 20-12345678-9"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm min-h-[48px]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Condicion IVA</label>
                  <select
                    value={form.taxCondition}
                    onChange={e => setForm({ ...form, taxCondition: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm min-h-[48px]"
                  >
                    <option value="CF">Consumidor Final</option>
                    <option value="RI">Responsable Inscripto</option>
                    <option value="MT">Monotributista</option>
                    <option value="EX">Exento</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Direccion</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  placeholder="Ej: Av. Corrientes 1234, CABA"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm min-h-[48px]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email de contacto</label>
                <input
                  type="email"
                  value={form.senderEmail}
                  onChange={e => setForm({ ...form, senderEmail: e.target.value })}
                  placeholder="Ej: ventas@minegocio.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm min-h-[48px]"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-gray-800">Configuracion del Sistema</h2>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Moneda</label>
                <select
                  value={form.currency}
                  onChange={e => setForm({ ...form, currency: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm min-h-[48px]"
                >
                  <option value="ARS">Peso Argentino (ARS)</option>
                  <option value="USD">Dolar (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Zona Horaria</label>
                <select
                  value={form.timezone}
                  onChange={e => setForm({ ...form, timezone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm min-h-[48px]"
                >
                  <option value="America/Argentina/Buenos_Aires">Buenos Aires (GMT-3)</option>
                  <option value="America/New_York">Nueva York (GMT-5)</option>
                  <option value="Europe/Madrid">Madrid (GMT+1)</option>
                </select>
              </div>

              {/* Resumen */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Resumen</p>
                <div className="flex items-center gap-2 text-sm">
                  <i className="ri-store-line text-orange-500 shrink-0"></i>
                  <span className="font-medium text-gray-800">{form.legalName || '—'}</span>
                </div>
                {form.taxId && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <i className="ri-file-text-line text-gray-400 shrink-0"></i>
                    <span>CUIT: {form.taxId}</span>
                  </div>
                )}
                {form.address && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <i className="ri-map-pin-line text-gray-400 shrink-0"></i>
                    <span>{form.address}</span>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                  <i className="ri-error-warning-line"></i>
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-4">
          {step > 0 && (
            <button
              onClick={() => { setStep(s => s - 1); setError(''); }}
              className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all cursor-pointer"
            >
              <i className="ri-arrow-left-line mr-1"></i>
              Atrás
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => {
                if (step === 1 && !form.legalName.trim()) {
                  setError('El nombre del negocio es obligatorio');
                  return;
                }
                setError('');
                setStep(s => s + 1);
              }}
              className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm transition-all cursor-pointer"
            >
              Continuar
              <i className="ri-arrow-right-line ml-1"></i>
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={saving}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-60 text-white font-semibold text-sm transition-all cursor-pointer"
            >
              {saving ? (
                <><i className="ri-loader-4-line animate-spin mr-1"></i>Creando organización...</>
              ) : (
                <><i className="ri-rocket-line mr-1"></i>Crear y empezar</>
              )}
            </button>
          )}
        </div>

        {error && step < 2 && (
          <p className="text-center text-xs text-red-600 mt-2">{error}</p>
        )}
      </div>
    </div>
  );
}
