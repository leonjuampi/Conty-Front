import { api } from './api';

export interface StoreOrgConfig {
  id: number;
  name: string;
  store_slug: string | null;
  store_enabled: number;
  store_custom_domain: string | null;
}

export interface StoreBranch {
  id: number;
  name: string;
  status: string;
}

export interface StoreDashboardStats {
  soldToday: number;
  pending: number;
  confirmed: number;
}

export interface StoreSettingsAdmin {
  org_id: number;
  store_branch_id: number | null;
  display_name: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  whatsapp_number: string;
  email: string | null;
  notify_email: string | null;
  fiscal_address: string | null;
  fiscal_lat: number | null;
  fiscal_lng: number | null;
  pickup_enabled: number;
  delivery_enabled: number;
  delivery_radius_km: number | null;
  delivery_cost: number;
  delivery_zones: string | null;
  min_order_amount: number;
  payment_methods_text: string | null;
  schedule_json: any;
  social_instagram: string | null;
  social_facebook: string | null;
  primary_color: string;
}

export interface AdminProductForStore {
  id: number;
  name: string;
  sku: string;
  price: number;
  image_url: string | null;
  status: string;
  online_visible: number;
  online_featured: number;
  online_sort_order: number;
  category_name: string | null;
}

export interface AdminCategoryForStore {
  id: number;
  name: string;
  online_featured: number;
  online_sort_order: number;
}

export interface Coupon {
  id: number;
  code: string;
  discount_type: 'PERCENT' | 'AMOUNT';
  discount_value: number;
  min_order_amount: number;
  valid_from: string | null;
  valid_to: string | null;
  max_uses: number | null;
  used_count: number;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
}

export type OnlineOrderStatus =
  | 'PRE_CONFIRMED'
  | 'RECEIVED'
  | 'PREPARING'
  | 'READY_TO_DELIVER'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OnlineOrder {
  id: number;
  org_id: number;
  order_number: string;
  status: OnlineOrderStatus;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  delivery_type: 'PICKUP' | 'DELIVERY';
  delivery_address: string | null;
  delivery_lat: number | null;
  delivery_lng: number | null;
  delivery_notes: string | null;
  coupon_id: number | null;
  subtotal: number;
  discount: number;
  delivery_cost: number;
  total: number;
  whatsapp_sent_at: string | null;
  sale_id: number | null;
  payment_method_id: number | null;
  payment_method_name?: string | null;
  confirmed_at: string | null;
  confirmed_by: number | null;
  created_at: string;
  updated_at: string;
  items?: {
    id: number;
    product_id: number;
    variant_id: number | null;
    product_name: string;
    qty: number;
    unit_price: number;
    subtotal: number;
    notes: string | null;
  }[];
}

export async function getStoreConfig(): Promise<{ org: StoreOrgConfig | null; settings: StoreSettingsAdmin | null }> {
  const r = await api.get('/store/config');
  return r.data;
}

export async function updateStoreConfig(payload: {
  store_slug?: string | null;
  store_enabled?: boolean;
  store_custom_domain?: string | null;
  settings?: Partial<StoreSettingsAdmin>;
}) {
  const r = await api.put('/store/config', payload);
  return r.data;
}

export async function checkSlug(slug: string): Promise<{ available: boolean; reason?: string }> {
  const r = await api.get('/store/check-slug', { params: { slug } });
  return r.data;
}

export async function uploadStoreLogo(file: File): Promise<{ url: string }> {
  const fd = new FormData();
  fd.append('image', file);
  const r = await api.post('/store/logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  return r.data;
}

export async function uploadStoreBanner(file: File): Promise<{ url: string }> {
  const fd = new FormData();
  fd.append('image', file);
  const r = await api.post('/store/banner', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  return r.data;
}

export async function listProductsForStore(params: { search?: string; onlineOnly?: boolean } = {}) {
  const r = await api.get('/store/products', { params });
  return r.data.items as AdminProductForStore[];
}

export async function patchProductOnline(id: number, body: { online_visible?: boolean; online_featured?: boolean; online_sort_order?: number }) {
  const r = await api.patch(`/store/products/${id}/online`, body);
  return r.data;
}

export async function listCategoriesForStore() {
  const r = await api.get('/store/categories');
  return r.data.items as AdminCategoryForStore[];
}

export async function patchCategoryOnline(id: number, body: { online_featured?: boolean; online_sort_order?: number }) {
  const r = await api.patch(`/store/categories/${id}/online`, body);
  return r.data;
}

export async function listCoupons() {
  const r = await api.get('/store/coupons');
  return r.data.items as Coupon[];
}

export async function createCoupon(payload: Partial<Coupon>) {
  const r = await api.post('/store/coupons', payload);
  return r.data as Coupon;
}

export async function updateCoupon(id: number, payload: Partial<Coupon>) {
  const r = await api.put(`/store/coupons/${id}`, payload);
  return r.data as Coupon;
}

export async function deleteCoupon(id: number) {
  await api.delete(`/store/coupons/${id}`);
}

export async function listOnlineOrders(params: { status?: OnlineOrderStatus; scope?: 'active' | 'history' } = {}) {
  const r = await api.get('/store/orders', { params });
  return r.data.items as OnlineOrder[];
}

export async function confirmOnlineOrder(id: number, payment_method_id: number) {
  const r = await api.post(`/store/orders/${id}/confirm`, { payment_method_id });
  return r.data as OnlineOrder;
}

export async function getOnlineOrder(id: number) {
  const r = await api.get(`/store/orders/${id}`);
  return r.data as OnlineOrder;
}

export async function patchOnlineOrderStatus(id: number, status: OnlineOrderStatus) {
  const r = await api.patch(`/store/orders/${id}/status`, { status });
  return r.data as OnlineOrder;
}

export async function listStoreBranches() {
  const r = await api.get('/store/branches');
  return r.data.items as StoreBranch[];
}

export async function getStoreDashboard() {
  const r = await api.get('/store/dashboard');
  return r.data as StoreDashboardStats;
}

export interface StoreReports {
  range: { from: string; to: string };
  summary: {
    total_sold: number;
    orders_confirmed: number;
    orders_cancelled: number;
    avg_ticket: number;
  };
  top_products: { product_id: number; product_name: string; units: number; revenue: number }[];
  top_customers: { customer_name: string; customer_phone: string; orders_count: number; total_spent: number }[];
  sales_by_day: { day: string; orders: number; revenue: number }[];
  by_payment_method: { name: string; orders: number; revenue: number }[];
  coupons: { code: string; uses: number; total_discount: number; total_revenue: number }[];
  delivery_mix: { pickup_count: number; delivery_count: number; pickup_revenue: number; delivery_revenue: number };
}

export async function getStoreReports(from?: string, to?: string) {
  const r = await api.get('/store/reports', { params: { from, to } });
  return r.data as StoreReports;
}
