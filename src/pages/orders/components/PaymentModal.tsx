import { useState } from 'react';
import type { PosProduct } from './ProductSelector';
import { downloadInvoicePdf } from '../../../services/arca.service';

interface PaymentModalProps {
  total: number;
  orderItems: Array<{
    productId: string;
    variantId: number;
    productName: string;
    quantity: number;
    price: number;
  }>;
  products: PosProduct[];
  client: { firstName: string; lastName: string; phone?: string; address?: string } | null;
  receiptNumber: string;
  saleId?: number | null;
  onClose: () => void;
  onComplete: (data: { paymentMethod: string; amountPaid: number; notes: string; deliveryPlatform: string | null; pendingPayment: boolean; docType: string }) => Promise<void>;
}

const PAYMENT_METHOD_MAP: Record<string, string> = {
  efectivo: 'CASH',
  tarjeta: 'CREDIT_CARD',
  transferencia: 'BANK_TRANSFER',
  mercadopago: 'MERCADO_PAGO',
};

export function PaymentModal({ total, orderItems, products, client, receiptNumber, saleId, onClose, onComplete }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'tarjeta' | 'transferencia' | 'mercadopago' | 'al_retirar'>('efectivo');
  const [docType, setDocType] = useState<string>('TICKET');
  const [orderType, setOrderType] = useState<'particular' | 'aplicacion'>('particular');
  const [appPlatform, setAppPlatform] = useState<'pedidosya' | 'rappi'>('pedidosya');
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const clientName = client
    ? (client.firstName || client.lastName ? `${client.firstName} ${client.lastName}`.trim() : 'Cliente General')
    : 'Cliente General';

  const change = amountPaid ? parseFloat(amountPaid) - total : 0;

  const handleConfirmPayment = async () => {
    if (paymentMethod === 'efectivo' && (!amountPaid || parseFloat(amountPaid) < total)) {
      setError('El monto pagado debe ser mayor o igual al total');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onComplete({
        paymentMethod: PAYMENT_METHOD_MAP[paymentMethod] || paymentMethod.toUpperCase(),
        amountPaid: parseFloat(amountPaid) || total,
        notes,
        deliveryPlatform: orderType === 'aplicacion' ? appPlatform.toUpperCase() : null,
        pendingPayment: paymentMethod === 'al_retirar',
        docType,
      });
      setShowReceipt(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '';
      if (msg.includes('INSUFFICIENT_STOCK')) {
        const varIdMatch = msg.match(/Variante ID (\d+)/);
        const varId = varIdMatch ? parseInt(varIdMatch[1]) : null;
        // Buscar primero en orderItems, luego en todos los productos (cubre componentes de combos)
        const fromOrder = orderItems.find(i => i.variantId === varId);
        const fromProducts = products.find(p => p.variantId === varId);
        const name = fromOrder?.productName ?? fromProducts?.name ?? `variante #${varId}`;
        const avail = msg.match(/tiene (\d+) unidades/)?.[1];
        const needed = msg.match(/se necesitan (\d+)/)?.[1];
        setError(`Stock insuficiente para "${name}". Disponible: ${avail ?? '?'}, solicitado: ${needed ?? '?'}`);
      } else {
        setError(msg || 'Error al procesar el pago');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePrintAndFinish = () => {
    const paymentLabel: Record<string, string> = {
      efectivo: 'Efectivo',
      tarjeta: 'Tarjeta',
      transferencia: 'Transferencia',
      mercadopago: 'Mercado Pago',
      al_retirar: 'PAGO PENDIENTE',
    };

    const rows = orderItems.map(item => `
      <tr>
        <td style="padding:2px 0;word-break:break-word">${item.productName}</td>
        <td style="padding:2px 4px;text-align:center">${item.quantity}</td>
        <td style="padding:2px 0;text-align:right">$${(item.price * item.quantity).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
      </tr>`).join('');

    const notesBlock = notes
      ? `<div style="margin:6px 0;border-top:1px dashed #000;padding-top:4px">
           <b>NOTAS:</b><br/>${notes}
         </div>`
      : '';

    const cashBlock = paymentMethod === 'efectivo' && amountPaid
      ? `<div style="display:flex;justify-content:space-between"><span>Pagó con:</span><span>$${parseFloat(amountPaid).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span></div>
         <div style="display:flex;justify-content:space-between"><span>Vuelto:</span><span>$${change.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span></div>`
      : '';

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  @page {
    size: 80mm auto;
    margin: 4mm 4mm;
  }
  * { box-sizing: border-box; }
  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 9pt;
    width: 72mm;
    margin: 0;
    color: #000;
  }
  .center { text-align: center; }
  .bold   { font-weight: bold; }
  .sep    { border: none; border-top: 1px dashed #000; margin: 5px 0; }
  table   { width: 100%; border-collapse: collapse; }
  td      { vertical-align: top; font-size: 8.5pt; }
  .total-row { font-size: 11pt; font-weight: bold; }
</style>
</head>
<body>
  <div class="center bold" style="font-size:13pt;letter-spacing:1px">COMANDA</div>
  <div class="center" style="font-size:8pt">${receiptNumber}</div>
  <div class="center" style="font-size:8pt">${new Date().toLocaleString('es-AR')}</div>
  <hr class="sep"/>

  <div><b>Cliente:</b> ${clientName}</div>
  ${client?.phone ? `<div><b>Tel:</b> ${client.phone}</div>` : ''}
  ${client?.address ? `<div><b>Dir:</b> ${client.address}</div>` : ''}
  <div><b>Tipo:</b> ${orderType === 'aplicacion' ? `Aplicación — ${appPlatform === 'pedidosya' ? 'Pedidos Ya' : 'Rappi'}` : 'Particular'}</div>
  <hr class="sep"/>

  <table>
    <thead>
      <tr>
        <td style="padding-bottom:3px"><b>Producto</b></td>
        <td style="text-align:center;padding-bottom:3px"><b>Cant</b></td>
        <td style="text-align:right;padding-bottom:3px"><b>Subtotal</b></td>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <hr class="sep"/>

  ${notesBlock}

  <div class="total-row" style="display:flex;justify-content:space-between;margin:4px 0">
    <span>TOTAL:</span>
    <span>$${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
  </div>
  <div style="display:flex;justify-content:space-between"><span>Pago:</span><span>${paymentLabel[paymentMethod] || paymentMethod}</span></div>
  ${cashBlock}
  <hr class="sep"/>
  <div class="center" style="margin-top:6px;font-size:8pt">¡Gracias por su compra!</div>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=300,height=600');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
    win.close();
    onClose();
  };

  if (showReceipt) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 md:p-0">
        <div className="bg-white rounded-xl shadow-2xl w-full md:w-[480px] max-h-[90vh] overflow-y-auto">
          <div className="p-8 print:p-4" id="receipt">
            <div className="text-center mb-6 border-b-2 border-dashed border-gray-300 pb-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-1">COMANDA</h2>
              <p className="text-sm text-gray-600 font-mono">{receiptNumber}</p>
              <p className="text-xs text-gray-500 mt-2">{new Date().toLocaleString('es-AR')}</p>
            </div>

            <div className="mb-4 pb-4 border-b border-gray-200">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Cliente</p>
              <p className="font-bold text-gray-800">{clientName}</p>
              {client?.phone && <p className="text-sm text-gray-600">{client.phone}</p>}
              {client?.address && <p className="text-sm text-gray-600">{client.address}</p>}
            </div>

            <div className="mb-4 pb-4 border-b border-gray-200">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Tipo de Pedido</p>
              <p className="font-bold text-gray-800 capitalize">
                {orderType === 'aplicacion'
                  ? `Aplicación — ${appPlatform === 'pedidosya' ? 'Pedidos Ya' : 'Rappi'}`
                  : 'Particular'}
              </p>
            </div>

            <div className="mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-2 text-xs text-gray-600 font-semibold">Producto</th>
                    <th className="text-center py-2 text-xs text-gray-600 font-semibold">Cant.</th>
                    <th className="text-right py-2 text-xs text-gray-600 font-semibold">Precio</th>
                    <th className="text-right py-2 text-xs text-gray-600 font-semibold">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-2 text-gray-800">{item.productName}</td>
                      <td className="text-center py-2 text-gray-700">{item.quantity}</td>
                      <td className="text-right py-2 text-gray-700">${item.price.toFixed(2)}</td>
                      <td className="text-right py-2 font-semibold text-gray-800">${(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {notes && (
              <div className="mb-4 p-3 bg-brand-50 border border-brand-200 rounded-lg">
                <p className="text-xs text-brand-700 uppercase font-semibold mb-1">Notas</p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{notes}</p>
              </div>
            )}

            <div className="border-t-2 border-gray-300 pt-4 space-y-2">
              <div className="flex justify-between text-lg font-bold">
                <span className="text-gray-800">TOTAL:</span>
                <span className="text-brand-600">${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                <span className="text-gray-600">Método de pago:</span>
                {paymentMethod === 'al_retirar' ? (
                  <span className="font-semibold text-amber-600 flex items-center gap-1"><i className="ri-time-line text-xs"></i>Pago pendiente</span>
                ) : (
                  <span className="font-semibold text-gray-800 capitalize">{paymentMethod === 'mercadopago' ? 'Mercado Pago' : paymentMethod}</span>
                )}
              </div>
              {paymentMethod === 'efectivo' && amountPaid && (
                <>
                  <div className="flex justify-between text-sm"><span className="text-gray-600">Pagó con:</span><span className="font-semibold text-gray-800">${parseFloat(amountPaid).toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-600">Vuelto:</span><span className="font-semibold text-green-600">${change.toFixed(2)}</span></div>
                </>
              )}
              <div className="flex justify-between text-xs pt-2 border-t border-gray-200">
                <span className="text-gray-500">Comprobante:</span>
                <span className="font-mono text-gray-700">{receiptNumber}</span>
              </div>
            </div>

            <div className="text-center mt-6 pt-4 border-t border-dashed border-gray-300">
              <p className="text-xs text-gray-500">¡Gracias por su compra!</p>
            </div>
          </div>

          <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col gap-2 print:hidden">
            <div className="flex gap-3">
              <button onClick={handlePrintAndFinish} className="flex-1 bg-brand-600 text-white font-bold py-3 rounded-lg hover:bg-brand-700 cursor-pointer flex items-center justify-center gap-2">
                <i className="ri-printer-line"></i>Imprimir y Finalizar
              </button>
              <button onClick={onClose} className="px-6 bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-300 cursor-pointer">
                Cerrar
              </button>
            </div>
            {saleId && docType !== 'TICKET' && (
              <button
                onClick={() => downloadInvoicePdf(saleId)}
                className="flex items-center justify-center gap-2 w-full py-2.5 border border-brand-300 text-brand-700 rounded-lg hover:bg-brand-50 text-sm font-medium transition-all cursor-pointer"
              >
                <i className="ri-file-pdf-line"></i>
                Descargar PDF del comprobante
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-white w-full h-full md:h-auto md:rounded-xl shadow-2xl md:w-[500px] md:max-h-[90vh] overflow-y-auto flex flex-col safe-top">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-brand-600 to-brand-700 text-white md:rounded-t-xl">
          <div>
            <h2 className="text-2xl font-bold">Finalizar Pedido</h2>
            <p className="text-brand-100 text-sm mt-1">Total: ${total.toFixed(2)}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full cursor-pointer">
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-red-600 text-white px-6 py-4 shadow-md">
            <i className="ri-error-warning-line text-xl shrink-0"></i>
            <p className="font-semibold text-sm">{error}</p>
            <button onClick={() => setError('')} className="ml-auto shrink-0 opacity-70 hover:opacity-100 cursor-pointer">
              <i className="ri-close-line text-lg"></i>
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Tipo de comprobante */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Tipo de Comprobante
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {([
                { value: 'TICKET', label: 'Ticket' },
                { value: 'INVOICE_A', label: 'Factura A' },
                { value: 'INVOICE_B', label: 'Factura B' },
                { value: 'INVOICE_C', label: 'Factura C' },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDocType(opt.value)}
                  className={`py-2.5 px-2 rounded-lg border-2 text-xs font-semibold cursor-pointer transition-all ${
                    docType === opt.value
                      ? 'border-brand-600 bg-brand-50 text-brand-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {docType !== 'TICKET' && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
                <i className="ri-information-line mr-1"></i>
                Se solicitará el CAE a ARCA automáticamente. Asegurate de tener configurado el punto de venta.
              </p>
            )}
          </div>

          {/* Tipo de pedido */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Tipo de Pedido</label>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setOrderType('particular')} className={`p-4 rounded-lg border-2 cursor-pointer ${orderType === 'particular' ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 bg-white text-gray-600'}`}>
                <i className="ri-user-line text-2xl mb-2"></i><p className="font-semibold text-sm">Particular</p>
              </button>
              <button onClick={() => setOrderType('aplicacion')} className={`p-4 rounded-lg border-2 cursor-pointer ${orderType === 'aplicacion' ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 bg-white text-gray-600'}`}>
                <i className="ri-smartphone-line text-2xl mb-2"></i><p className="font-semibold text-sm">Aplicación</p>
              </button>
            </div>
            {orderType === 'aplicacion' && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <button onClick={() => setAppPlatform('pedidosya')} className={`p-3 rounded-lg border-2 cursor-pointer flex items-center gap-3 ${appPlatform === 'pedidosya' ? 'border-yellow-500 bg-yellow-50 text-yellow-700' : 'border-gray-200 bg-white text-gray-600'}`}>
                  <div className="w-8 h-8 flex items-center justify-center bg-yellow-400 rounded-full flex-shrink-0"><i className="ri-motorbike-line text-white text-sm"></i></div>
                  <span className="font-semibold text-sm">Pedidos Ya</span>
                </button>
                <button onClick={() => setAppPlatform('rappi')} className={`p-3 rounded-lg border-2 cursor-pointer flex items-center gap-3 ${appPlatform === 'rappi' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 bg-white text-gray-600'}`}>
                  <div className="w-8 h-8 flex items-center justify-center bg-red-500 rounded-full flex-shrink-0"><i className="ri-bike-line text-white text-sm"></i></div>
                  <span className="font-semibold text-sm">Rappi</span>
                </button>
              </div>
            )}
          </div>

          {/* Método de pago */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Método de Pago</label>
            <div className="grid grid-cols-2 gap-3">
              {([
                { key: 'efectivo',      label: 'Efectivo',      icon: 'ri-money-dollar-circle-line', selected: 'border-green-600 bg-green-50 text-green-700' },
                { key: 'tarjeta',       label: 'Tarjeta',       icon: 'ri-bank-card-line',           selected: 'border-orange-600 bg-orange-50 text-orange-700' },
                { key: 'transferencia', label: 'Transferencia', icon: 'ri-exchange-line',            selected: 'border-teal-600 bg-teal-50 text-teal-700' },
                { key: 'mercadopago',   label: 'Mercado Pago',  icon: 'ri-smartphone-line',          selected: 'border-sky-600 bg-sky-50 text-sky-700' },
              ] as const).map(m => (
                <button key={m.key} onClick={() => setPaymentMethod(m.key)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all flex flex-col items-center ${paymentMethod === m.key ? m.selected : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
                  <i className={`${m.icon} text-2xl mb-2`}></i>
                  <p className="font-semibold text-xs">{m.label}</p>
                </button>
              ))}
              <button onClick={() => setPaymentMethod('al_retirar')}
                className={`col-span-2 p-3 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-center gap-3 ${paymentMethod === 'al_retirar' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
                <i className="ri-time-line text-xl"></i>
                <div className="text-left">
                  <p className="font-semibold text-sm">Pago al retirar</p>
                  <p className="text-xs opacity-70">Registrá el pago cuando venga a buscar el pedido</p>
                </div>
              </button>
            </div>
          </div>

          {paymentMethod === 'efectivo' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Monto Pagado</label>
              <input type="number" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)}
                placeholder="Ingresá el monto recibido"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 text-lg" step="0.01" min={total} />
              {amountPaid && parseFloat(amountPaid) >= total && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700"><span className="font-semibold">Vuelto:</span> ${change.toFixed(2)}</p>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Notas <span className="text-gray-400 font-normal">(opcional)</span></label>
            <textarea value={notes} onChange={(e) => { if (e.target.value.length <= 300) setNotes(e.target.value); }}
              placeholder="Ej: sin cebolla, entregar en puerta..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 resize-none" rows={3} maxLength={300} />
            <p className="text-xs text-gray-500 mt-1 text-right">{notes.length}/300</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600 text-sm">Cliente:</span>
              <span className="font-semibold text-gray-800">{clientName}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600 text-sm">Productos:</span>
              <span className="font-semibold text-gray-800">{orderItems.length} items</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-300">
              <span className="text-gray-800 font-bold">Total:</span>
              <span className="text-brand-600 font-bold text-xl">${total.toFixed(2)}</span>
            </div>
          </div>

        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-200 flex gap-3 md:rounded-b-xl">
          <button onClick={onClose} className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 md:py-4 rounded-lg hover:bg-gray-300 cursor-pointer min-h-[48px]">
            Cancelar
          </button>
          <button onClick={handleConfirmPayment} disabled={loading}
            className="flex-1 bg-gradient-to-r from-brand-600 to-brand-700 text-white font-bold py-3 md:py-4 rounded-lg hover:from-brand-700 hover:to-brand-700 cursor-pointer min-h-[48px] disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <><i className="ri-loader-4-line animate-spin"></i>Procesando...</> : paymentMethod === 'al_retirar' ? 'Confirmar pedido' : 'Confirmar Pago'}
          </button>
        </div>
      </div>
    </div>
  );
}
