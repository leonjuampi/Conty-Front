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

export interface CategoryProductRow {
  categoryId: number;
  categoryName: string;
  productId: number;
  productName: string;
  quantity: number;
  totalSales: number;
  totalCost: number;
  profit: number;
}

export interface ReportStats {
  totalSold: number;
  salesCount: number;
  avgTicket: number;
  unitsSold: number;
  totalCost: number;
  grossMargin: number;
}

export interface ReportsData {
  stats: ReportStats;
  bySeller: TopSeller[];
  topProducts: TopProduct[];
  byCategory: CategoryProductRow[];
}

export async function getReports(params?: {
  branchId?: number;
  from?: string;  // datetime: 'YYYY-MM-DD HH:mm:ss'
  to?: string;    // datetime: 'YYYY-MM-DD HH:mm:ss'
}): Promise<ReportsData> {
  const { data } = await api.get('/reports', { params });
  return data;
}
