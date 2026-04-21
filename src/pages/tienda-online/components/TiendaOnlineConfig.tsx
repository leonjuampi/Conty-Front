import { useEffect, useRef, useState } from 'react';
import StoreQRCode from './StoreQRCode';
import ScheduleEditor from './ScheduleEditor';
import {
  getStoreConfig,
  updateStoreConfig,
  checkSlug,
  uploadStoreLogo,
  uploadStoreBanner,
  listStoreBranches,
  type StoreOrgConfig,
  type StoreSettingsAdmin,
  type StoreBranch,
} from '../../../services/store.service';

const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/api$/, '');

function assetUrl(u?: string | null) {
  if (!u) return null;
  return u.startsWith('http') ? u : `${apiBase}${u}`;
}

export default function TiendaOnlineConfig() {
  const [org, setOrg] = useState<StoreOrgConfig | null>(null);
  const [settings, setSettings] = useState<StoreSettingsAdmin | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [slug, setSlug] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'ok' | 'taken' | 'invalid'>('idle');
  const [branches, setBranches] = useState<StoreBranch[]>([]);

  const logoInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    listStoreBranches().then((b) => alive && setBranches(b)).catch(() => {});
    getStoreConfig()
      .then((r) => {
        if (!alive) return;
        setOrg(r.org);
        setSettings(r.settings || {
          org_id: r.org?.id || 0, store_branch_id: null, display_name: r.org?.name || '', description: null,
          logo_url: null, banner_url: null, promo_video_url: null,
          whatsapp_number: '', whatsapp_default_message: null,
          email: null, notify_email: null,
          fiscal_address: null, fiscal_lat: null, fiscal_lng: null,
          pickup_enabled: 1, delivery_enabled: 1, delivery_radius_km: null,
          delivery_cost: 0, delivery_zones: null,
          min_order_amount: 0, payment_methods_text: null, schedule_json: null,
          social_instagram: null, social_facebook: null, primary_color: '#10b981',
          product_grid_size: 'small',
        } as StoreSettingsAdmin);
        setSlug(r.org?.store_slug || '');
        setEnabled(Boolean(r.org?.store_enabled));
      })
      .catch(() => setError('No se pudo cargar la configuración'))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (settings && settings.store_branch_id == null && branches.length === 1) {
      setSettings((s) => s ? { ...s, store_branch_id: branches[0].id } : s);
    }
  }, [branches, settings?.store_branch_id]);

  useEffect(() => {
    if (!slug || slug === (org?.store_slug || '')) { setSlugStatus('idle'); return; }
    if (!/^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$/.test(slug)) { setSlugStatus('invalid'); return; }
    setSlugStatus('checking');
    const t = setTimeout(async () => {
      try {
        const r = await checkSlug(slug);
        setSlugStatus(r.available ? 'ok' : 'taken');
      } catch {
        setSlugStatus('idle');
      }
    }, 450);
    return () => clearTimeout(t);
  }, [slug, org?.store_slug]);

  function patchSettings<K extends keyof StoreSettingsAdmin>(key: K, value: StoreSettingsAdmin[K]) {
    setSettings((s) => s ? { ...s, [key]: value } : s);
  }

  async function uploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    try {
      const r = await uploadStoreLogo(f);
      patchSettings('logo_url', r.url);
    } catch { setError('Error al subir el logo'); }
  }
  async function uploadBanner(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    try {
      const r = await uploadStoreBanner(f);
      patchSettings('banner_url', r.url);
    } catch { setError('Error al subir el banner'); }
  }

  async function save() {
    if (!settings) return;
    if (slug && slugStatus === 'taken') { setError('El slug ya está en uso'); return; }
    if (slug && slugStatus === 'invalid') { setError('Slug inválido (solo minúsculas, números y guiones)'); return; }
    setSaving(true); setError(null); setSaveMsg(null);
    try {
      await updateStoreConfig({
        store_slug: slug || null,
        store_enabled: enabled,
        settings: {
          store_branch_id: settings.store_branch_id,
          display_name: settings.display_name,
          description: settings.description,
          logo_url: settings.logo_url,
          banner_url: settings.banner_url,
          promo_video_url: settings.promo_video_url,
          whatsapp_number: settings.whatsapp_number,
          whatsapp_default_message: settings.whatsapp_default_message,
          email: settings.email,
          notify_email: settings.notify_email,
          fiscal_address: settings.fiscal_address,
          fiscal_lat: settings.fiscal_lat,
          fiscal_lng: settings.fiscal_lng,
          pickup_enabled: settings.pickup_enabled,
          delivery_enabled: settings.delivery_enabled,
          delivery_radius_km: settings.delivery_radius_km,
          delivery_cost: settings.delivery_cost,
          delivery_zones: settings.delivery_zones,
          min_order_amount: settings.min_order_amount,
          payment_methods_text: settings.payment_methods_text,
          schedule_json: settings.schedule_json,
          social_instagram: settings.social_instagram,
          social_facebook: settings.social_facebook,
          primary_color: settings.primary_color,
          product_grid_size: settings.product_grid_size,
        },
      });
      setSaveMsg('Configuración guardada');
      setTimeout(() => setSaveMsg(null), 2000);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-gray-400 py-12 text-center">Cargando…</div>;
  if (!settings) return null;

  const publicUrl = slug ? `${window.location.origin}/s/${slug}` : '';

  return (
    <div className="space-y-6">
      {/* Estado + URL */}
      <section className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-bold text-gray-900">Estado de la tienda</div>
            <div className="text-sm text-gray-500">Activá tu tienda para que los clientes puedan verla.</div>
          </div>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-checked:bg-emerald-500 rounded-full relative transition-colors">
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${enabled ? 'translate-x-5' : ''}`} />
            </div>
            <span className="text-sm font-semibold">{enabled ? 'Activa' : 'Inactiva'}</span>
          </label>
        </div>

        <label className="text-sm font-semibold text-gray-700 mb-1 block">Slug de tu tienda</label>
        <div className="flex gap-2 items-center">
          <span className="text-sm text-gray-500 whitespace-nowrap">/s/</span>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            placeholder="mi-tienda"
            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          <span className="text-xs">
            {slugStatus === 'checking' && <span className="text-gray-400">Verificando…</span>}
            {slugStatus === 'ok' && <span className="text-green-600">✓ Disponible</span>}
            {slugStatus === 'taken' && <span className="text-red-500">✗ En uso</span>}
            {slugStatus === 'invalid' && <span className="text-red-500">✗ Inválido</span>}
          </span>
        </div>
        {publicUrl && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <span className="text-gray-500">Enlace público:</span>
            <a href={publicUrl} target="_blank" rel="noreferrer" className="text-emerald-600 font-semibold hover:underline">{publicUrl}</a>
            <button
              onClick={() => navigator.clipboard.writeText(publicUrl)}
              className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
            >Copiar</button>
          </div>
        )}
      </section>

      {/* Identidad */}
      <section className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
        <div className="font-bold text-gray-900">Identidad de la tienda</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Nombre visible *</label>
            <input
              type="text"
              value={settings.display_name}
              onChange={(e) => patchSettings('display_name', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Color principal</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={settings.primary_color}
                onChange={(e) => patchSettings('primary_color', e.target.value)}
                className="h-10 w-16 rounded border border-gray-200"
              />
              <input
                type="text"
                value={settings.primary_color}
                onChange={(e) => patchSettings('primary_color', e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-600 mb-1 block">Descripción corta</label>
          <textarea
            value={settings.description || ''}
            onChange={(e) => patchSettings('description', e.target.value || null)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-gray-200"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600 mb-2 block">Logo</label>
            <div className="flex items-center gap-3">
              {settings.logo_url ? (
                <img src={assetUrl(settings.logo_url)!} alt="logo" className="h-16 w-16 rounded-full object-cover border" />
              ) : (
                <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-300">—</div>
              )}
              <button onClick={() => logoInput.current?.click()} className="px-3 py-2 text-sm font-semibold bg-gray-100 rounded hover:bg-gray-200">
                Subir logo
              </button>
              <input ref={logoInput} type="file" accept="image/*" onChange={uploadLogo} className="hidden" />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-2 block">Banner</label>
            <div className="flex items-center gap-3">
              {settings.banner_url ? (
                <img src={assetUrl(settings.banner_url)!} alt="banner" className="h-16 w-28 rounded object-cover border" />
              ) : (
                <div className="h-16 w-28 rounded bg-gray-100 flex items-center justify-center text-gray-300 text-xs">Sin banner</div>
              )}
              <button onClick={() => bannerInput.current?.click()} className="px-3 py-2 text-sm font-semibold bg-gray-100 rounded hover:bg-gray-200">
                Subir banner
              </button>
              <input ref={bannerInput} type="file" accept="image/*" onChange={uploadBanner} className="hidden" />
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Tamaño recomendado: <span className="font-semibold text-gray-600">1920×720 px</span> (relación ~8:3, formato panorámico). Máx. 2MB, JPG o PNG.
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-600 mb-1 block">Video de YouTube (opcional)</label>
          <input
            type="text"
            value={settings.promo_video_url || ''}
            onChange={(e) => patchSettings('promo_video_url', e.target.value || null)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full px-3 py-2 rounded-lg border border-gray-200"
          />
          <div className="text-xs text-gray-400 mt-1">
            Se muestra al final del listado de productos. Podés pegar el link completo o solo el ID.
          </div>
        </div>
      </section>

      {/* Contacto */}
      <section className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
        <div className="font-bold text-gray-900">Contacto y redes</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">WhatsApp (con código de país) *</label>
            <input
              type="text"
              value={settings.whatsapp_number}
              onChange={(e) => patchSettings('whatsapp_number', e.target.value)}
              placeholder="5491112345678"
              className="w-full px-3 py-2 rounded-lg border border-gray-200"
            />
            <div className="text-xs text-gray-400 mt-1">Acá llegan los pedidos vía WhatsApp y es el número del botón flotante.</div>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-gray-600 mb-1 block">Mensaje inicial del botón de WhatsApp</label>
            <textarea
              value={settings.whatsapp_default_message || ''}
              onChange={(e) => patchSettings('whatsapp_default_message', e.target.value || null)}
              rows={2}
              placeholder="¡Hola! Quisiera hacer una consulta sobre sus productos."
              className="w-full px-3 py-2 rounded-lg border border-gray-200"
            />
            <div className="text-xs text-gray-400 mt-1">Se precarga cuando un cliente abre el chat desde el botón flotante.</div>
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Email</label>
            <input
              type="email"
              value={settings.email || ''}
              onChange={(e) => patchSettings('email', e.target.value || null)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Email para avisos de pedidos</label>
            <input
              type="email"
              value={settings.notify_email || ''}
              onChange={(e) => patchSettings('notify_email', e.target.value || null)}
              placeholder="En copia al confirmar un pedido"
              className="w-full px-3 py-2 rounded-lg border border-gray-200"
            />
            <div className="text-xs text-gray-400 mt-1">Recibís una copia cada vez que confirmás un pedido.</div>
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Instagram</label>
            <input
              type="text"
              value={settings.social_instagram || ''}
              onChange={(e) => patchSettings('social_instagram', e.target.value || null)}
              placeholder="@mitienda"
              className="w-full px-3 py-2 rounded-lg border border-gray-200"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Facebook (URL)</label>
            <input
              type="text"
              value={settings.social_facebook || ''}
              onChange={(e) => patchSettings('social_facebook', e.target.value || null)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200"
            />
          </div>
        </div>
      </section>

      {/* Presentación del catálogo */}
      <section className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
        <div className="font-bold text-gray-900">Presentación del catálogo</div>
        <div>
          <label className="text-sm text-gray-600 mb-2 block">Tamaño de las tarjetas de productos</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => patchSettings('product_grid_size', 'small')}
              className={`p-4 rounded-xl border-2 text-left transition-colors ${
                settings.product_grid_size === 'small'
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="font-semibold text-gray-900 mb-1">Compacta</div>
              <div className="text-xs text-gray-500 mb-3">Más productos por fila (4 en desktop).</div>
              <div className="grid grid-cols-4 gap-1">
                {[0,1,2,3,4,5,6,7].map((i) => (
                  <div key={i} className="aspect-square rounded bg-gray-200" />
                ))}
              </div>
            </button>
            <button
              type="button"
              onClick={() => patchSettings('product_grid_size', 'large')}
              className={`p-4 rounded-xl border-2 text-left transition-colors ${
                settings.product_grid_size === 'large'
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="font-semibold text-gray-900 mb-1">Amplia</div>
              <div className="text-xs text-gray-500 mb-3">Fotos más grandes (3 en desktop).</div>
              <div className="grid grid-cols-3 gap-1">
                {[0,1,2,3,4,5].map((i) => (
                  <div key={i} className="aspect-square rounded bg-gray-200" />
                ))}
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Dirección */}
      <section className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
        <div className="font-bold text-gray-900">Dirección</div>
        <div>
          <label className="text-sm text-gray-600 mb-1 block">Dirección fiscal</label>
          <input
            type="text"
            value={settings.fiscal_address || ''}
            onChange={(e) => patchSettings('fiscal_address', e.target.value || null)}
            placeholder="Av. Corrientes 1234, CABA"
            className="w-full px-3 py-2 rounded-lg border border-gray-200"
          />
        </div>
      </section>

      {/* Entregas */}
      <section className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
        <div className="font-bold text-gray-900">Entregas</div>

        <div>
          <label className="text-sm text-gray-600 mb-1 block">Sucursal que atiende la tienda *</label>
          {branches.length === 0 ? (
            <div className="text-sm text-gray-400">No tenés sucursales creadas.</div>
          ) : branches.length === 1 ? (
            <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700">
              {branches[0].name} <span className="text-xs text-gray-400 ml-2">(única sucursal)</span>
            </div>
          ) : (
            <select
              value={settings.store_branch_id ?? ''}
              onChange={(e) => patchSettings('store_branch_id', e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200"
            >
              <option value="">Seleccionar sucursal…</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}
          <div className="text-xs text-gray-400 mt-1">
            El stock y las ventas de la tienda online se toman de esta sucursal.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.pickup_enabled === 1}
              onChange={(e) => patchSettings('pickup_enabled', e.target.checked ? 1 : 0)}
            />
            <span className="text-sm">Permitir retiro en local</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.delivery_enabled === 1}
              onChange={(e) => patchSettings('delivery_enabled', e.target.checked ? 1 : 0)}
            />
            <span className="text-sm">Permitir envío a domicilio</span>
          </label>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Radio de entrega (km)</label>
            <input
              type="number" step="0.5"
              value={settings.delivery_radius_km ?? ''}
              onChange={(e) => patchSettings('delivery_radius_km', e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Monto mínimo del pedido</label>
            <input
              type="number" step="0.01"
              value={settings.min_order_amount}
              onChange={(e) => patchSettings('min_order_amount', Number(e.target.value || 0))}
              className="w-full px-3 py-2 rounded-lg border border-gray-200"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Costo de envío</label>
            <input
              type="number" step="0.01"
              value={settings.delivery_cost}
              onChange={(e) => patchSettings('delivery_cost', Number(e.target.value || 0))}
              className="w-full px-3 py-2 rounded-lg border border-gray-200"
              placeholder="0"
            />
            <div className="text-xs text-gray-400 mt-1">Se agrega al total cuando el cliente elige envío.</div>
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Zonas de entrega</label>
            <input
              type="text"
              value={settings.delivery_zones || ''}
              onChange={(e) => patchSettings('delivery_zones', e.target.value || null)}
              placeholder="CABA, GBA norte…"
              className="w-full px-3 py-2 rounded-lg border border-gray-200"
            />
            <div className="text-xs text-gray-400 mt-1">Texto informativo que se muestra al cliente.</div>
          </div>
        </div>
        <div>
          <label className="text-sm text-gray-600 mb-1 block">Métodos de pago aceptados</label>
          <textarea
            value={settings.payment_methods_text || ''}
            onChange={(e) => patchSettings('payment_methods_text', e.target.value || null)}
            rows={3}
            placeholder="Efectivo, transferencia, MercadoPago…"
            className="w-full px-3 py-2 rounded-lg border border-gray-200"
          />
        </div>
      </section>

      {/* Horarios */}
      <section className="bg-white rounded-2xl shadow-sm p-5">
        <ScheduleEditor
          value={settings.schedule_json}
          onChange={(v) => patchSettings('schedule_json', v as any)}
        />
      </section>

      {/* QR */}
      <StoreQRCode slug={org?.store_slug || slug || null} storeName={settings.display_name} />

      {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm">{error}</div>}
      {saveMsg && <div className="bg-green-50 border border-green-200 text-green-600 rounded-xl p-3 text-sm">{saveMsg}</div>}

      <div className="flex justify-end gap-2 sticky bottom-0 bg-gray-50 py-3">
        <button
          onClick={save}
          disabled={saving}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold disabled:opacity-50"
        >
          {saving ? 'Guardando…' : 'Guardar configuración'}
        </button>
      </div>
    </div>
  );
}
