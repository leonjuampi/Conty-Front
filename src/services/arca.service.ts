import { api } from './api';

export interface ArcaConfig {
  org_id: number;
  cuit_emisor: string;
  is_production: number;
  wsaa_expiration: string | null;
  has_cert: boolean;
  has_key: boolean;
}

export interface PuntoVenta {
  id: number;
  branchId: number;
  branchName: string;
  puntoVenta: number;
  isActive: boolean;
}

export async function getArcaConfig(): Promise<{ config: ArcaConfig | null }> {
  const { data } = await api.get('/arca/config');
  return data;
}

export async function saveArcaConfig(payload: {
  cuitEmisor: string;
  cert: string;
  privateKey: string;
  isProduction: boolean;
}): Promise<{ ok: boolean }> {
  const { data } = await api.post('/arca/config', payload);
  return data;
}

export async function testArcaConnection(): Promise<{ ok: boolean; status?: unknown; message?: string }> {
  const { data } = await api.post('/arca/test');
  return data;
}

export async function listPuntosVenta(): Promise<{ items: PuntoVenta[] }> {
  const { data } = await api.get('/arca/puntos-venta');
  return data;
}

export async function savePuntoVenta(payload: { branchId: number; puntoVenta: number }): Promise<{ ok: boolean }> {
  const { data } = await api.post('/arca/puntos-venta', payload);
  return data;
}

export async function getSalesPointsFromArca(): Promise<unknown> {
  const { data } = await api.get('/arca/puntos-venta/arca');
  return data;
}

export async function downloadInvoicePdf(saleId: number): Promise<void> {
  const response = await api.get(`/sales/${saleId}/pdf`, { responseType: 'blob' });
  const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `factura-${saleId}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
