import { ReactNode, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ShoppingCart, Phone, MapPin, Instagram, Facebook, Clock } from 'lucide-react';
import { getStore, type StoreInfo } from '../../services/publicStore.service';
import { useCart } from './cartStore';
import { parseSchedule, isStoreOpenNow, formatScheduleSummary } from './scheduleUtils';

interface Props {
  children: (info: StoreInfo) => ReactNode;
}

export default function PublicStoreLayout({ children }: Props) {
  const { slug = '' } = useParams<{ slug: string }>();
  const [info, setInfo] = useState<StoreInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { totalItems } = useCart(slug);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    getStore(slug)
      .then((d) => { if (alive) setInfo(d); })
      .catch(() => { if (alive) setError('Tienda no encontrada'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-400">Cargando tienda…</div>
      </div>
    );
  }

  if (error || !info) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-5xl mb-4">🏬</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Tienda no encontrada</h1>
          <p className="text-gray-500">El enlace puede estar mal escrito o la tienda fue desactivada.</p>
        </div>
      </div>
    );
  }

  const settings = info.settings;
  const primary = settings?.primary_color || '#10b981';
  const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/api$/, '');
  const logoUrl = settings?.logo_url
    ? (settings.logo_url.startsWith('http') ? settings.logo_url : `${apiBase}${settings.logo_url}`)
    : null;

  const schedule = parseSchedule(settings?.schedule_json);
  const openState = isStoreOpenNow(schedule);
  const scheduleSummary = formatScheduleSummary(schedule);

  return (
    <div className="min-h-screen bg-gray-50" style={{ ['--store-primary' as any]: primary }}>
      {!openState.open && (
        <div className="bg-red-50 text-red-700 text-sm font-semibold py-2 px-4 text-center border-b border-red-200 flex items-center justify-center gap-2">
          <Clock className="h-4 w-4" />
          {openState.reason || 'Tienda cerrada'}
        </div>
      )}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to={`/s/${slug}`} className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt="logo" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: primary }}
              >
                {(settings?.display_name || info.org.name)[0]}
              </div>
            )}
            <div>
              <div className="font-bold text-gray-900 leading-tight">{settings?.display_name || info.org.name}</div>
              {settings?.description && (
                <div className="text-xs text-gray-500 line-clamp-1">{settings.description}</div>
              )}
            </div>
          </Link>

          <Link
            to={`/s/${slug}/carrito`}
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Carrito"
          >
            <ShoppingCart className="h-6 w-6 text-gray-700" />
            {totalItems > 0 && (
              <span
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full text-white text-xs font-bold flex items-center justify-center"
                style={{ backgroundColor: primary }}
              >
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </header>

      <main>{children(info)}</main>

      <footer className="bg-white border-t mt-12">
        <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
          <div>
            <div className="font-bold text-gray-900 mb-2">{settings?.display_name || info.org.name}</div>
            {settings?.fiscal_address && (
              <div className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5 shrink-0" /> {settings.fiscal_address}</div>
            )}
            {settings?.whatsapp_number && (
              <div className="flex items-center gap-2 mt-1"><Phone className="h-4 w-4" /> {settings.whatsapp_number}</div>
            )}
            {scheduleSummary && (
              <div className="flex items-start gap-2 mt-1"><Clock className="h-4 w-4 mt-0.5 shrink-0" /> {scheduleSummary}</div>
            )}
          </div>
          <div>
            {settings?.payment_methods_text && (
              <>
                <div className="font-semibold text-gray-900 mb-2">Métodos de pago</div>
                <div className="whitespace-pre-line">{settings.payment_methods_text}</div>
              </>
            )}
          </div>
          <div className="flex gap-3 md:justify-end">
            {settings?.social_instagram && (
              <a href={`https://instagram.com/${settings.social_instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="p-2 rounded-full bg-gray-100 hover:bg-gray-200">
                <Instagram className="h-4 w-4" />
              </a>
            )}
            {settings?.social_facebook && (
              <a href={settings.social_facebook} target="_blank" rel="noreferrer" className="p-2 rounded-full bg-gray-100 hover:bg-gray-200">
                <Facebook className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
        <div className="text-center text-xs text-gray-400 py-3 border-t">
          Powered by <span className="font-semibold">Conty</span>
        </div>
      </footer>
    </div>
  );
}
