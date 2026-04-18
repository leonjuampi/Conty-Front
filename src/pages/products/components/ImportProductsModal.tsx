import { useRef, useState } from 'react';
import { downloadProductTemplate } from '../../../services/products.service';

interface ImportResult {
  successCount: number;
  errorCount: number;
  errors: { row: number; message: string }[];
}

interface ImportProductsModalProps {
  onImport: (file: File) => Promise<ImportResult>;
  onClose: () => void;
  loading: boolean;
  result: ImportResult | null;
  onClearResult: () => void;
}

export function ImportProductsModal({ onImport, onClose, loading, result, onClearResult }: ImportProductsModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await onImport(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      await downloadProductTemplate();
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const steps = [
    { icon: 'ri-file-excel-line', text: 'Descargá la plantilla en formato Excel o CSV' },
    { icon: 'ri-table-line', text: 'Completá los datos: nombre, categoría, precio y costo son obligatorios' },
    { icon: 'ri-percent-line', text: 'Si querés precisión fiscal, podés completar alicuotaIVA y categoriaIVA (opcionales)' },
    { icon: 'ri-upload-cloud-line', text: 'Importá el archivo para agregar los productos' },
    { icon: 'ri-stack-line', text: 'Podés subir hasta 5000 productos por archivo' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Importar productos al inventario</h2>
            <p className="text-xs text-gray-500 mt-0.5">Asegurate de seguir los pasos para evitar errores en la carga.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer w-8 h-8 flex items-center justify-center shrink-0 ml-3">
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Resultado de importación */}
          {result && (
            <div className={`p-3 rounded-xl border ${result.errorCount === 0 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm text-gray-800">
                    <i className={`${result.errorCount === 0 ? 'ri-checkbox-circle-line text-green-600' : 'ri-error-warning-line text-amber-600'} mr-1`}></i>
                    {result.successCount} productos importados
                    {result.errorCount > 0 && `, ${result.errorCount} con error`}
                  </p>
                  {result.errors.length > 0 && (
                    <ul className="mt-1.5 space-y-0.5">
                      {result.errors.slice(0, 4).map((err, i) => (
                        <li key={i} className="text-xs text-red-600">Fila {err.row}: {err.message}</li>
                      ))}
                      {result.errors.length > 4 && (
                        <li className="text-xs text-gray-500">...y {result.errors.length - 4} errores más</li>
                      )}
                    </ul>
                  )}
                </div>
                <button onClick={onClearResult} className="text-gray-400 hover:text-gray-600 cursor-pointer shrink-0">
                  <i className="ri-close-line"></i>
                </button>
              </div>
            </div>
          )}

          {/* Pasos */}
          <ol className="space-y-3">
            {steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <i className={`${step.icon} text-gray-400 text-base shrink-0`}></i>
                  <span className="text-sm text-gray-700">{step.text}</span>
                </div>
              </li>
            ))}
          </ol>

          {/* Botones */}
          <div className="flex flex-col gap-2.5 pt-1">
            <button
              onClick={handleDownloadTemplate}
              disabled={downloadingTemplate}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 cursor-pointer text-sm font-medium disabled:opacity-60">
              {downloadingTemplate
                ? <><i className="ri-loader-4-line animate-spin"></i><span>Descargando...</span></>
                : <><i className="ri-download-2-line"></i><span>Plantilla</span></>}
            </button>

            <label className={`flex items-center justify-center gap-2 w-full px-4 py-3 bg-brand-500 text-white rounded-xl hover:bg-brand-600 cursor-pointer text-sm font-semibold ${loading ? 'opacity-60 pointer-events-none' : ''}`}>
              {loading
                ? <><i className="ri-loader-4-line animate-spin"></i><span>Importando...</span></>
                : <><i className="ri-upload-cloud-line"></i><span>Importar Excel / CSV</span></>}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
