import { useState, useEffect, useCallback, useRef } from 'react';
import { AppLayout } from '../../components/feature/AppLayout';
import { ProductForm } from './components/ProductForm';
import { CategoryModal } from './components/CategoryModal';
import { ImportProductsModal } from './components/ImportProductsModal';
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  listCategories,
  createCategory,
  deleteCategory,
  importProducts,
  uploadProductImage,
  type Category,
} from '../../services/products.service';

interface LocalProduct {
  id: number;
  name: string;
  description: string;
  category: string;
  categoryId: number | null;
  barcode: string;
  cost: number;
  price: number;
  image: string;
  active: boolean;
  isCombo: boolean;
  hasVariants: boolean;
  comboItems: any[];
}

export default function ProductsPage() {
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<LocalProduct | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ successCount: number; errorCount: number; errors: { row: number; message: string }[] } | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const pageSize = 100;
  const totalPages = Math.max(1, Math.ceil(totalProducts / pageSize));

  const categoryNames = categories.map(c => c.name);
  const filterCategories = ['all', ...categoryNames];

  const fetchProducts = useCallback(async (page = 1, search?: string, catId?: number) => {
    try {
      const params: Parameters<typeof listProducts>[0] = { page, pageSize };
      if (search) params.search = search;
      if (catId) params.categoryId = catId;
      const res = await listProducts(params);
      setTotalProducts(res.total ?? 0);
      setCurrentPage(res.page ?? page);
      setProducts(res.items.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        category: p.categoryName || '',
        categoryId: p.categoryId,
        barcode: p.variants[0]?.sku || '',
        cost: p.variants[0]?.cost || 0,
        price: p.variants[0]?.price || 0,
        image: p.imageUrl || '',
        active: p.status === 'ACTIVE',
        isCombo: p.isCombo ?? false,
        hasVariants: p.hasVariants ?? false,
        comboItems: p.comboItems ?? [],
      })));
    } catch {}
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await listCategories();
      setCategories(res.items);
    } catch {}
  }, []);

  useEffect(() => {
    Promise.all([fetchProducts(), fetchCategories()]).finally(() => setLoading(false));
  }, [fetchProducts, fetchCategories]);

  // Re-fetch con debounce cuando cambian búsqueda o categoría
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      const catId = categories.find(c => c.name === categoryFilter)?.id;
      setLoading(true);
      fetchProducts(1, searchTerm || undefined, catId).finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(searchTimeout.current);
  }, [searchTerm, categoryFilter, categories, fetchProducts]);

  const handleSave = async (data: any) => {
    const catId = categories.find(c => c.name === data.category)?.id;
    const payload = {
      name: data.name,
      description: data.description || '',
      categoryId: catId ?? null,
      status: data.active ? 'ACTIVE' : 'INACTIVE',
      imageUrl: data.image || null,
      isCombo: data.isCombo ?? false,
      comboItems: data.comboItems ?? [],
      variants: [{
        name: 'default',
        sku: data.barcode || null,
        price: parseFloat(data.price) || 0,
        cost: parseFloat(data.cost) || 0,
      }],
    };
    try {
      let productId: number;
      if (selectedProduct) {
        await updateProduct(selectedProduct.id, payload as any);
        productId = selectedProduct.id;
      } else {
        const res = await createProduct(payload as any);
        productId = res.id;
      }
      // Subir imagen si el usuario eligió un archivo
      if (data.imageFile) {
        await uploadProductImage(productId, data.imageFile);
      }
      const filterCatId = categories.find(c => c.name === categoryFilter)?.id;
      await fetchProducts(currentPage, searchTerm || undefined, filterCatId);
      setShowForm(false);
      setSelectedProduct(null);
    } catch {
      alert('Error al guardar el producto');
    }
  };

  const handleEditProduct = async (product: LocalProduct) => {
    if (product.isCombo) {
      try {
        const full = await getProduct(product.id);
        setSelectedProduct({ ...product, comboItems: full.comboItems ?? [] });
      } catch {
        setSelectedProduct(product);
      }
    } else {
      setSelectedProduct(product);
    }
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;
    try {
      await deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch {
      alert('Error al eliminar el producto');
    }
  };

  const handleAddCategory = async (name: string) => {
    try {
      await createCategory({ name });
      await fetchCategories();
    } catch {
      alert('Error al crear la categoría');
    }
  };

  const handleDeleteCategory = async (name: string) => {
    const cat = categories.find(c => c.name === name);
    if (!cat) return;
    try {
      await deleteCategory(cat.id);
      await fetchCategories();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al eliminar la categoría';
      alert(msg);
    }
  };

  const handleImportFile = async (file: File) => {
    setImportLoading(true);
    setImportResult(null);
    try {
      const result = await importProducts(file);
      setImportResult(result);
      if (result.successCount > 0) {
        const catId = categories.find(c => c.name === categoryFilter)?.id;
        await fetchProducts(currentPage, searchTerm || undefined, catId);
      }
      return result;
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al importar el archivo';
      alert(msg);
      return { successCount: 0, errorCount: 1, errors: [{ row: 0, message: msg }] };
    } finally {
      setImportLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-16">
          <i className="ri-loader-4-line animate-spin text-3xl text-brand-500"></i>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Productos</h1>
            <p className="text-sm text-gray-600 mt-1">Gestión de productos del catálogo</p>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button onClick={() => setShowCategoryModal(true)}
              className="flex items-center gap-2 px-3 py-2.5 bg-white border border-brand-400 text-brand-600 rounded-lg hover:bg-brand-50 cursor-pointer whitespace-nowrap font-medium text-sm">
              <i className="ri-price-tag-3-line"></i>
              <span>Categorías</span>
            </button>
            <button onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-3 py-2.5 bg-white border border-teal-500 text-teal-700 rounded-lg hover:bg-teal-50 cursor-pointer whitespace-nowrap font-medium text-sm">
              <i className="ri-upload-line"></i>
              <span>Importar</span>
            </button>
            <button onClick={() => { setSelectedProduct(null); setShowForm(true); }}
              className="flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-lg hover:shadow-lg cursor-pointer whitespace-nowrap font-medium text-sm">
              <i className="ri-add-line"></i>
              <span>Nuevo Producto</span>
            </button>
          </div>
        </div>


        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
            <input type="text" placeholder="Buscar productos..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 text-sm" />
          </div>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 text-sm cursor-pointer">
            <option value="all">Todas las categorías</option>
            {filterCategories.filter(c => c !== 'all').map(cat => (<option key={cat} value={cat}>{cat}</option>))}
          </select>
        </div>
      </div>

      {/* Vista de tabla en desktop */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Producto</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Categoría</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Precio</th>
                <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 flex items-center justify-center rounded-lg shrink-0 overflow-hidden ${product.isCombo ? 'bg-gradient-to-br from-purple-100 to-violet-100' : 'bg-gradient-to-br from-brand-100 to-brand-100'}`}>
                        {product.image
                          ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          : <i className={`${product.isCombo ? 'ri-gift-line text-purple-500' : 'ri-restaurant-line text-brand-500'} text-xl`}></i>}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-800">{product.name}</p>
                          {product.isCombo && (
                            <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-bold">COMBO</span>
                          )}
                        </div>
                        {product.description && <p className="text-xs text-gray-500 line-clamp-1">{product.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{product.category || '—'}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-bold text-gray-800">${product.price.toLocaleString('es-AR')}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleEditProduct(product)}
                        className="w-8 h-8 flex items-center justify-center text-brand-600 hover:bg-brand-50 rounded-lg cursor-pointer">
                        <i className="ri-edit-line text-lg"></i>
                      </button>
                      <button onClick={() => handleDelete(product.id)}
                        className="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-50 rounded-lg cursor-pointer">
                        <i className="ri-delete-bin-line text-lg"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vista de tarjetas en mobile */}
      <div className="md:hidden grid grid-cols-2 gap-3">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className={`aspect-square flex items-center justify-center overflow-hidden ${product.isCombo ? 'bg-gradient-to-br from-purple-100 to-violet-100' : 'bg-gradient-to-br from-brand-100 to-brand-100'}`}>
              {product.image
                ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                : <i className={`${product.isCombo ? 'ri-gift-line text-purple-400' : 'ri-restaurant-line text-brand-500'} text-4xl`}></i>}
            </div>
            <div className="p-3">
              <div className="flex items-center gap-1 mb-1">
                <h3 className="font-bold text-gray-800 text-sm line-clamp-1">{product.name}</h3>
                {product.isCombo && <span className="px-1 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-bold shrink-0">C</span>}
              </div>
              <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium mb-2">{product.category || '—'}</span>
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-bold text-gray-800">${product.price.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleEditProduct(product)}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-brand-50 text-brand-600 rounded-lg hover:bg-brand-100 cursor-pointer text-xs font-medium">
                  <i className="ri-edit-line"></i><span>Editar</span>
                </button>
                <button onClick={() => handleDelete(product.id)}
                  className="w-9 h-9 flex items-center justify-center bg-red-50 text-red-600 rounded-lg hover:bg-red-100 cursor-pointer shrink-0">
                  <i className="ri-delete-bin-line"></i>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && !loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <i className="ri-search-line text-6xl text-gray-300 mb-4"></i>
          <p className="text-gray-600">No se encontraron productos</p>
        </div>
      )}

      {/* Paginación */}
      {totalPages > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4">
          <p className="text-sm text-gray-600">
            Mostrando página <span className="font-semibold text-gray-800">{currentPage}</span> de <span className="font-semibold text-gray-800">{totalPages}</span>
            <span className="text-gray-400 ml-2">({totalProducts} productos en total)</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const catId = categories.find(c => c.name === categoryFilter)?.id;
                setLoading(true);
                fetchProducts(currentPage - 1, searchTerm || undefined, catId).finally(() => setLoading(false));
              }}
              disabled={currentPage <= 1}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
              <i className="ri-arrow-left-s-line"></i>
              Anterior
            </button>
            <button
              onClick={() => {
                const catId = categories.find(c => c.name === categoryFilter)?.id;
                setLoading(true);
                fetchProducts(currentPage + 1, searchTerm || undefined, catId).finally(() => setLoading(false));
              }}
              disabled={currentPage >= totalPages}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
              Siguiente
              <i className="ri-arrow-right-s-line"></i>
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <ProductForm
          product={selectedProduct}
          categories={categoryNames}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setSelectedProduct(null); }}
        />
      )}

      {showCategoryModal && (
        <CategoryModal
          categories={categoryNames}
          onAdd={handleAddCategory}
          onDelete={handleDeleteCategory}
          onClose={() => setShowCategoryModal(false)}
        />
      )}

      {showImportModal && (
        <ImportProductsModal
          onImport={handleImportFile}
          onClose={() => { setShowImportModal(false); setImportResult(null); }}
          loading={importLoading}
          result={importResult}
          onClearResult={() => setImportResult(null)}
        />
      )}
    </AppLayout>
  );
}
