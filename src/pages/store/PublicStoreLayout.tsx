import { ReactNode, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ShoppingCart, Phone, MapPin, Instagram, Facebook, Clock, Menu, X, ChevronDown } from 'lucide-react';
import { getStore, getStoreCategories, type StoreInfo, type StoreCategory } from '../../services/publicStore.service';
import { useCart } from './cartStore';
import { parseSchedule, isStoreOpenNow, formatScheduleSummary } from './scheduleUtils';

interface Props {
  children: (info: StoreInfo) => ReactNode;
}

export default function PublicStoreLayout({ children }: Props) {
  const { slug = '' } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [info, setInfo] = useState<StoreInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [productsOpen, setProductsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { totalItems } = useCart(slug);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    getStore(slug)
      .then((d) => { if (alive) setInfo(d); })
      .catch(() => { if (alive) setError('Tienda no encontrada'); })
      .finally(() => { if (alive) setLoading(false); });
    getStoreCategories(slug).then((cs) => { if (alive) setCategories(cs); }).catch(() => {});
    return () => { alive = false; };
  }, [slug]);

  useEffect(() => {
    if (!productsOpen) return;
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setProductsOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [productsOpen]);

  function goHome(cat?: number) {
    const url = cat ? `/s/${slug}?cat=${cat}` : `/s/${slug}`;
    navigate(url);
    setProductsOpen(false);
    setMobileOpen(false);
  }

  function scrollToContact() {
    setMobileOpen(false);
    if (window.location.pathname !== `/s/${slug}`) {
      navigate(`/s/${slug}#contacto`);
      return;
    }
    const el = document.getElementById('contacto');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

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
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link to={`/s/${slug}`} className="flex items-center gap-3 min-w-0">
            {logoUrl ? (
              <img src={logoUrl} alt="logo" className="h-10 w-10 rounded-full object-cover shrink-0" />
            ) : (
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                style={{ backgroundColor: primary }}
              >
                {(settings?.display_name || info.org.name)[0]}
              </div>
            )}
            <div className="min-w-0">
              <div className="font-bold text-gray-900 leading-tight truncate">{settings?.display_name || info.org.name}</div>
              {settings?.description && (
                <div className="text-xs text-gray-500 line-clamp-1">{settings.description}</div>
              )}
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => goHome()}
              className="px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100"
            >
              Inicio
            </button>
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setProductsOpen((v) => !v)}
                className="px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 flex items-center gap-1"
              >
                Productos
                <ChevronDown className={`h-4 w-4 transition-transform ${productsOpen ? 'rotate-180' : ''}`} />
              </button>
              {productsOpen && (
                <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                  <button
                    onClick={() => goHome()}
                    className="w-full text-left px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                  >
                    Todos los productos
                  </button>
                  {categories.length > 0 && (
                    <div className="border-t border-gray-100 max-h-72 overflow-y-auto">
                      {categories.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => goHome(c.id)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={scrollToContact}
              className="px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100"
            >
              Contacto
            </button>
          </nav>

          <div className="flex items-center gap-1">
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
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              aria-label="Menú"
            >
              {mobileOpen ? <X className="h-6 w-6 text-gray-700" /> : <Menu className="h-6 w-6 text-gray-700" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white">
            <div className="max-w-6xl mx-auto px-4 py-2">
              <button
                onClick={() => goHome()}
                className="w-full text-left px-3 py-3 rounded-lg text-sm font-semibold text-gray-800 hover:bg-gray-50"
              >
                Inicio
              </button>
              <details className="group">
                <summary className="list-none flex items-center justify-between px-3 py-3 rounded-lg text-sm font-semibold text-gray-800 hover:bg-gray-50 cursor-pointer">
                  Productos
                  <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                </summary>
                <div className="pl-4 border-l border-gray-100 ml-3 mb-2">
                  <button
                    onClick={() => goHome()}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Todos los productos
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => goHome(c.id)}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </details>
              <button
                onClick={scrollToContact}
                className="w-full text-left px-3 py-3 rounded-lg text-sm font-semibold text-gray-800 hover:bg-gray-50"
              >
                Contacto
              </button>
            </div>
          </div>
        )}
      </header>

      <main>{children(info)}</main>

      <footer id="contacto" className="bg-white border-t mt-12 scroll-mt-24">
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

      {settings?.whatsapp_number && (() => {
        const phone = String(settings.whatsapp_number).replace(/[^\d]/g, '');
        if (!phone) return null;
        const msg = settings.whatsapp_default_message || '';
        const href = `https://wa.me/${phone}${msg ? `?text=${encodeURIComponent(msg)}` : ''}`;
        return (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            aria-label="Chatear por WhatsApp"
            className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-[#25D366] text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center"
          >
            <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current" aria-hidden="true">
              <path d="M20.52 3.48A11.86 11.86 0 0 0 12.04 0C5.5 0 .2 5.3.2 11.84c0 2.09.55 4.13 1.6 5.93L.07 24l6.4-1.67a11.85 11.85 0 0 0 5.57 1.42h.01c6.54 0 11.85-5.3 11.86-11.84a11.76 11.76 0 0 0-3.4-8.43Zm-8.48 18.2a9.85 9.85 0 0 1-5.02-1.38l-.36-.21-3.8.99 1.02-3.7-.24-.38a9.82 9.82 0 1 1 18.24-5.16c0 5.44-4.43 9.84-9.84 9.84Zm5.4-7.38c-.3-.15-1.76-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.18.2-.35.23-.65.08-.3-.15-1.26-.47-2.4-1.5-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.6.14-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.53.08-.8.38-.28.3-1.06 1.04-1.06 2.53 0 1.5 1.09 2.94 1.24 3.14.15.2 2.14 3.27 5.19 4.58.72.31 1.29.5 1.73.64.73.23 1.39.2 1.91.12.58-.09 1.76-.72 2-1.41.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35Z"/>
            </svg>
          </a>
        );
      })()}
    </div>
  );
}
