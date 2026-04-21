import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Search, Star } from 'lucide-react';
import PublicStoreLayout from './PublicStoreLayout';
import ProductQuickView from './ProductQuickView';
import { parseSchedule, isStoreOpenNow } from './scheduleUtils';
import {
  getStoreCategories,
  getStoreProducts,
  type StoreCategory,
  type StoreProduct,
  type StoreInfo,
} from '../../services/publicStore.service';

function moneyAR(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n);
}

function extractYouTubeId(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = s.match(p);
    if (m) return m[1];
  }
  return null;
}

function ProductCard({ p, primary, onOpen }: { p: StoreProduct; primary: string; onOpen: (id: number) => void }) {
  const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/api$/, '');
  const img = p.image_url
    ? (p.image_url.startsWith('http') ? p.image_url : `${apiBase}${p.image_url}`)
    : null;
  const outOfStock = p.stock <= 0;

  return (
    <button
      type="button"
      onClick={() => onOpen(p.id)}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col text-left"
    >
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {img ? (
          <img src={img} alt={p.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-5xl">📦</div>
        )}
        {p.online_featured ? (
          <span
            className="absolute top-2 left-2 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1"
            style={{ backgroundColor: primary }}
          >
            <Star className="h-3 w-3 fill-white" /> Destacado
          </span>
        ) : null}
        {outOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-gray-900 text-xs font-bold px-3 py-1 rounded-full">Sin stock</span>
          </div>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col">
        {p.category_name && <div className="text-xs text-gray-400 mb-1">{p.category_name}</div>}
        <div className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2 flex-1">{p.name}</div>
        <div className="font-bold text-lg" style={{ color: primary }}>{moneyAR(Number(p.price))}</div>
      </div>
    </button>
  );
}

function StoreHomeInner({ info }: { info: StoreInfo }) {
  const { slug = '' } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const primary = info.settings?.primary_color || '#10b981';
  const gridClass = info.settings?.product_grid_size === 'large'
    ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5'
    : 'grid grid-cols-2 md:grid-cols-4 gap-3';
  const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/api$/, '');
  const banner = info.settings?.banner_url
    ? (info.settings.banner_url.startsWith('http') ? info.settings.banner_url : `${apiBase}${info.settings.banner_url}`)
    : null;

  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [search, setSearch] = useState('');
  const initialCat = searchParams.get('cat');
  const [activeCat, setActiveCat] = useState<number | null>(initialCat ? Number(initialCat) : null);
  const [loading, setLoading] = useState(true);
  const [quickViewId, setQuickViewId] = useState<number | null>(null);

  useEffect(() => {
    const cat = searchParams.get('cat');
    setActiveCat(cat ? Number(cat) : null);
  }, [searchParams]);

  function selectCategory(id: number | null) {
    setActiveCat(id);
    const next = new URLSearchParams(searchParams);
    if (id) next.set('cat', String(id));
    else next.delete('cat');
    setSearchParams(next, { replace: true });
  }

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([getStoreCategories(slug), getStoreProducts(slug)])
      .then(([cats, prods]) => {
        if (!alive) return;
        setCategories(cats);
        setProducts(prods);
      })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [slug]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (activeCat && p.category_id !== activeCat) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [products, activeCat, search]);

  const featured = useMemo(() => products.filter((p) => p.online_featured), [products]);
  const featuredCats = useMemo(() => categories.filter((c) => c.online_featured), [categories]);

  return (
    <div>
      {banner && (
        <div className="w-full h-60 md:h-80 lg:h-[28rem] bg-gray-200 overflow-hidden">
          <img src={banner} alt="banner" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar productos…"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2"
            style={{ ['--tw-ring-color' as any]: primary }}
          />
        </div>

        {featuredCats.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Categorías destacadas</h2>
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => selectCategory(null)}
                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-semibold transition-colors ${
                  activeCat === null ? 'text-white' : 'bg-white text-gray-700 border border-gray-200'
                }`}
                style={activeCat === null ? { backgroundColor: primary } : {}}
              >
                Todas
              </button>
              {featuredCats.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectCategory(c.id)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-semibold transition-colors ${
                    activeCat === c.id ? 'text-white' : 'bg-white text-gray-700 border border-gray-200'
                  }`}
                  style={activeCat === c.id ? { backgroundColor: primary } : {}}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-400">Cargando productos…</div>
        ) : (
          <>
            {!activeCat && !search && featured.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Star className="h-5 w-5" style={{ color: primary }} /> Destacados
                </h2>
                <div className={gridClass}>
                  {featured.map((p) => <ProductCard key={`f-${p.id}`} p={p} primary={primary} onOpen={setQuickViewId} />)}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                {activeCat ? categories.find((c) => c.id === activeCat)?.name : 'Catálogo'}
              </h2>
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-gray-400">No se encontraron productos.</div>
              ) : (
                <div className={gridClass}>
                  {filtered.map((p) => <ProductCard key={p.id} p={p} primary={primary} onOpen={setQuickViewId} />)}
                </div>
              )}
            </div>

          </>
        )}
      </div>

      {!loading && (() => {
        const videoId = extractYouTubeId(info.settings?.promo_video_url || '');
        if (!videoId) return null;
        const params = new URLSearchParams({
          autoplay: '1',
          mute: '1',
          controls: '0',
          loop: '1',
          playlist: videoId,
          modestbranding: '1',
          rel: '0',
          playsinline: '1',
          iv_load_policy: '3',
          disablekb: '1',
          fs: '0',
        }).toString();
        return (
          <section className="relative w-full overflow-hidden py-8 md:py-12">
            <div className="relative w-full overflow-hidden" style={{ paddingBottom: '42%' }}>
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?${params}`}
                title=""
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{ width: '140%', height: '140%' }}
                frameBorder={0}
                allow="autoplay; encrypted-media; picture-in-picture"
              />
              <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-gray-50 to-transparent pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none" />
            </div>
          </section>
        );
      })()}

      {quickViewId !== null && (() => {
        const openState = isStoreOpenNow(parseSchedule(info.settings?.schedule_json));
        return (
          <ProductQuickView
            slug={slug}
            productId={quickViewId}
            primary={primary}
            onClose={() => setQuickViewId(null)}
            closed={!openState.open}
            closedReason={openState.reason}
          />
        );
      })()}
    </div>
  );
}

export default function StoreHome() {
  return <PublicStoreLayout>{(info) => <StoreHomeInner info={info} />}</PublicStoreLayout>;
}
