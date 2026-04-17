import { Link, useLocation, useParams } from 'react-router-dom';
import { CheckCircle2, MessageCircle } from 'lucide-react';
import PublicStoreLayout from './PublicStoreLayout';
import type { StoreInfo } from '../../services/publicStore.service';

function moneyAR(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n);
}

function OrderConfirmedInner({ info }: { info: StoreInfo }) {
  const { slug = '' } = useParams<{ slug: string }>();
  const primary = info.settings?.primary_color || '#10b981';
  const state = (useLocation().state || {}) as { orderNumber?: string; total?: number; whatsappLink?: string };

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
        <CheckCircle2 className="h-16 w-16 mx-auto mb-4" style={{ color: primary }} />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Pedido recibido!</h1>
        <p className="text-gray-600 mb-4">
          Tu pedido fue registrado correctamente. El vendedor lo confirmará por WhatsApp.
        </p>

        {state.orderNumber && (
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Número de pedido</div>
            <div className="text-xl font-bold text-gray-900">{state.orderNumber}</div>
            {state.total !== undefined && (
              <div className="text-sm text-gray-600 mt-1">Total: <span className="font-semibold">{moneyAR(state.total)}</span></div>
            )}
          </div>
        )}

        {state.whatsappLink && (
          <a
            href={state.whatsappLink}
            target="_blank"
            rel="noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold mb-3"
            style={{ backgroundColor: primary }}
          >
            <MessageCircle className="h-5 w-5" />
            Abrir chat de WhatsApp
          </a>
        )}

        <Link
          to={`/s/${slug}`}
          className="inline-block w-full py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200"
        >
          Volver al catálogo
        </Link>
      </div>
    </div>
  );
}

export default function OrderConfirmed() {
  return <PublicStoreLayout>{(info) => <OrderConfirmedInner info={info} />}</PublicStoreLayout>;
}
