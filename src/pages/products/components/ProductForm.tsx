import { useState, useEffect } from 'react';

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
    active: true
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        category: product.category,
        barcode: product.barcode,
        cost: product.cost.toString(),
        price: product.price.toString(),
        image: product.image,
        active: product.active
      });
    }
  }, [product]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category || !formData.cost || !formData.price) {
      return;
    }

    onSave({
      ...formData,
      cost: parseFloat(formData.cost),
      price: parseFloat(formData.price),
    });
  };

  const generateImageUrl = () => {
    if (!formData.name) {
      return;
    }
    const prompt = `delicious ${formData.name} food photography on clean white background with soft lighting professional product shot appetizing presentation high quality commercial style simple minimal`;
    const url = `https://readdy.ai/api/search-image?query=$%7BencodeURIComponent%28prompt%29%7D&width=400&height=400&seq=prod${Date.now()}&orientation=squarish`;
    setFormData({ ...formData, image: url });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-0 md:p-4 overflow-y-auto">
      <div className="bg-white w-full h-full md:h-auto md:rounded-2xl shadow-2xl md:max-w-2xl md:my-8 overflow-y-auto">
        {/* Header fijo */}
        <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-red-500 z-10 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-bold text-white">
              {product ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors cursor-pointer w-10 h-10 flex items-center justify-center"
            >
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre del Producto <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm min-h-[48px]"
                placeholder="Ej: Pizza Muzzarella"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Categoría <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm min-h-[48px] cursor-pointer"
                required
              >
                <option value="">Seleccionar categoría</option>
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Código de Barras
              </label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm min-h-[48px]"
                placeholder="7790001234567"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Costo <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm min-h-[48px]"
                  placeholder="1200"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Precio de Venta <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm min-h-[48px]"
                  placeholder="2500"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Imagen del Producto
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm min-h-[48px]"
                  placeholder="URL de la imagen"
                />
                <button
                  type="button"
                  onClick={generateImageUrl}
                  className="px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all whitespace-nowrap cursor-pointer text-sm min-h-[48px]"
                >
                  <i className="ri-image-add-line mr-2"></i>
                  Generar
                </button>
              </div>
              {formData.image && (
                <div className="mt-3 w-32 h-32 rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={formData.image}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer min-h-[48px]">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500 cursor-pointer"
                />
                <span className="text-sm font-semibold text-gray-700">Producto activo</span>
              </label>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 md:py-4 rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-all whitespace-nowrap cursor-pointer text-sm md:text-base min-h-[52px]"
            >
              <i className="ri-save-line mr-2"></i>
              {product ? 'Guardar Cambios' : 'Crear Producto'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white text-gray-700 py-3 md:py-4 rounded-lg font-semibold hover:bg-gray-100 transition-all border border-gray-300 whitespace-nowrap cursor-pointer text-sm md:text-base min-h-[52px]"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}