
import { useState, useEffect } from 'react';
import { getSalesByCustomer, type CustomerSale } from '../../../services/customers.service';

interface Client {
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

interface ClientDetailModalProps {
  client: Client;
  onClose: () => void;
  onEdit?: () => void;
}

export function ClientDetailModal({ client, onClose, onEdit }: ClientDetailModalProps) {
  const [sales, setSales] = useState<CustomerSale[]>([]);
  const [loadingSales, setLoadingSales] = useState(true);

  useEffect(() => {
    getSalesByCustomer(client._apiId)
      .then(res => setSales(res.items))
      .catch(() => setSales([]))
      .finally(() => setLoadingSales(false));
  }, [client._apiId]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-white w-full h-full md:h-auto md:rounded-2xl shadow-2xl md:max-w-2xl md:max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header fijo */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-100 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center bg-gradient-to-br from-orange-400 to-red-500 rounded-xl md:rounded-2xl shadow-md">
              <span className="text-white text-lg md:text-xl font-bold">
                {client.firstName[0]}{client.lastName[0]}
              </span>
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-800">{client.firstName} {client.lastName}</h2>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${client.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {client.active ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
            <button
              onClick={onEdit}
              className="w-10 h-10 flex items-center justify-center text-orange-500 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
              title="Editar"
            >
              <i className="ri-edit-line text-lg"></i>
            </button>
            )}
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <div className="bg-orange-50 rounded-xl p-3 md:p-4">
              <p className="text-xs text-gray-500 mb-1 font-medium">Teléfono</p>
              <div className="flex items-center gap-2">
                <i className="ri-phone-line text-orange-500"></i>
                <span className="text-sm font-semibold text-gray-800">{client.phone || '—'}</span>
              </div>
            </div>
            <div className="bg-orange-50 rounded-xl p-3 md:p-4">
              <p className="text-xs text-gray-500 mb-1 font-medium">Email</p>
              <div className="flex items-center gap-2">
                <i className="ri-mail-line text-orange-500"></i>
                <span className="text-sm font-semibold text-gray-800 truncate">{client.email || '—'}</span>
              </div>
            </div>
            <div className="bg-orange-50 rounded-xl p-3 md:p-4 sm:col-span-2">
              <p className="text-xs text-gray-500 mb-1 font-medium">Dirección</p>
              <div className="flex items-center gap-2">
                <i className="ri-map-pin-line text-orange-500"></i>
                <span className="text-sm font-semibold text-gray-800">{client.address || '—'}</span>
              </div>
            </div>
            {client.notes && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 md:p-4 sm:col-span-2">
                <p className="text-xs text-yellow-700 mb-1 font-medium flex items-center gap-1">
                  <i className="ri-sticky-note-line"></i> Notas
                </p>
                <p className="text-sm text-gray-700">{client.notes}</p>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-3 md:p-4 text-white text-center">
              <p className="text-xl md:text-2xl font-bold">{sales.length}</p>
              <p className="text-xs opacity-80 mt-1">Pedidos totales</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-3 md:p-4 text-white text-center">
              <p className="text-lg md:text-2xl font-bold">
                ${sales.reduce((s, o) => s + Number(o.total_amount), 0).toLocaleString('es-AR')}
              </p>
              <p className="text-xs opacity-80 mt-1">Total gastado</p>
            </div>
            <div className="bg-gradient-to-br from-gray-600 to-gray-800 rounded-xl p-3 md:p-4 text-white text-center">
              <p className="text-xs md:text-sm font-bold">
                {client.lastOrder ? formatDate(client.lastOrder) : (sales[0] ? formatDate(sales[0].created_at) : '—')}
              </p>
              <p className="text-xs opacity-80 mt-1">Último pedido</p>
            </div>
          </div>

          {/* Historial */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <i className="ri-history-line text-orange-500"></i>
              Historial de Pedidos
            </h3>
            {loadingSales ? (
              <div className="flex justify-center py-8">
                <i className="ri-loader-4-line animate-spin text-2xl text-orange-500"></i>
              </div>
            ) : sales.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <i className="ri-inbox-line text-4xl mb-2 block"></i>
                <p className="text-sm">Sin pedidos registrados</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sales.map(sale => (
                  <div key={sale.id} className="border border-gray-200 rounded-xl p-3 md:p-4 hover:border-orange-200 hover:bg-orange-50/30 transition-all">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-800">{sale.doc_number || `#${sale.id}`}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                          {sale.status}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-orange-600">
                        ${Number(sale.total_amount).toLocaleString('es-AR')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {formatDate(sale.created_at)} {formatTime(sale.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
