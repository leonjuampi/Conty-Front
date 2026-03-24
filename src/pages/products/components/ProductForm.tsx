import { useState, useEffect } from 'react';
import { listProducts } from '../../../services/products.service';
import type { ComboItem } from '../../../services/products.service';

interface ProductFormProps {
  product: any;
  categories?: string[];
  onSave: (product: any) => void;
  onClose: () => void;
}

const DEFAULT_CATEGORIES = ['Pizzas', 'Empanadas', 'Bebidas', 'Postres', 'Otros'];

export function ProductForm({ product, categories, onSave, onClose }: ProductFormProps) {
  const availableCategories = categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    barcode: '',
    cost: '',
    price: '',
    image: '',
    active: true,
  });
  const [isCombo, setIsCombo] = useState(false);
  const [comboItems, setComboItems] = useState<ComboItem[]>([]);
  const [comboSearch, setComboSearch] = useState('');
  const [comboResults, setComboResults] = useState<{ variantId: number; variantName: string; productName: string; price: number; cost: number }[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        category: product.category,
        barcode: product.barcode,
        cost: product.cost.toString(),
        price: product.price.toString(),
        image: product.image,
        active: product.active,
      });
      setIsCombo(product.isCombo ?? false);
      setComboItems(product.comboItems ?? []);
    }
  }, [product]);

  // Buscar productos para agregar como componentes del combo
  useEffect(() => {
    if (!comboSearch.trim() || comboSearch.length < 2) { setComboResults([]); return; }
    const timeout = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await listProducts({ search: comboSearch, status: 'ACTIVE', limit: 20 });
        const results = res.items
          .filter(p => !p.isCombo) // no se puede agregar un combo dentro de un combo
          .flatMap(p =>
            p.variants.map(v => ({
              variantId: v.id,
              variantName: v.name === 'default' ? '' : v.name,
              productName: p.name,
              price: v.price,
              cost: v.cost ?? 0,
            }))
          );
        setComboResults(results);
      } catch { setComboResults([]); }
      setSearchLoading(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [comboSearch]);

  const addComboItem = (item: { variantId: number; variantName: string; productName: string; price: number; cost: number }) => {
    if (comboItems.some(c => c.variantId === item.variantId)) return;
    setComboItems([...comboItems, { variantId: item.variantId, qty: 1, variantName: item.variantName, productName: item.productName, price: item.price, cost: item.cost }]);
    setComboSearch('');
    setComboResults([]);
  };

  const removeComboItem = (variantId: number) => {
    setComboItems(comboItems.filter(c => c.variantId !== variantId));
  };

  const updateComboQty = (variantId: number, qty: number) => {
    setComboItems(comboItems.map(c => c.variantId === variantId ? { ...c, qty } : c));
  };

  // Recalcular costo y precio al cambiar los componentes del combo.
  // Solo cuando los items tienen precio (agregados desde el buscador, no cargados del backend).
  useEffect(() => {
    if (!isCombo || comboItems.length === 0) return;
    if (comboItems.every(c => c.price === undefined)) return;
    const totalCost = comboItems.reduce((sum, c) => sum + ((c.cost ?? 0) * c.qty), 0);
    const totalPrice = comboItems.reduce((sum, c) => sum + ((c.price ?? 0) * c.qty), 0);
    setFormData(prev => ({ ...prev, cost: totalCost.toString(), price: totalPrice.toString() }));
  }, [comboItems, isCombo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category || !formData.cost || !formData.price) return;
    if (isCombo && comboItems.length === 0) {
      alert('El combo debe tener al menos 1 componente.');
      return;
    }
    onSave({
      ...formData,
      cost: parseFloat(formData.cost),
      price: parseFloat(formData.price),
      isCombo,
      comboItems: isCombo ? comboItems : [],
    });
  };

  const generateImageUrl = () => {
    if (!formData.name) return;
    const prompt = `delicious ${formData.name} food photography on clean white background with soft lighting professional product shot appetizing presentation high quality commercial style simple minimal`;
    const url = `https://readdy.ai/api/search-image?query=${encodeURIComponent(prompt)}&width=400&height=400&seq=prod${Date.now()}&orientation=squarish`;
    setFormData({ ...formData, image: url });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-0 md:p-4 overflow-y-auto">
      <div className="bg-white w-full h-full md:h-auto md:rounded-2xl shadow-2xl md:max-w-2xl md:my-8 md:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-brand-500 to-brand-600 z-10 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-bold text-white">
              {product ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
            <button onClick={onClose} className="text-white hover:text-gray-200 cursor-pointer w-10 h-10 flex items-center justify-center">
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-5">

          {/* Toggle combo */}
          <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-xl">
            <div>
              <p className="text-sm font-semibold text-purple-800">Producto combo</p>
              <p className="text-xs text-purple-600 mt-0.5">Agrupá varios productos en uno con precio especial</p>
            </div>
            <button type="button" onClick={() => setIsCombo(!isCombo)}
              className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${isCombo ? 'bg-purple-500' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isCombo ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {isCombo ? 'Nombre del combo' : 'Nombre del Producto'} <span className="text-red-500">*</span>
              </label>
              <input type="text" value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 text-sm min-h-[48px]"
                placeholder={isCombo ? 'Ej: Combo Fernet + Coca' : 'Ej: Pizza Muzzarella'}
                required />
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Categoría <span className="text-red-500">*</span></label>
              <select value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 text-sm min-h-[48px] cursor-pointer" required>
                <option value="">Seleccionar categoría</option>
                {availableCategories.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
              </select>
            </div>

            {/* SKU/Barcode — solo para no-combos */}
            {!isCombo && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Código de Barras</label>
                <input type="text" value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 text-sm min-h-[48px]"
                  placeholder="7790001234567" />
              </div>
            )}

            {/* Costo */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Costo <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input type="number" value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 text-sm min-h-[48px]"
                  placeholder="1200" required min="0" step="0.01" />
              </div>
            </div>

            {/* Precio */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {isCombo ? 'Precio final del combo' : 'Precio de Venta'} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input type="number" value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 text-sm min-h-[48px]"
                  placeholder="2500" required min="0" step="0.01" />
              </div>
            </div>

            {/* Imagen */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Imagen del Producto</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input type="text" value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 text-sm min-h-[48px]"
                  placeholder="URL de la imagen" />
                <button type="button" onClick={generateImageUrl}
                  className="px-4 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 cursor-pointer text-sm min-h-[48px] whitespace-nowrap">
                  <i className="ri-image-add-line mr-2"></i>Generar
                </button>
              </div>
              {formData.image && (
                <div className="mt-3 w-32 h-32 rounded-lg overflow-hidden bg-gray-100">
                  <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Activo */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer min-h-[48px]">
                <input type="checkbox" checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-5 h-5 text-brand-500 border-gray-300 rounded focus:ring-brand-500 cursor-pointer" />
                <span className="text-sm font-semibold text-gray-700">{isCombo ? 'Combo activo' : 'Producto activo'}</span>
              </label>
            </div>
          </div>

          {/* Sección Componentes del Combo */}
          {isCombo && (
            <div className="border-2 border-purple-200 rounded-xl p-4 space-y-4 bg-purple-50/30">
              <div>
                <h3 className="text-sm font-bold text-purple-800 mb-1">Componentes del combo</h3>
                <p className="text-xs text-purple-600">Seleccioná los productos que forman el combo.</p>
              </div>

              {/* Lista de componentes */}
              {comboItems.length > 0 && (
                <div className="space-y-2">
                  {comboItems.map(item => (
                    <div key={item.variantId} className="flex items-center gap-3 bg-white border border-purple-200 rounded-lg px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{item.productName}</p>
                        {item.variantName && <p className="text-xs text-gray-500">{item.variantName}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <label className="text-xs text-gray-500">Cant.</label>
                        <input type="number" value={item.qty} min={1} step={1}
                          onChange={e => updateComboQty(item.variantId, Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-14 px-2 py-1 border border-gray-300 rounded text-sm text-center" />
                        <button type="button" onClick={() => removeComboItem(item.variantId)}
                          className="w-7 h-7 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                          <i className="ri-close-line text-sm"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Buscador de productos */}
              <div className="relative">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  <i className="ri-add-line mr-1"></i>Agregar producto
                </label>
                <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-purple-400">
                  <i className="ri-search-line text-gray-400 text-sm shrink-0"></i>
                  <input type="text" value={comboSearch} onChange={e => setComboSearch(e.target.value)}
                    placeholder="Buscar producto por nombre..."
                    className="flex-1 text-sm outline-none bg-transparent" />
                  {searchLoading && <i className="ri-loader-4-line animate-spin text-purple-400 text-sm shrink-0"></i>}
                </div>

                {comboResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-10 max-h-48 overflow-y-auto">
                    {comboResults.map(r => (
                      <button key={r.variantId} type="button" onClick={() => addComboItem(r)}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-purple-50 transition-colors cursor-pointer text-left border-b border-gray-50 last:border-0">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{r.productName}</p>
                          {r.variantName && <p className="text-xs text-gray-500">{r.variantName}</p>}
                        </div>
                        <span className="text-xs text-gray-500 ml-2 shrink-0">${r.price.toLocaleString()}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {comboItems.length === 0 && (
                <p className="text-xs text-purple-500 text-center py-2">El combo debe incluir al menos 1 producto.</p>
              )}
            </div>
          )}

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button type="submit"
              className="flex-1 bg-gradient-to-r from-brand-500 to-brand-600 text-white py-3 md:py-4 rounded-lg font-semibold hover:from-brand-600 hover:to-brand-700 cursor-pointer text-sm md:text-base min-h-[52px]">
              <i className="ri-save-line mr-2"></i>
              {product ? 'Guardar Cambios' : (isCombo ? 'Crear Combo' : 'Crear Producto')}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 bg-white text-gray-700 py-3 md:py-4 rounded-lg font-semibold hover:bg-gray-100 border border-gray-300 cursor-pointer text-sm md:text-base min-h-[52px]">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
