
import { useState } from 'react';

export interface PosProduct {
  id: string;
  variantId: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  image: string | null;
  active: boolean;
  isCombo?: boolean;
}

interface ProductSelectorProps {
  products: PosProduct[];
  isLoading?: boolean;
  onSelectProduct: (productId: string) => void;
  cashBlocked?: boolean;
}

export function ProductSelector({ products, isLoading = false, onSelectProduct, cashBlocked = false }: ProductSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = ['Todas', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'Todas' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch && product.active;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <i className="ri-loader-4-line animate-spin text-3xl text-brand-500"></i>
      </div>
    );
  }

  return (
    <div>
      {/* Búsqueda y Filtros */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={cashBlocked}
            className={`w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm ${cashBlocked ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}`}
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => !cashBlocked && setSelectedCategory(category)}
              disabled={cashBlocked}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                cashBlocked
                  ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400 border border-gray-200'
                  : selectedCategory === category
                    ? 'bg-brand-500 text-white shadow-md cursor-pointer'
                    : 'bg-white text-gray-700 hover:bg-brand-50 border border-gray-200 cursor-pointer'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Productos */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map(product => (
          <div key={product.id} className="relative">
            <button
              onClick={() => onSelectProduct(product.id)}
              disabled={cashBlocked}
              className={`w-full bg-white rounded-xl shadow-sm p-4 text-left border transition-all group ${
                cashBlocked
                  ? 'opacity-50 cursor-not-allowed border-gray-100'
                  : 'hover:shadow-lg hover:border-brand-400 border-gray-100 cursor-pointer'
              }`}
            >
              <div className={`aspect-square w-full h-32 mb-3 rounded-lg overflow-hidden flex items-center justify-center ${product.isCombo ? 'bg-purple-50' : 'bg-gray-100'}`}>
                {product.image ? (
                  <img src={product.image} alt={product.name} className={`w-full h-full object-cover transition-transform ${!cashBlocked ? 'group-hover:scale-105' : ''}`} />
                ) : (
                  <i className={`text-4xl ${product.isCombo ? 'ri-gift-line text-purple-300' : 'ri-store-2-line text-gray-300'}`}></i>
                )}
              </div>
              <div className="flex items-start gap-1 mb-1">
                <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 flex-1">{product.name}</h3>
                {product.isCombo && <span className="px-1 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-bold shrink-0 leading-tight">COMBO</span>}
              </div>
              <p className="text-xs text-gray-500 mb-2">{product.category}</p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-brand-600">${product.price.toLocaleString()}</span>
                {product.stock > 0 && <span className="text-xs text-gray-500">Stock: {product.stock}</span>}
              </div>
            </button>

            {cashBlocked && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl">
                <div className="w-8 h-8 flex items-center justify-center bg-red-100 rounded-full">
                  <i className="ri-lock-line text-red-500 text-base"></i>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <i className="ri-inbox-line text-6xl text-gray-300 mb-4"></i>
          <p className="text-gray-500">No se encontraron productos</p>
        </div>
      )}
    </div>
  );
}
