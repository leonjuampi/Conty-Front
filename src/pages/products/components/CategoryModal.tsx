
import { useState } from 'react';

interface CategoryModalProps {
  categories: string[];
  onAdd: (name: string) => void;
  onDelete: (name: string) => void;
  onClose: () => void;
}

const PROTECTED_CATEGORIES = ['Pizzas', 'Empanadas', 'Bebidas', 'Postres', 'Otros'];

export function CategoryModal({ categories, onAdd, onDelete, onClose }: CategoryModalProps) {
  const [newCategory, setNewCategory] = useState('');
  const [error, setError] = useState('');

  const handleAdd = () => {
    const trimmed = newCategory.trim();
    if (!trimmed) {
      setError('El nombre no puede estar vacío.');
      return;
    }
    if (categories.map(c => c.toLowerCase()).includes(trimmed.toLowerCase())) {
      setError('Ya existe una categoría con ese nombre.');
      return;
    }
    onAdd(trimmed);
    setNewCategory('');
    setError('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className="ri-price-tag-3-line text-white text-xl"></i>
            <h2 className="text-lg font-bold text-white">Gestionar Categorías</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-white hover:text-orange-200 transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        <div className="p-6">
          {/* Input nueva categoría */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nueva categoría
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => { setNewCategory(e.target.value); setError(''); }}
                onKeyDown={handleKeyDown}
                placeholder="Ej: Pastas, Postres especiales..."
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                maxLength={40}
              />
              <button
                onClick={handleAdd}
                className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:shadow-md transition-all cursor-pointer whitespace-nowrap font-medium text-sm flex items-center gap-1"
              >
                <i className="ri-add-line text-base"></i>
                Agregar
              </button>
            </div>
            {error && (
              <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                <i className="ri-error-warning-line"></i>
                {error}
              </p>
            )}
          </div>

          {/* Lista de categorías */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-3">
              Categorías existentes ({categories.length})
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {categories.map((cat) => {
                const isProtected = PROTECTED_CATEGORIES.includes(cat);
                return (
                  <div
                    key={cat}
                    className="flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <div className="flex items-center gap-2">
                      <i className="ri-price-tag-3-line text-orange-400 text-sm"></i>
                      <span className="text-sm font-medium text-gray-700">{cat}</span>
                      {isProtected && (
                        <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
                          predeterminada
                        </span>
                      )}
                    </div>
                    {!isProtected && (
                      <button
                        onClick={() => onDelete(cat)}
                        className="w-7 h-7 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar categoría"
                      >
                        <i className="ri-delete-bin-line text-sm"></i>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={onClose}
            className="mt-5 w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all cursor-pointer text-sm"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
