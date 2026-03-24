import { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '../../components/feature/AppLayout';
import { ClientForm } from './components/ClientForm';
import { ClientDetailModal } from './components/ClientDetailModal';
import { listCustomers, createCustomer, updateCustomer, deleteCustomer, Customer } from '../../services/customers.service';

interface UIClient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  totalOrders: number;
  totalSpent: number;
  lastOrder: string | null;
  active: boolean;
  _apiId: number;
}

function apiToUi(c: Customer): UIClient {
  const parts = (c.name || '').split(' ');
  return {
    id: String(c.id),
    _apiId: c.id,
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || '',
    phone: c.phone,
    email: c.email,
    address: c.address,
    notes: c.notes,
    totalOrders: 0,
    totalSpent: 0,
    lastOrder: null,
    active: c.status === 'ACTIVE',
  };
}

export default function ClientsPage() {
  const [clients, setClients] = useState<UIClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState<UIClient | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listCustomers({ search: searchDebounced || undefined, limit: 100 });
      setClients(res.items.map(apiToUi));
    } catch {
      // mantener estado anterior
    } finally {
      setLoading(false);
    }
  }, [searchDebounced]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const handleSave = async (data: { firstName: string; lastName: string; phone?: string; email?: string; address?: string; notes?: string }) => {
    const name = `${data.firstName} ${data.lastName}`.trim();
    if (selectedClient) {
      await updateCustomer(selectedClient._apiId, { name, phone: data.phone, email: data.email, address: data.address, notes: data.notes });
    } else {
      await createCustomer({ name, phone: data.phone, email: data.email, address: data.address, notes: data.notes });
    }
    setShowForm(false);
    setSelectedClient(null);
    fetchClients();
  };

  const handleDelete = async (client: UIClient) => {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return;
    await deleteCustomer(client._apiId);
    fetchClients();
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Clientes</h1>
            <p className="text-sm text-gray-600 mt-1">Gestión de clientes y contactos</p>
          </div>
          <button
            onClick={() => { setSelectedClient(null); setShowForm(true); }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-lg hover:shadow-lg transition-all cursor-pointer whitespace-nowrap font-medium"
          >
            <i className="ri-user-add-line text-lg"></i>
            <span>Nuevo Cliente</span>
          </button>
        </div>
        <div className="relative">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
          <input
            type="text"
            placeholder="Buscar por dirección, nombre, teléfono o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <i className="ri-loader-4-line animate-spin text-3xl text-brand-500"></i>
        </div>
      ) : (
        <>
          {/* Vista de tabla en desktop */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Dirección</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Contacto</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Nombre</th>
                    <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {clients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-r from-brand-500 to-brand-600 rounded-full text-white font-bold shrink-0">
                            {(client.firstName || '?').charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{client.address || <span className="text-gray-400 italic">Sin dirección</span>}</p>
                            <p className="text-xs text-gray-500">ID: {client.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-800">{client.phone}</p>
                        {client.email && <p className="text-xs text-gray-500">{client.email}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">{client.firstName} {client.lastName}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => { setSelectedClient(client); setShowDetail(true); }} className="w-8 h-8 flex items-center justify-center text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"><i className="ri-eye-line text-lg"></i></button>
                          <button onClick={() => { setSelectedClient(client); setShowForm(true); }} className="w-8 h-8 flex items-center justify-center text-brand-600 hover:bg-brand-50 rounded-lg transition-colors cursor-pointer"><i className="ri-edit-line text-lg"></i></button>
                          <button onClick={() => handleDelete(client)} className="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"><i className="ri-delete-bin-line text-lg"></i></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Vista de tarjetas en mobile */}
          <div className="md:hidden space-y-3">
            {clients.map((client) => (
              <div key={client.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-r from-brand-500 to-brand-600 rounded-full text-white font-bold text-lg shrink-0">
                    {(client.firstName || '?').charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <i className="ri-map-pin-line text-sm text-brand-400 shrink-0"></i>
                      <h3 className="font-bold text-gray-800 truncate">{client.address || <span className="text-gray-400 italic font-normal">Sin dirección</span>}</h3>
                    </div>
                    <p className="text-xs text-gray-500 mb-1">{client.firstName} {client.lastName}</p>
                    <div className="flex items-center gap-2"><i className="ri-phone-line text-sm text-gray-400"></i><p className="text-sm text-gray-600">{client.phone}</p></div>
                    {client.email && <div className="flex items-center gap-2 mt-0.5"><i className="ri-mail-line text-sm text-gray-400"></i><p className="text-xs text-gray-500 truncate">{client.email}</p></div>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setSelectedClient(client); setShowDetail(true); }} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 transition-colors cursor-pointer text-sm font-medium"><i className="ri-eye-line"></i><span>Ver</span></button>
                  <button onClick={() => { setSelectedClient(client); setShowForm(true); }} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-brand-50 text-brand-600 rounded-lg hover:bg-brand-100 transition-colors cursor-pointer text-sm font-medium"><i className="ri-edit-line"></i><span>Editar</span></button>
                  <button onClick={() => handleDelete(client)} className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors cursor-pointer shrink-0"><i className="ri-delete-bin-line text-lg"></i></button>
                </div>
              </div>
            ))}
          </div>

          {clients.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <i className="ri-user-search-line text-6xl text-gray-300 mb-4"></i>
              <p className="text-gray-600">No se encontraron clientes</p>
            </div>
          )}
        </>
      )}

      {showForm && (
        <ClientForm
          client={selectedClient}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setSelectedClient(null); }}
        />
      )}

      {showDetail && selectedClient && (
        <ClientDetailModal
          client={selectedClient}
          onClose={() => { setShowDetail(false); setSelectedClient(null); }}
        />
      )}
    </AppLayout>
  );
}
