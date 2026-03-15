import { useState, useEffect } from 'react';

interface ProductoModalProps {
  item: { id: string; producto: string; origen: string; monto: string } | null;
  onClose: () => void;
  onSave: (data: { producto: string; origen: string; monto: string }) => void;
}

export default function ProductoModal({ item, onClose, onSave }: ProductoModalProps) {
  const [formData, setFormData] = useState({
    producto: '',
    origen: '',
    monto: ''
  });

  useEffect(() => {
    if (item) {
      setFormData({
        producto: item.producto,
        origen: item.origen,
        monto: item.monto
      });
    }
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.producto.trim() || !formData.origen.trim() || !formData.monto.trim()) {
      alert('Por favor complete todos los campos');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">
            {item ? 'Editar Producto' : 'Agregar Producto'}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Producto *
            </label>
            <input
              type="text"
              value={formData.producto}
              onChange={(e) => setFormData({ ...formData, producto: e.target.value })}
              placeholder="Ej: ACEITE, HARINA, TOMATE..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8650A] focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Origen *
            </label>
            <input
              type="text"
              value={formData.origen}
              onChange={(e) => setFormData({ ...formData, origen: e.target.value })}
              placeholder="Ej: FERIA, PANADERÍA, CARNE..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8650A] focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto ($) *
            </label>
            <input
              type="text"
              value={formData.monto}
              onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
              placeholder="Ej: 1500 o (6000+100)/200"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8650A] focus:border-transparent text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Puede ingresar un número fijo o una fórmula matemática
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-[#E8650A] text-white rounded-lg hover:bg-[#d15809] transition-colors whitespace-nowrap"
            >
              {item ? 'Guardar Cambios' : 'Agregar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}