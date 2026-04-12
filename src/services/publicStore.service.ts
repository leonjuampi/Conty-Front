import { publicApi } from './publicApi';

export interface StoreSettings {
  org_id: number;
  display_name: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  whatsapp_number: string;
  email: string | null;
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

export interface StoreInfo {
  org: { id: number; name: string; store_slug: string };
  settings: StoreSettings | null;
}

export interface StoreCategory {
  id: number;
  name: string;
  online_featured: number;
  online_sort_order: number;
}

export interface StoreProduct {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: number;
  category_name: string | null;
  online_featured: number;
  stock: number;
}

export interface StoreProductDetail extends StoreProduct {
  variants: { id: number; name: string | null; sku: string; price: number | null; stock: number }[];
}

export interface CartItem {
  product_id: number;
  variant_id?: number | null;
  qty: number;
  unit_price: number;
  product_name: string;
  image_url?: string | null;
  notes?: string;
}

export interface CouponValidation {
  valid: boolean;
  coupon?: { id: number; code: string; discount_type: 'PERCENT' | 'AMOUNT'; discount_value: number };
  discount?: number;
  error?: string;
}

export interface CreateOrderPayload {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  delivery_type: 'PICKUP' | 'DELIVERY';
  delivery_address?: string;
  delivery_lat?: number;
  delivery_lng?: number;
  delivery_notes?: string;
  coupon_code?: string;
  items: { product_id: number; variant_id?: number | null; qty: number; unit_price: number; notes?: string }[];
}

export interface CreatedOrder {
  orderId: number;
  orderNumber: string;
  total: number;
  whatsappLink: string;
}

export async function getStore(slug: string): Promise<StoreInfo> {
  const r = await publicApi.get(`/public/store/${slug}`);
  return r.data;
}

export async function getStoreCategories(slug: string): Promise<StoreCategory[]> {
  const r = await publicApi.get(`/public/store/${slug}/categories`);
  return r.data.items;
}

export async function getStoreProducts(slug: string, params: { categoryId?: number; search?: string; featuredOnly?: boolean } = {}): Promise<StoreProduct[]> {
  const r = await publicApi.get(`/public/store/${slug}/products`, { params });
  return r.data.items;
}

export async function getStoreProductDetail(slug: string, productId: number): Promise<StoreProductDetail> {
  const r = await publicApi.get(`/public/store/${slug}/products/${productId}`);
  return r.data;
}

export async function validateStoreCoupon(slug: string, code: string, subtotal: number): Promise<CouponValidation> {
  try {
    const r = await publicApi.post(`/public/store/${slug}/coupons/validate`, { code, subtotal });
    return r.data;
  } catch (e: any) {
    return { valid: false, error: e?.response?.data?.message || 'Cupón inválido' };
  }
}

export async function createStoreOrder(slug: string, payload: CreateOrderPayload): Promise<CreatedOrder> {
  const r = await publicApi.post(`/public/store/${slug}/orders`, payload);
  return r.data;
}
