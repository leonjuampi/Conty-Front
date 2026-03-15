import { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '../../components/feature/AppLayout';
import { ProductForm } from './components/ProductForm';
import { CategoryModal } from './components/CategoryModal';
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  listCategories,
  createCategory,
  deleteCategory,
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

  const categoryNames = categories.map(c => c.name);
  const filterCategories = ['all', ...categoryNames];

  const fetchProducts = useCallback(async () => {
    try {
      const res = await listProducts({ limit: 200 });
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

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleSave = async (data: any) => {
    const catId = categories.find(c => c.name === data.category)?.id;
    const payload = {
      name: data.name,
      description: data.description || '',
      categoryId: catId ?? null,
      status: data.active ? 'ACTIVE' : 'INACTIVE',
      imageUrl: data.image || null,
      variants: [{
        name: 'default',
        sku: data.barcode || null,
        price: parseFloat(data.price) || 0,
        cost: parseFloat(data.cost) || 0,
      }],
    };
    try {
      if (selectedProduct) {
        await updateProduct(selectedProduct.id, payload as any);
      } else {
        await createProduct(payload as any);
      }
      await fetchProducts();
      setShowForm(false);
      setSelectedProduct(null);
    } catch {
      alert('Error al guardar el producto');
    }
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

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-16">
          <i className="ri-loader-4-line animate-spin text-3xl text-orange-500"></i>
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
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowCategoryModal(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 bg-white border border-orange-400 text-orange-600 rounded-lg hover:bg-orange-50 transition-all cursor-pointer whitespace-nowrap font-medium"
            >
              <i className="ri-price-tag-3-line text-lg"></i>
              <span>Nueva Categoría</span>
            </button>
            <button
              onClick={() => { setSelectedProduct(null); setShowForm(true); }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:shadow-lg transition-all cursor-pointer whitespace-nowrap font-medium"
            >
              <i className="ri-add-line text-lg"></i>
              <span>Nuevo Producto</span>
            </button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm cursor-pointer"
          >
            <option value="all">Todas las categorías</option>
            {filterCategories.filter(c => c !== 'all').map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
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
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-orange-100 to-red-100 rounded-lg shrink-0 overflow-hidden">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <i className="ri-restaurant-line text-orange-500 text-xl"></i>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{product.name}</p>
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
                      <button onClick={() => { setSelectedProduct(product); setShowForm(true); }} className="w-8 h-8 flex items-center justify-center text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"><i className="ri-edit-line text-lg"></i></button>
                      <button onClick={() => handleDelete(product.id)} className="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"><i className="ri-delete-bin-line text-lg"></i></button>
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
        {filteredProducts.map((product) => (
          <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="aspect-square bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center overflow-hidden">
              {product.image ? (
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <i className="ri-restaurant-line text-orange-500 text-4xl"></i>
              )}
            </div>
            <div className="p-3">
              <h3 className="font-bold text-gray-800 text-sm line-clamp-1 mb-1">{product.name}</h3>
              <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium mb-2">{product.category || '—'}</span>
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-bold text-gray-800">${product.price.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setSelectedProduct(product); setShowForm(true); }} className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer text-xs font-medium"><i className="ri-edit-line"></i><span>Editar</span></button>
                <button onClick={() => handleDelete(product.id)} className="w-9 h-9 flex items-center justify-center bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors cursor-pointer shrink-0"><i className="ri-delete-bin-line"></i></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && !loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <i className="ri-search-line text-6xl text-gray-300 mb-4"></i>
          <p className="text-gray-600">No se encontraron productos</p>
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
    </AppLayout>
  );
}
