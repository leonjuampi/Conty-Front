import { useEffect, useMemo, useState } from 'react';
import { Search, Star } from 'lucide-react';
import {
  listProductsForStore,
  listCategoriesForStore,
  patchProductOnline,
  patchCategoryOnline,
  type AdminProductForStore,
  type AdminCategoryForStore,
} from '../../../services/store.service';

type SubTab = 'products' | 'categories';

export default function TiendaOnlineCatalog() {
  const [subTab, setSubTab] = useState<SubTab>('products');
  const [products, setProducts] = useState<AdminProductForStore[]>([]);
  const [categories, setCategories] = useState<AdminCategoryForStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showOnlyOnline, setShowOnlyOnline] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [ps, cs] = await Promise.all([listProductsForStore(), listCategoriesForStore()]);
      setProducts(ps);
      setCategories(cs);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function toggleVisible(p: AdminProductForStore) {
    const next = !p.online_visible;
    setProducts((arr) => arr.map((x) => x.id === p.id ? { ...x, online_visible: next ? 1 : 0 } : x));
    try {
      await patchProductOnline(p.id, { online_visible: next });
    } catch {
      setProducts((arr) => arr.map((x) => x.id === p.id ? { ...x, online_visible: p.online_visible } : x));
    }
  }

  async function toggleFeatured(p: AdminProductForStore) {
    const next = !p.online_featured;
    setProducts((arr) => arr.map((x) => x.id === p.id ? { ...x, online_featured: next ? 1 : 0 } : x));
    try {
      await patchProductOnline(p.id, { online_featured: next });
    } catch {
      setProducts((arr) => arr.map((x) => x.id === p.id ? { ...x, online_featured: p.online_featured } : x));
    }
  }

  async function toggleCatFeatured(c: AdminCategoryForStore) {
    const next = !c.online_featured;
    setCategories((arr) => arr.map((x) => x.id === c.id ? { ...x, online_featured: next ? 1 : 0 } : x));
    try {
      await patchCategoryOnline(c.id, { online_featured: next });
    } catch {
      setCategories((arr) => arr.map((x) => x.id === c.id ? { ...x, online_featured: c.online_featured } : x));
    }
  }

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (showOnlyOnline && !p.online_visible) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [products, search, showOnlyOnline]);

  if (loading) return <div className="text-gray-400 py-12 text-center">Cargando…</div>;

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSubTab('products')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold ${subTab === 'products' ? 'bg-emerald-500 text-white' : 'bg-white text-gray-700 border border-gray-200'}`}
        >Productos</button>
        <button
          onClick={() => setSubTab('categories')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold ${subTab === 'categories' ? 'bg-emerald-500 text-white' : 'bg-white text-gray-700 border border-gray-200'}`}
        >Categorías</button>
      </div>

      {subTab === 'products' && (
        <div className="bg-white rounded-2xl shadow-sm">
          <div className="p-4 flex flex-col md:flex-row gap-3 md:items-center border-b border-gray-100">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar productos…"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={showOnlyOnline} onChange={(e) => setShowOnlyOnline(e.target.checked)} />
              Solo visibles online
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3">Precio</th>
                  <th className="px-4 py-3 text-center">Visible online</th>
                  <th className="px-4 py-3 text-center">Destacado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">{p.name}</div>
                      <div className="text-xs text-gray-400">{p.sku}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.category_name || '—'}</td>
                    <td className="px-4 py-3 font-semibold">${Number(p.price).toLocaleString('es-AR')}</td>
                    <td className="px-4 py-3 text-center">
                      <label className="inline-flex cursor-pointer">
                        <input type="checkbox" checked={!!p.online_visible} onChange={() => toggleVisible(p)} className="sr-only peer" />
                        <div className="w-10 h-5 bg-gray-200 peer-checked:bg-emerald-500 rounded-full relative transition-colors">
                          <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${p.online_visible ? 'translate-x-5' : ''}`} />
                        </div>
                      </label>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleFeatured(p)}
                        disabled={!p.online_visible}
                        className="p-2 disabled:opacity-30"
                      >
                        <Star className={`h-5 w-5 ${p.online_featured ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="text-center text-gray-400 py-8">No hay productos.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === 'categories' && (
        <div className="bg-white rounded-2xl shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3 text-center">Destacada en tienda</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleCatFeatured(c)} className="p-2">
                      <Star className={`h-5 w-5 ${c.online_featured ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                    </button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr><td colSpan={2} className="text-center text-gray-400 py-8">No hay categorías.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
