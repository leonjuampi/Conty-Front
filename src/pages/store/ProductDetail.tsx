import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Minus, Plus, ShoppingCart } from 'lucide-react';
import PublicStoreLayout from './PublicStoreLayout';
import { getStoreProductDetail, type StoreProductDetail, type StoreInfo } from '../../services/publicStore.service';
import { useCart } from './cartStore';

function moneyAR(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n);
}

function ProductDetailInner({ info }: { info: StoreInfo }) {
  const { slug = '', productId = '' } = useParams<{ slug: string; productId: string }>();
  const navigate = useNavigate();
  const primary = info.settings?.primary_color || '#10b981';
  const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/api$/, '');
  const { addItem } = useCart(slug);

  const [product, setProduct] = useState<StoreProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [variantId, setVariantId] = useState<number | null>(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getStoreProductDetail(slug, Number(productId))
      .then((p) => { if (alive) setProduct(p); })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [slug, productId]);

  if (loading) return <div className="text-center py-12 text-gray-400">Cargando…</div>;
  if (!product) return <div className="text-center py-12 text-gray-400">Producto no encontrado</div>;

  const resolve = (u: string) => (u.startsWith('http') ? u : `${apiBase}${u}`);
  const gallery = useMemo(() => {
    const urls = (product?.images ?? [])
      .slice()
      .sort((a, b) => (b.is_primary - a.is_primary) || (a.sort_order - b.sort_order))
      .map((i) => resolve(i.image_url));
    if (urls.length === 0 && product?.image_url) urls.push(resolve(product.image_url));
    return urls;
  }, [product, apiBase]);
  const activeImg = gallery[activeImageIdx] ?? gallery[0] ?? null;

  const selectedVariant = variantId ? product.variants.find((v) => v.id === variantId) : null;
  const price = selectedVariant?.price ?? product.price;
  const stock = selectedVariant?.stock ?? product.stock;
  const hasVariants = product.variants.length > 0;
  const canAdd = stock > 0 && (!hasVariants || variantId);

  function handleAdd() {
    if (!canAdd || !product) return;
    addItem({
      product_id: product.id,
      variant_id: variantId,
      qty,
      unit_price: Number(price),
      product_name: product.name + (selectedVariant?.name ? ` - ${selectedVariant.name}` : ''),
      image_url: product.image_url,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft className="h-4 w-4" /> Volver
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="flex flex-col">
          <div className="relative aspect-square bg-gray-100 overflow-hidden flex items-center justify-center">
            {activeImg ? (
              <>
                <img
                  src={activeImg}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-60"
                />
                <img
                  src={activeImg}
                  alt={product.name}
                  className="relative max-w-full max-h-full object-contain drop-shadow-md"
                />
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 text-7xl">📦</div>
            )}
            {gallery.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveImageIdx((i) => (i - 1 + gallery.length) % gallery.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/85 hover:bg-white shadow"
                  aria-label="Anterior"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImageIdx((i) => (i + 1) % gallery.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/85 hover:bg-white shadow"
                  aria-label="Siguiente"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="px-3 py-3 flex gap-2 overflow-x-auto">
              {gallery.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImageIdx(i)}
                  className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${i === activeImageIdx ? 'border-gray-900' : 'border-transparent opacity-70 hover:opacity-100'}`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 flex flex-col">
          {product.category_name && <div className="text-sm text-gray-400 mb-1">{product.category_name}</div>}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
          <div className="text-3xl font-bold mb-4" style={{ color: primary }}>{moneyAR(Number(price))}</div>

          {product.description && (
            <p className="text-gray-600 whitespace-pre-line mb-4">{product.description}</p>
          )}

          {hasVariants && (
            <div className="mb-4">
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Variante</label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setVariantId(v.id)}
                    disabled={v.stock <= 0}
                    className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                      variantId === v.id ? 'text-white border-transparent' : 'bg-white border-gray-200 text-gray-700'
                    } ${v.stock <= 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
                    style={variantId === v.id ? { backgroundColor: primary } : {}}
                  >
                    {v.name || v.sku}
                    {v.stock <= 0 && ' (sin stock)'}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mb-4">
            <label className="text-sm font-semibold text-gray-700 mb-2 block">Cantidad</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="font-bold text-lg w-10 text-center">{qty}</span>
              <button
                onClick={() => setQty(Math.min(stock, qty + 1))}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
              >
                <Plus className="h-4 w-4" />
              </button>
              <span className="text-xs text-gray-400 ml-2">Stock: {stock}</span>
            </div>
          </div>

          {stock <= 0 ? (
            <div className="bg-gray-100 text-gray-500 text-center py-3 rounded-xl font-semibold">Sin stock</div>
          ) : (
            <button
              onClick={handleAdd}
              disabled={!canAdd}
              className="w-full py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: primary }}
            >
              <ShoppingCart className="h-5 w-5" />
              {added ? '¡Agregado!' : hasVariants && !variantId ? 'Seleccioná una variante' : 'Agregar al carrito'}
            </button>
          )}

          <Link
            to={`/s/${slug}/carrito`}
            className="text-center mt-3 text-sm font-semibold hover:underline"
            style={{ color: primary }}
          >
            Ver carrito →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetail() {
  return <PublicStoreLayout>{(info) => <ProductDetailInner info={info} />}</PublicStoreLayout>;
}
