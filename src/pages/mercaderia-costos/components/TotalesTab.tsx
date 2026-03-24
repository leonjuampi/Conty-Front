import { useState, useEffect } from 'react';
import {
  listElaborationCosts,
  getElaborationSettings,
  updateElaborationSettings,
  type ElaborationCost,
} from '../../../services/elaborationCosts.service';
import { calcularTotal } from './CostosTab';

export function TotalesTab() {
  const [costs, setCosts] = useState<ElaborationCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [costosLocal, setCostosLocal] = useState(0);
  const [isEditingCostos, setIsEditingCostos] = useState(false);
  const [tempCostos, setTempCostos] = useState('0');
  const [savingCostos, setSavingCostos] = useState(false);

  useEffect(() => {
    Promise.all([
      listElaborationCosts().catch(() => [] as ElaborationCost[]),
      getElaborationSettings().catch(() => ({ monthly_local_cost: 0 })),
    ]).then(([costsData, settings]) => {
      setCosts(costsData);
      setCostosLocal(settings.monthly_local_cost);
      setTempCostos(String(settings.monthly_local_cost));
    }).finally(() => setLoading(false));
  }, []);

  const handleSaveCostos = async () => {
    const valor = parseFloat(tempCostos);
    if (isNaN(valor) || valor < 0) { setIsEditingCostos(false); return; }
    setSavingCostos(true);
    try {
      await updateElaborationSettings(valor);
      setCostosLocal(valor);
    } catch {
      alert('Error al guardar');
    } finally {
      setSavingCostos(false);
      setIsEditingCostos(false);
    }
  };

  const handleCancelEdit = () => {
    setTempCostos(costosLocal.toString());
    setIsEditingCostos(false);
  };

  const fmt = (n: number) => n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Totales Finales</h2>
        <p className="text-sm text-gray-600 mt-1">Precios de venta calculados por producto</p>
      </div>

      {/* Costos del Local */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Costos del Local (mensual)</h3>
            <p className="text-xs text-gray-500">
              Incluye gas, luz, alquiler, sueldos y otros gastos fijos mensuales variables
            </p>
          </div>

          {!isEditingCostos ? (
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-brand-500">
                ${fmt(costosLocal)}
              </span>
              <button
                onClick={() => { setIsEditingCostos(true); setTempCostos(costosLocal.toString()); }}
                className="text-gray-500 hover:text-brand-500 transition-colors w-10 h-10 flex items-center justify-center"
                title="Editar"
              >
                <i className="ri-pencil-line text-xl"></i>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={tempCostos}
                onChange={(e) => setTempCostos(e.target.value)}
                className="w-40 px-4 py-2 border border-gray-300 rounded-md text-lg font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="0"
                autoFocus
              />
              <button
                onClick={handleSaveCostos}
                disabled={savingCostos}
                className="px-4 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600 transition-colors font-medium text-sm disabled:opacity-60"
              >
                {savingCostos ? <i className="ri-loader-4-line animate-spin"></i> : <i className="ri-check-line"></i>}
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors font-medium text-sm"
              >
                <i className="ri-close-line"></i>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Producto</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Precio Costo</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Precio Aprox. Venta</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Precio Costo Final</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Precio Venta Final</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center">
                    <i className="ri-loader-4-line animate-spin text-2xl text-brand-500"></i>
                  </td>
                </tr>
              ) : costs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500 text-sm">
                    No hay costos de elaboración. Cargalos en la tab Costos.
                  </td>
                </tr>
              ) : (
                costs.map((cost, index) => {
                  const precioCosto = calcularTotal(cost, costs);
                  const precioAproxVenta = precioCosto * 2;
                  const precioCostoFinal = precioCosto + costosLocal;
                  const precioVentaFinal = precioCostoFinal * 2 - costosLocal;

                  return (
                    <tr key={cost.id} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 uppercase">{cost.name}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-800">${fmt(precioCosto)}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-brand-500">${fmt(precioAproxVenta)}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-800">${fmt(precioCostoFinal)}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-brand-500">${fmt(precioVentaFinal)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
