import { useState, useEffect } from 'react';
import { listCustomers, createCustomer } from '../../../services/customers.service';

export interface OrderClient {
  id: number | null;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
}

interface ClientSelectorProps {
  selectedClient: OrderClient | null;
  onSelectClient: (client: OrderClient | null) => void;
}

export function ClientSelector({ selectedClient, onSelectClient }: ClientSelectorProps) {
  const [showModal, setShowModal] = useState(false);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<OrderClient[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [newClient, setNewClient] = useState({ firstName: '', lastName: '', phone: '', address: '' });
  const [savingClient, setSavingClient] = useState(false);

  useEffect(() => {
    if (!showModal) return;
    setLoadingClients(true);
    listCustomers({ search: searchTerm || undefined, limit: 50 })
      .then(res => {
        setClients(res.items.map(c => {
          const parts = (c.name || '').split(' ');
          return {
            id: c.id,
            firstName: parts[0] || '',
            lastName: parts.slice(1).join(' ') || '',
            phone: c.phone || '',
            address: c.address || '',
          };
        }));
      })
      .catch(() => {})
      .finally(() => setLoadingClients(false));
  }, [showModal, searchTerm]);

  const handleCreateClient = async () => {
    if (!newClient.address) {
      alert('La dirección es obligatoria');
      return;
    }
    setSavingClient(true);
    try {
      const name = `${newClient.firstName} ${newClient.lastName}`.trim();
      const res = await createCustomer({ name, phone: newClient.phone, address: newClient.address });
      const client: OrderClient = { id: res.id, ...newClient };
      onSelectClient(client);
      setShowNewClientForm(false);
      setShowModal(false);
      setNewClient({ firstName: '', lastName: '', phone: '', address: '' });
    } catch {
      alert('Error al crear el cliente');
    } finally {
      setSavingClient(false);
    }
  };

  return (
    <>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Cliente</label>
        {selectedClient ? (
          <div className="bg-brand-50 border border-brand-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold text-gray-800">
                  <i className="ri-map-pin-line mr-1 text-brand-500"></i>
                  {selectedClient.address}
                </p>
                {(selectedClient.firstName || selectedClient.lastName) && (
                  <p className="text-sm text-gray-600 mt-1">
                    <i className="ri-user-line mr-1"></i>
                    {selectedClient.firstName} {selectedClient.lastName}
                  </p>
                )}
                {selectedClient.phone && (
                  <p className="text-sm text-gray-600 mt-1">
                    <i className="ri-phone-line mr-1"></i>
                    {selectedClient.phone}
                  </p>
                )}
              </div>
              <button onClick={() => onSelectClient(null)} className="text-red-500 hover:text-red-700 cursor-pointer w-8 h-8 flex items-center justify-center">
                <i className="ri-close-line text-lg"></i>
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowModal(true)}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-brand-400 hover:bg-brand-50 transition-all cursor-pointer"
          >
            <i className="ri-user-add-line text-2xl text-gray-400 mb-2"></i>
            <p className="text-sm text-gray-600 font-medium">Seleccionar Cliente</p>
          </button>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-brand-500 to-brand-600 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Seleccionar Cliente</h2>
              <button onClick={() => { setShowModal(false); setShowNewClientForm(false); setSearchTerm(''); }} className="text-white cursor-pointer">
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {!showNewClientForm ? (
                <>
                  <div className="mb-4">
                    <div className="relative">
                      <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                      <input
                        type="text"
                        placeholder="Buscar por nombre, teléfono o dirección..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>

                  <button onClick={() => setShowNewClientForm(true)} className="w-full mb-4 bg-brand-500 text-white py-3 rounded-lg font-semibold hover:bg-brand-600 transition-all cursor-pointer">
                    <i className="ri-user-add-line mr-2"></i>Nuevo Cliente
                  </button>

                  {loadingClients ? (
                    <div className="flex justify-center py-8"><i className="ri-loader-4-line animate-spin text-2xl text-brand-500"></i></div>
                  ) : (
                    <div className="space-y-2">
                      {clients.map(client => (
                        <button key={client.id} onClick={() => { onSelectClient(client); setShowModal(false); }} className="w-full text-left bg-gray-50 hover:bg-brand-50 border border-gray-200 hover:border-brand-400 rounded-lg p-4 transition-all cursor-pointer">
                          <p className="font-semibold text-gray-800 mb-1">
                            <i className="ri-map-pin-line mr-1 text-brand-500"></i>
                            {client.address}
                          </p>
                          {(client.firstName || client.lastName) && <p className="text-sm text-gray-500"><i className="ri-user-line mr-1"></i>{client.firstName} {client.lastName}</p>}
                          {client.phone && <p className="text-sm text-gray-500 mt-0.5"><i className="ri-phone-line mr-1"></i>{client.phone}</p>}
                        </button>
                      ))}
                      {clients.length === 0 && <p className="text-center text-gray-500 py-4">No se encontraron clientes</p>}
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <button onClick={() => setShowNewClientForm(false)} className="mb-4 text-brand-600 hover:text-brand-700 font-medium text-sm cursor-pointer">
                    <i className="ri-arrow-left-line mr-1"></i>Volver
                  </button>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dirección <span className="text-red-500">*</span></label>
                      <textarea value={newClient.address} onChange={(e) => setNewClient({ ...newClient, address: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 text-sm" rows={3} placeholder="Ingrese la dirección completa" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                      <input type="text" value={newClient.firstName} onChange={(e) => setNewClient({ ...newClient, firstName: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 text-sm" placeholder="Nombre" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                      <input type="text" value={newClient.lastName} onChange={(e) => setNewClient({ ...newClient, lastName: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 text-sm" placeholder="Apellido" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                      <input type="tel" value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 text-sm" placeholder="11-1234-5678" />
                    </div>
                    <button onClick={handleCreateClient} disabled={savingClient} className="w-full bg-brand-500 text-white py-3 rounded-lg font-semibold hover:bg-brand-600 transition-all cursor-pointer disabled:opacity-60">
                      {savingClient ? <><i className="ri-loader-4-line animate-spin mr-2"></i>Guardando...</> : <><i className="ri-save-line mr-2"></i>Guardar Cliente</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
