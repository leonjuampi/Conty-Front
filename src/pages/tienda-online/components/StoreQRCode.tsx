import { useEffect, useRef, useState } from 'react';
import { Download, QrCode } from 'lucide-react';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';

interface Props {
  slug: string | null;
  storeName: string;
}

export default function StoreQRCode({ slug, storeName }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pngDataUrl, setPngDataUrl] = useState<string | null>(null);
  const [svgString, setSvgString] = useState<string | null>(null);

  const url = slug ? `${window.location.origin}/s/${slug}` : '';

  useEffect(() => {
    if (!url) return;
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, { width: 240, margin: 2, color: { dark: '#111827', light: '#ffffff' } });
    }
    QRCode.toDataURL(url, { width: 1024, margin: 2, color: { dark: '#111827', light: '#ffffff' } })
      .then(setPngDataUrl).catch(() => {});
    QRCode.toString(url, { type: 'svg', margin: 2, color: { dark: '#111827', light: '#ffffff' } })
      .then(setSvgString).catch(() => {});
  }, [url]);

  function downloadPNG() {
    if (!pngDataUrl) return;
    const a = document.createElement('a');
    a.href = pngDataUrl;
    a.download = `qr-${slug}.png`;
    a.click();
  }

  function downloadSVG() {
    if (!svgString) return;
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const u = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = u;
    a.download = `qr-${slug}.svg`;
    a.click();
    URL.revokeObjectURL(u);
  }

  function downloadPDF() {
    if (!pngDataUrl) return;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    doc.setFontSize(22);
    doc.text(storeName || 'Mi tienda', pageW / 2, 30, { align: 'center' });
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text('Escaneá el QR para ver nuestro catálogo', pageW / 2, 40, { align: 'center' });
    const qrSize = 120;
    doc.addImage(pngDataUrl, 'PNG', (pageW - qrSize) / 2, 55, qrSize, qrSize);
    doc.setFontSize(14);
    doc.setTextColor(16, 185, 129);
    doc.text(url, pageW / 2, 190, { align: 'center' });
    doc.save(`qr-${slug}.pdf`);
  }

  if (!slug) {
    return (
      <section className="bg-white rounded-2xl shadow-sm p-5 border border-dashed border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <QrCode className="h-5 w-5 text-gray-400" />
          <div className="font-bold text-gray-900">Código QR para promoción</div>
        </div>
        <div className="text-sm text-gray-500">Configurá primero un slug para generar el QR.</div>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-2xl shadow-sm p-5 border border-emerald-100">
      <div className="flex items-center gap-2 mb-1">
        <QrCode className="h-5 w-5 text-emerald-500" />
        <div className="font-bold text-gray-900">Código QR para promoción</div>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Descargá el código QR para compartir en redes, imprimir en banners, menús, vidrieras, etc.
      </p>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="flex flex-col items-center gap-2 shrink-0">
          <div className="bg-white p-3 rounded-xl border border-gray-200">
            <canvas ref={canvasRef} />
          </div>
          <div className="text-sm font-semibold text-gray-700">{storeName}</div>
        </div>

        <div className="flex-1 w-full space-y-2">
          <div className="text-sm font-semibold text-gray-700 mb-2">Descargá tu código QR:</div>

          <button
            onClick={downloadPNG}
            disabled={!pngDataUrl}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">📄</div>
              <div className="text-left">
                <div className="text-sm">Descargar como PNG</div>
                <div className="text-xs opacity-80 font-normal">Para redes sociales y uso digital</div>
              </div>
            </div>
            <Download className="h-4 w-4" />
          </button>

          <button
            onClick={downloadSVG}
            disabled={!svgString}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">✨</div>
              <div className="text-left">
                <div className="text-sm">Descargar como SVG</div>
                <div className="text-xs opacity-80 font-normal">Vector escalable para diseñadores</div>
              </div>
            </div>
            <Download className="h-4 w-4" />
          </button>

          <button
            onClick={downloadPDF}
            disabled={!pngDataUrl}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">📋</div>
              <div className="text-left">
                <div className="text-sm">Descargar como PDF</div>
                <div className="text-xs text-gray-500 font-normal">Para imprimir en banners y carteles</div>
              </div>
            </div>
            <Download className="h-4 w-4" />
          </button>

          <div className="bg-emerald-50 rounded-xl p-3 text-xs text-gray-600 mt-3">
            <div className="font-semibold text-gray-800 mb-1">💡 Ideas de uso:</div>
            <ul className="space-y-0.5 list-disc list-inside">
              <li>Publicá en Instagram Stories</li>
              <li>Imprimí en banners y carteles</li>
              <li>Agregá a tu menú físico</li>
              <li>Colocá en vidrieras o mostradores</li>
              <li>Compartí en grupos de WhatsApp</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
