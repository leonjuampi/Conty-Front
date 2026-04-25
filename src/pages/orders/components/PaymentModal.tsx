import { useMemo, useState } from 'react';
import type { PosProduct } from './ProductSelector';

type SimpleMethodKey = 'efectivo' | 'tarjeta' | 'transferencia' | 'mercadopago';

export interface PaymentLine {
  method: string;
  amount: number;
  note?: string;
}

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
  onClose: () => void;
  onComplete: (data: {
    payments: PaymentLine[];
    notes: string;
    deliveryPlatform: string | null;
    pendingPayment: boolean;
  }) => Promise<void>;
}

const PAYMENT_METHOD_MAP: Record<SimpleMethodKey, string> = {
  efectivo: 'CASH',
  tarjeta: 'CREDIT_CARD',
  transferencia: 'BANK_TRANSFER',
  mercadopago: 'MERCADO_PAGO',
};

const SIMPLE_METHODS: Array<{ key: SimpleMethodKey; label: string; icon: string; selected: string }> = [
  { key: 'efectivo',      label: 'Efectivo',      icon: 'ri-money-dollar-circle-line', selected: 'border-green-600 bg-green-50 text-green-700' },
  { key: 'tarjeta',       label: 'Tarjeta',       icon: 'ri-bank-card-line',           selected: 'border-orange-600 bg-orange-50 text-orange-700' },
  { key: 'transferencia', label: 'Transferencia', icon: 'ri-exchange-line',            selected: 'border-teal-600 bg-teal-50 text-teal-700' },
  { key: 'mercadopago',   label: 'Mercado Pago',  icon: 'ri-smartphone-line',          selected: 'border-sky-600 bg-sky-50 text-sky-700' },
];

const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'Efectivo',
  CREDIT_CARD: 'Tarjeta',
  BANK_TRANSFER: 'Transferencia',
  MERCADO_PAGO: 'Mercado Pago',
};

const roundMoney = (n: number) => Math.round(n * 100) / 100;

export function PaymentModal({ total, orderItems, products, client, receiptNumber, onClose, onComplete }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<SimpleMethodKey | 'al_retirar'>('efectivo');
  const [multiMode, setMultiMode] = useState(false);
  const [orderType, setOrderType] = useState<'particular' | 'aplicacion'>('particular');
  const [appPlatform, setAppPlatform] = useState<'pedidosya' | 'rappi'>('pedidosya');
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Multipago
  const [multiPayments, setMultiPayments] = useState<PaymentLine[]>([]);
  const [multiDraftMethod, setMultiDraftMethod] = useState<SimpleMethodKey>('efectivo');
  const [multiDraftAmount, setMultiDraftAmount] = useState<string>('');

  const clientName = client
    ? (client.firstName || client.lastName ? `${client.firstName} ${client.lastName}`.trim() : 'Cliente General')
    : 'Cliente General';

  const change = amountPaid ? parseFloat(amountPaid) - total : 0;

  const totalPaid = useMemo(
    () => roundMoney(multiPayments.reduce((s, p) => s + p.amount, 0)),
    [multiPayments]
  );
  const remaining = roundMoney(total - totalPaid);

  const pendingSelected = paymentMethod === 'al_retirar';
  // El toggle de múltiple no aplica cuando el pago es "al retirar"
  const isMulti = multiMode && !pendingSelected;

  const addMultiPayment = () => {
    const amt = parseFloat(multiDraftAmount);
    if (!amt || amt <= 0) {
      setError('Ingresá un monto válido para el pago');
      return;
    }
    if (amt - remaining > 0.009) {
      setError(`El monto excede lo que resta por cobrar ($${remaining.toFixed(2)})`);
      return;
    }
    setError('');
    const apiMethod = PAYMENT_METHOD_MAP[multiDraftMethod];
    setMultiPayments([...multiPayments, { method: apiMethod, amount: roundMoney(amt) }]);
    setMultiDraftAmount('');
  };

  const removeMultiPayment = (idx: number) => {
    setMultiPayments(multiPayments.filter((_, i) => i !== idx));
  };

  const fillHalf = () => {
    const half = roundMoney(total / 2);
    setMultiDraftAmount(String(Math.min(half, remaining)));
  };

  const fillRemaining = () => {
    if (remaining > 0) setMultiDraftAmount(String(remaining));
  };

  const handleConfirmPayment = async () => {
    let payments: PaymentLine[] = [];

    if (pendingSelected) {
      payments = [];
    } else if (isMulti) {
      if (multiPayments.length === 0) {
        setError('Agregá al menos un pago');
        return;
      }
      if (Math.abs(totalPaid - total) > 0.009) {
        setError(`La suma de los pagos ($${totalPaid.toFixed(2)}) debe coincidir con el total ($${total.toFixed(2)})`);
        return;
      }
      payments = multiPayments.map(p => ({
        ...p,
        note: notes || undefined,
      }));
    } else {
      if (paymentMethod === 'efectivo' && (!amountPaid || parseFloat(amountPaid) < total)) {
        setError('El monto pagado debe ser mayor o igual al total');
        return;
      }
      const apiMethod = PAYMENT_METHOD_MAP[paymentMethod as SimpleMethodKey] || (paymentMethod as string).toUpperCase();
      payments = [{ method: apiMethod, amount: total, note: notes || undefined }];
    }

    setError('');
    setLoading(true);
    try {
      await onComplete({
        payments,
        notes,
        deliveryPlatform: orderType === 'aplicacion' ? appPlatform.toUpperCase() : null,
        pendingPayment: pendingSelected,
      });
      setShowReceipt(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '';
      if (msg.includes('INSUFFICIENT_STOCK')) {
        const varIdMatch = msg.match(/Variante ID (\d+)/);
        const varId = varIdMatch ? parseInt(varIdMatch[1]) : null;
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

  const renderPaymentSummaryLines = () => {
    if (pendingSelected) {
      return [{ label: 'PAGO PENDIENTE', amount: null as number | null }];
    }
    if (isMulti) {
      return multiPayments.map(p => ({
        label: PAYMENT_LABELS[p.method] ?? p.method,
        amount: p.amount,
      }));
    }
    const label = paymentMethod === 'mercadopago' ? 'Mercado Pago'
      : paymentMethod === 'efectivo' ? 'Efectivo'
      : paymentMethod === 'tarjeta' ? 'Tarjeta'
      : 'Transferencia';
    return [{ label, amount: total }];
  };

  const handlePrintAndFinish = () => {
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

    const summary = renderPaymentSummaryLines();
    const paymentsBlock = summary.map(line =>
      line.amount == null
        ? `<div style="display:flex;justify-content:space-between"><span>Pago:</span><span>${line.label}</span></div>`
        : `<div style="display:flex;justify-content:space-between"><span>${line.label}:</span><span>$${line.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span></div>`
    ).join('');

    const cashBlock = !isMulti && paymentMethod === 'efectivo' && amountPaid
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
    margin: 3mm 3mm;
  }
  * { box-sizing: border-box; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 13pt;
    font-weight: normal;
    width: 74mm;
    margin: 0;
    color: #000;
  }
  .center { text-align: center; }
  .bold   { font-weight: bold; }
  .sep    { border: none; border-top: 1px dashed #000; margin: 7px 0; }
  table   { width: 100%; border-collapse: collapse; }
  td      { vertical-align: top; font-size: 12pt; padding: 4px 0; }
  .total-row { font-size: 16pt; font-weight: bold; }
</style>
</head>
<body>
  <div class="center bold" style="font-size:18pt;letter-spacing:1px">COMANDA</div>
  <div class="center" style="font-size:12pt">${receiptNumber}</div>
  <div class="center" style="font-size:12pt">${new Date().toLocaleString('es-AR')}</div>
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
  ${paymentsBlock}
  ${cashBlock}
  <hr class="sep"/>
  <div class="center" style="margin-top:6px;font-size:12pt">¡Gracias por su compra!</div>
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
    const summary = renderPaymentSummaryLines();
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
              <div className="pt-2 border-t border-gray-200 space-y-1">
                {pendingSelected ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Método de pago:</span>
                    <span className="font-semibold text-amber-600 flex items-center gap-1">
                      <i className="ri-time-line text-xs"></i>Pago pendiente
                    </span>
                  </div>
                ) : (
                  summary.map((line, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-600">{line.label}:</span>
                      <span className="font-semibold text-gray-800">${(line.amount ?? 0).toFixed(2)}</span>
                    </div>
                  ))
                )}
              </div>
              {!isMulti && paymentMethod === 'efectivo' && amountPaid && (
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

          <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-3 print:hidden">
            <button onClick={handlePrintAndFinish} className="flex-1 bg-brand-600 text-white font-bold py-3 rounded-lg hover:bg-brand-700 cursor-pointer flex items-center justify-center gap-2">
              <i className="ri-printer-line"></i>Imprimir y Finalizar
            </button>
            <button onClick={onClose} className="px-6 bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-300 cursor-pointer">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-white w-full h-full md:h-auto md:rounded-xl shadow-2xl md:w-[820px] md:max-h-[90vh] overflow-y-auto flex flex-col safe-top">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-brand-600 to-brand-700 text-white md:rounded-t-xl">
          <div>
            <h2 className="text-xl font-bold leading-tight">Finalizar Pedido</h2>
            <p className="text-brand-100 text-sm mt-0.5">Total: ${total.toFixed(2)}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full cursor-pointer">
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-red-600 text-white px-6 py-3 shadow-md">
            <i className="ri-error-warning-line text-xl shrink-0"></i>
            <p className="font-semibold text-sm">{error}</p>
            <button onClick={() => setError('')} className="ml-auto shrink-0 opacity-70 hover:opacity-100 cursor-pointer">
              <i className="ri-close-line text-lg"></i>
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Columna izquierda: Tipo + Método de pago */}
            <div className="space-y-4">
              {/* Tipo de pedido */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Pedido</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setOrderType('particular')} className={`p-2.5 rounded-lg border-2 cursor-pointer flex items-center justify-center gap-2 ${orderType === 'particular' ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 bg-white text-gray-600'}`}>
                    <i className="ri-user-line text-lg"></i><p className="font-semibold text-sm">Particular</p>
                  </button>
                  <button onClick={() => setOrderType('aplicacion')} className={`p-2.5 rounded-lg border-2 cursor-pointer flex items-center justify-center gap-2 ${orderType === 'aplicacion' ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 bg-white text-gray-600'}`}>
                    <i className="ri-smartphone-line text-lg"></i><p className="font-semibold text-sm">Aplicación</p>
                  </button>
                </div>
                {orderType === 'aplicacion' && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button onClick={() => setAppPlatform('pedidosya')} className={`p-2.5 rounded-lg border-2 cursor-pointer flex items-center gap-2 ${appPlatform === 'pedidosya' ? 'border-yellow-500 bg-yellow-50 text-yellow-700' : 'border-gray-200 bg-white text-gray-600'}`}>
                      <div className="w-7 h-7 flex items-center justify-center bg-yellow-400 rounded-full flex-shrink-0"><i className="ri-motorbike-line text-white text-xs"></i></div>
                      <span className="font-semibold text-sm">Pedidos Ya</span>
                    </button>
                    <button onClick={() => setAppPlatform('rappi')} className={`p-2.5 rounded-lg border-2 cursor-pointer flex items-center gap-2 ${appPlatform === 'rappi' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 bg-white text-gray-600'}`}>
                      <div className="w-7 h-7 flex items-center justify-center bg-red-500 rounded-full flex-shrink-0"><i className="ri-bike-line text-white text-xs"></i></div>
                      <span className="font-semibold text-sm">Rappi</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Método de pago (modo simple) */}
              {!isMulti && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Método de Pago</label>
                  <div className="grid grid-cols-4 gap-2">
                    {SIMPLE_METHODS.map(m => (
                      <button key={m.key} onClick={() => setPaymentMethod(m.key)}
                        className={`p-2.5 rounded-lg border-2 cursor-pointer transition-all flex flex-col items-center ${paymentMethod === m.key ? m.selected : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
                        <i className={`${m.icon} text-lg mb-0.5`}></i>
                        <p className="font-semibold text-[11px] leading-tight text-center">{m.label}</p>
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setPaymentMethod('al_retirar')}
                    className={`mt-2 w-full p-2.5 rounded-lg border-2 cursor-pointer transition-all flex flex-col items-center justify-center ${paymentMethod === 'al_retirar' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
                    <div className="flex items-center gap-2">
                      <i className="ri-time-line text-lg"></i>
                      <span className="font-semibold text-sm">Pago al retirar</span>
                    </div>
                    <p className="text-[11px] opacity-70 leading-tight mt-0.5">Registrá el pago cuando venga a buscar el pedido</p>
                  </button>
                </div>
              )}

              {/* Toggle multipago (solo visible si no eligió "al retirar") */}
              {!pendingSelected && (
                <button
                  type="button"
                  onClick={() => {
                    if (multiMode) {
                      setMultiMode(false);
                      setMultiPayments([]);
                      setMultiDraftAmount('');
                      setError('');
                    } else {
                      setMultiMode(true);
                      setAmountPaid('');
                      setError('');
                    }
                  }}
                  className={`w-full p-2.5 rounded-lg border-2 cursor-pointer flex flex-col items-center justify-center transition-all ${isMulti ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-dashed border-gray-300 bg-white text-gray-600 hover:border-gray-400'}`}
                >
                  <div className="flex items-center gap-2">
                    <i className={isMulti ? 'ri-check-line text-lg' : 'ri-add-line text-lg'}></i>
                    <span className="font-semibold text-sm">
                      {isMulti ? 'Usando múltiples medios de pago' : 'Usar múltiples medios de pago'}
                    </span>
                  </div>
                  <p className="text-[11px] opacity-70 leading-tight mt-0.5">Combiná efectivo, tarjeta y otros medios</p>
                </button>
              )}
            </div>

            {/* Columna derecha */}
            <div className="space-y-4">
              {/* Modo simple: input de monto pagado (solo efectivo) */}
              {!isMulti && paymentMethod === 'efectivo' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Monto Pagado</label>
                  <input type="number" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)}
                    placeholder="Ingresá el monto recibido"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500" step="0.01" min={total} />
                  {amountPaid && parseFloat(amountPaid) >= total && (
                    <div className="mt-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-700"><span className="font-semibold">Vuelto:</span> ${change.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Modo múltiple: UI de carga de pagos */}
              {isMulti && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Agregar pago</label>
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      {SIMPLE_METHODS.map(m => (
                        <button
                          key={m.key}
                          onClick={() => setMultiDraftMethod(m.key)}
                          className={`p-2 rounded-lg border-2 cursor-pointer flex flex-col items-center transition-all ${multiDraftMethod === m.key ? m.selected : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}
                        >
                          <i className={`${m.icon} text-base`}></i>
                          <span className="text-[10px] font-semibold mt-0.5 leading-tight text-center">{m.label}</span>
                        </button>
                      ))}
                    </div>
                    <div className="flex items-stretch gap-2">
                      <div className="flex items-center flex-1 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-brand-400 overflow-hidden">
                        <span className="px-2.5 py-2 bg-gray-50 border-r border-gray-300 text-sm font-semibold text-gray-500">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={multiDraftAmount}
                          onChange={e => setMultiDraftAmount(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addMultiPayment(); } }}
                          placeholder="Monto"
                          className="flex-1 px-2 py-2 text-sm outline-none min-w-0"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={fillHalf}
                        disabled={remaining <= 0}
                        className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-xs font-semibold hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >Mitad</button>
                      <button
                        type="button"
                        onClick={fillRemaining}
                        disabled={remaining <= 0}
                        className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-xs font-semibold hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >Restante</button>
                    </div>
                    <button
                      type="button"
                      onClick={addMultiPayment}
                      disabled={remaining <= 0}
                      className="mt-2 w-full py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <i className="ri-add-line"></i>Agregar pago
                    </button>
                  </div>

                  {/* Lista de pagos cargados */}
                  {multiPayments.length > 0 && (
                    <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                      {multiPayments.map((p, idx) => (
                        <div key={idx} className="flex items-center justify-between px-3 py-2 text-sm">
                          <span className="font-semibold text-gray-700">{PAYMENT_LABELS[p.method] ?? p.method}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-800">${p.amount.toFixed(2)}</span>
                            <button
                              onClick={() => removeMultiPayment(idx)}
                              className="w-7 h-7 flex items-center justify-center rounded-md text-red-500 hover:bg-red-50 cursor-pointer"
                              title="Quitar"
                            >
                              <i className="ri-delete-bin-line"></i>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Totales multipago */}
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm space-y-1">
                    <div className="flex justify-between"><span className="text-gray-600">Total:</span><span className="font-semibold text-gray-800">${total.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Pagado:</span><span className="font-semibold text-gray-800">${totalPaid.toFixed(2)}</span></div>
                    <div className="flex justify-between pt-1 border-t border-gray-200">
                      <span className={`font-semibold ${remaining > 0.009 ? 'text-amber-600' : 'text-green-600'}`}>
                        {remaining > 0.009 ? 'Resta:' : 'Completo:'}
                      </span>
                      <span className={`font-bold ${remaining > 0.009 ? 'text-amber-600' : 'text-green-600'}`}>
                        ${remaining.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notas <span className="text-gray-400 font-normal">(opcional)</span></label>
                <textarea value={notes} onChange={(e) => { if (e.target.value.length <= 300) setNotes(e.target.value); }}
                  placeholder="Ej: sin cebolla, entregar en puerta..."
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 resize-none" rows={2} maxLength={300} />
                <p className="text-xs text-gray-500 mt-1 text-right">{notes.length}/300</p>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-gray-600 text-sm">Cliente:</span>
                  <span className="font-semibold text-gray-800 text-sm">{clientName}</span>
                </div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-gray-600 text-sm">Productos:</span>
                  <span className="font-semibold text-gray-800 text-sm">{orderItems.length} items</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                  <span className="text-gray-800 font-bold">Total:</span>
                  <span className="text-brand-600 font-bold text-xl">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-3 md:rounded-b-xl">
          <button onClick={onClose} className="flex-1 bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-lg hover:bg-gray-300 cursor-pointer min-h-[44px]">
            Cancelar
          </button>
          <button onClick={handleConfirmPayment} disabled={loading}
            className="flex-1 bg-gradient-to-r from-brand-600 to-brand-700 text-white font-bold py-2.5 rounded-lg hover:from-brand-700 hover:to-brand-700 cursor-pointer min-h-[44px] disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <><i className="ri-loader-4-line animate-spin"></i>Procesando...</> : pendingSelected ? 'Confirmar pedido' : 'Confirmar Pago'}
          </button>
        </div>
      </div>
    </div>
  );
}
