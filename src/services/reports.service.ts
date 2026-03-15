import { api } from './api';

export interface TopSeller {
  sellerName: string;
  orders: number;
  total: number;
}

export interface TopProduct {
  productName: string;
  quantity: number;
  total: number;
}

export interface ReportsData {
  bySeller: TopSeller[];
  topProducts: TopProduct[];
}

export async function getReports(params?: {
  branchId?: number;
  from?: string;
  to?: string;
}): Promise<ReportsData> {
  const { data } = await api.get('/reports', { params });
  return data;
}
