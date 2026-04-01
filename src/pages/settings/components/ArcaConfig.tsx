import { useState, useEffect } from 'react';
import {
  getArcaConfig, saveArcaConfig, testArcaConnection,
  listPuntosVenta, savePuntoVenta,
  ArcaConfig as ArcaConfigType, PuntoVenta,
} from '../../../services/arca.service';
import { listBranches, Branch } from '../../../services/branches.service';

export default function ArcaConfig() {
  const [config, setConfig] = useState<ArcaConfigType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message?: string } | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [cuitEmisor, setCuitEmisor] = useState('');
  const [cert, setCert] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [isProduction, setIsProduction] = useState(false);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [puntosVenta, setPuntosVenta] = useState<PuntoVenta[]>([]);
  const [pvInputs, setPvInputs] = useState<Record<number, string>>({});
  const [savingPv, setSavingPv] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      getArcaConfig(),
      listBranches({ status: 'ACTIVE' }),
      listPuntosVenta(),
    ]).then(([{ config }, { items: brs }, { items: pvs }]) => {
      if (config) {
        setConfig(config);
        setCuitEmisor(config.cuit_emisor || '');
        setIsProduction(config.is_production === 1);
      }
      setBranches(brs);
      setPuntosVenta(pvs);
      const initInputs: Record<number, string> = {};
      brs.forEach(b => {
        const existing = pvs.find(p => p.branchId === b.id);
        initInputs[b.id] = existing ? String(existing.puntoVenta) : '';
      });
      setPvInputs(initInputs);
    }).catch(() => {})
    .finally(() => setLoading(false));
  }, []);

  const handleSaveConfig = async () => {
    if (!cuitEmisor || !cert || !privateKey) {
      setMsg({ type: 'error', text: 'CUIT, certificado y clave privada son requeridos.' });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      await saveArcaConfig({ cuitEmisor, cert, privateKey, isProduction });
      const { config: updated } = await getArcaConfig();
      setConfig(updated);
      setMsg({ type: 'success', text: 'Configuración guardada exitosamente.' });
    } catch {
      setMsg({ type: 'error', text: 'Error al guardar la configuración.' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testArcaConnection();
      setTestResult({ ok: result.ok, message: result.ok ? 'Conexión exitosa con ARCA.' : result.message });
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setTestResult({ ok: false, message: err?.response?.data?.message || 'Error al conectar con ARCA.' });
    } finally {
      setTesting(false);
    }
  };

  const handleSavePv = async (branchId: number) => {
    const pvNum = parseInt(pvInputs[branchId]);
    if (!pvNum || pvNum < 1 || pvNum > 9998) {
      setMsg({ type: 'error', text: 'El punto de venta debe ser un número entre 1 y 9998.' });
      return;
    }
    setSavingPv(branchId);
    try {
      await savePuntoVenta({ branchId, puntoVenta: pvNum });
      const { items } = await listPuntosVenta();
      setPuntosVenta(items);
      setMsg({ type: 'success', text: 'Punto de venta guardado.' });
    } catch {
      setMsg({ type: 'error', text: 'Error al guardar el punto de venta.' });
    } finally {
      setSavingPv(null);
    }
  };

  const handleCertFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setCert(ev.target?.result as string);
    reader.readAsText(file);
  };

  const handleKeyFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPrivateKey(ev.target?.result as string);
    reader.readAsText(file);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <i className="ri-loader-4-line animate-spin text-3xl text-brand-500"></i>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-100">
          <i className="ri-government-line text-blue-600 text-xl"></i>
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-800">Facturación Electrónica — ARCA</h2>
          <p className="text-xs text-gray-500">Configurá las credenciales para emitir facturas electrónicas con validez fiscal</p>
        </div>
      </div>

      {/* Estado actual */}
      {config && (
        <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
          <i className="ri-checkbox-circle-line text-lg"></i>
          <span>
            Configurado — CUIT {config.cuit_emisor} ·{' '}
            {config.is_production ? 'Producción' : 'Homologación'}
            {config.has_cert && config.has_key ? ' · Certificado OK' : ''}
          </span>
        </div>
      )}

      {msg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm border ${
          msg.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <i className={msg.type === 'success' ? 'ri-checkbox-circle-line' : 'ri-error-warning-line'}></i>
          {msg.text}
        </div>
      )}

      {/* Sección 1: Credenciales */}
      <div className="border border-gray-200 rounded-xl p-5 space-y-4">
        <h3 className="font-semibold text-gray-700">Credenciales ARCA</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CUIT Emisor</label>
          <input
            type="text"
            value={cuitEmisor}
            onChange={e => setCuitEmisor(e.target.value)}
            placeholder="20-12345678-9"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Certificado (.crt / .pem)
              {config?.has_cert && <span className="ml-2 text-xs text-green-600 font-normal">Ya cargado</span>}
            </label>
            <input
              type="file"
              accept=".crt,.pem,.cer"
              onChange={handleCertFile}
              className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer"
            />
            {cert && <p className="text-xs text-green-600 mt-1">Archivo cargado ({cert.length} bytes)</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Clave Privada (.key / .pem)
              {config?.has_key && <span className="ml-2 text-xs text-green-600 font-normal">Ya cargada</span>}
            </label>
            <input
              type="file"
              accept=".key,.pem"
              onChange={handleKeyFile}
              className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer"
            />
            {privateKey && <p className="text-xs text-green-600 mt-1">Archivo cargado ({privateKey.length} bytes)</p>}
          </div>
        </div>

        <div className="flex items-center gap-3 py-2">
          <button
            type="button"
            onClick={() => setIsProduction(v => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
              isProduction ? 'bg-brand-600' : 'bg-gray-300'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isProduction ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
          <div>
            <p className="text-sm font-medium text-gray-700">{isProduction ? 'Producción' : 'Homologación (testing)'}</p>
            <p className="text-xs text-gray-500">
              {isProduction
                ? 'Las facturas tendrán validez fiscal real.'
                : 'Modo de prueba — las facturas NO tienen validez fiscal.'}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleSaveConfig}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-lg font-medium text-sm hover:from-brand-600 hover:to-brand-700 disabled:opacity-50 cursor-pointer transition-all"
          >
            {saving ? <i className="ri-loader-4-line animate-spin"></i> : <i className="ri-save-line"></i>}
            Guardar credenciales
          </button>
          <button
            onClick={handleTest}
            disabled={testing || !config?.has_cert}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 disabled:opacity-50 cursor-pointer transition-all"
          >
            {testing ? <i className="ri-loader-4-line animate-spin"></i> : <i className="ri-signal-wifi-line"></i>}
            Probar conexión
          </button>
        </div>

        {testResult && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm border ${
            testResult.ok
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            <i className={testResult.ok ? 'ri-check-line' : 'ri-close-line'}></i>
            {testResult.message}
          </div>
        )}
      </div>

      {/* Sección 2: Puntos de venta por sucursal */}
      <div className="border border-gray-200 rounded-xl p-5 space-y-4">
        <div>
          <h3 className="font-semibold text-gray-700">Puntos de Venta Fiscales</h3>
          <p className="text-xs text-gray-500 mt-0.5">Asigná el número de punto de venta de ARCA a cada sucursal. Debe estar habilitado en tu cuenta de ARCA.</p>
        </div>

        {branches.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No hay sucursales activas.</p>
        ) : (
          <div className="space-y-3">
            {branches.map(branch => {
              const existing = puntosVenta.find(p => p.branchId === branch.id);
              return (
                <div key={branch.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-800 truncate">{branch.name}</p>
                    {existing && (
                      <p className="text-xs text-green-600">PV asignado: {String(existing.puntoVenta).padStart(4, '0')}</p>
                    )}
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="9998"
                    value={pvInputs[branch.id] || ''}
                    onChange={e => setPvInputs(prev => ({ ...prev, [branch.id]: e.target.value }))}
                    placeholder="Ej: 1"
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => handleSavePv(branch.id)}
                    disabled={savingPv === branch.id || !pvInputs[branch.id]}
                    className="flex items-center gap-1.5 px-3 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-50 cursor-pointer transition-all whitespace-nowrap"
                  >
                    {savingPv === branch.id
                      ? <i className="ri-loader-4-line animate-spin"></i>
                      : <i className="ri-save-line"></i>}
                    Guardar
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Instrucciones */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
        <p className="text-sm font-semibold text-blue-800 flex items-center gap-2">
          <i className="ri-information-line"></i>
          Prerequisitos para usar ARCA
        </p>
        <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
          <li>Tener Clave Fiscal nivel 3 o superior en el portal de ARCA.</li>
          <li>Habilitar el servicio "WSFE - Producción" desde "Administrador de Relaciones de Clave Fiscal".</li>
          <li>Generar un CSR y obtener el certificado digital desde la sección "Certificados".</li>
          <li>Crear un Punto de Venta electrónico desde "ABM Puntos de Venta" en ARCA.</li>
          <li>Subir el certificado (.crt) y la clave privada (.key) en este formulario.</li>
        </ol>
      </div>
    </div>
  );
}
