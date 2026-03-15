
import { useState, useEffect } from 'react';

interface Client {
  id?: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  active: boolean;
}

interface ClientFormProps {
  client?: Client | null;
  onSave: (data: Client) => void;
  onClose: () => void;
}

export function ClientForm({ client, onSave, onClose }: ClientFormProps) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    active: true,
  });

  useEffect(() => {
    if (client) {
      setForm({
        firstName: client.firstName,
        lastName: client.lastName,
        phone: client.phone ?? '',
        email: client.email ?? '',
        address: client.address ?? '',
        notes: client.notes ?? '',
        active: client.active,
      });
    }
  }, [client]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim() || !form.phone.trim()) return;
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-white w-full h-full md:h-auto md:rounded-2xl shadow-2xl md:max-w-lg overflow-y-auto">
        {/* Header fijo */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-4 md:p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-orange-400 to-red-500 rounded-xl">
              <i className="ri-user-line text-white text-lg"></i>
            </div>
            <h2 className="text-lg md:text-xl font-bold text-gray-800">
              {client ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre *</label>
              <input
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                required
                placeholder="Juan"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm min-h-[48px]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Apellido *</label>
              <input
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                required
                placeholder="Pérez"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm min-h-[48px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Teléfono *</label>
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              required
              placeholder="11-4567-8901"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm min-h-[48px]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="juan@email.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm min-h-[48px]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Dirección</label>
            <input
              type="text"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Av. Corrientes 1234, CABA"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm min-h-[48px]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Notas</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Preferencias, alergias, observaciones..."
              rows={3}
              maxLength={500}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm resize-none min-h-[80px]"
            />
            <p className="text-xs text-gray-400 text-right mt-1">{form.notes.length}/500</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap text-sm min-h-[48px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-all shadow-md cursor-pointer whitespace-nowrap text-sm min-h-[48px]"
            >
              {client ? 'Guardar Cambios' : 'Crear Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}