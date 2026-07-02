import { api } from './api';

export interface ProductVariant {
  id: number;
  sku: string | null;
  name: string;
  price: number;
  cost: number | null;
  stock?: number;
}

export interface ComboItem {
  id?: number;
  variantId: number;
  qty: number;
  variantSku?: string | null;
  variantName?: string | null;
  productName?: string | null;
  productId?: number;
  price?: number;
  cost?: number;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  categoryId: number | null;
  categoryName: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  imageUrl: string | null;
  isCombo: boolean;
  hasVariants: boolean;
  comboItems: ComboItem[];
  variants: ProductVariant[];
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
}

/** Mapea una fila cruda del backend (snake_case + first_variant_*) al interface Product */
function mapProduct(row: any): Product {
  const variantId    = row.first_variant_id    ?? row.variantId    ?? null;
  const variantSku   = row.first_variant_sku   ?? row.variantSku   ?? row.sku ?? null;
  // branch_price tiene prioridad si existe (precio de la lista de la sucursal)
  const variantPrice = row.branch_price != null
    ? row.branch_price
    : (row.first_variant_price ?? row.variantPrice ?? row.price ?? 0);
  const variantCost  = row.first_variant_cost  ?? row.variantCost  ?? row.cost  ?? 0;
  const variantStock = row.stock ?? 0;

  return {
    id:           row.id,
    name:         row.name,
    description:  row.description ?? null,
    categoryId:   row.categoryId   ?? row.category_id   ?? null,
    categoryName: row.categoryName ?? row.category_name ?? null,
    status:       row.status,
    imageUrl:     row.imageUrl     ?? row.image_url     ?? null,
    isCombo:      !!(row.isCombo ?? row.is_combo),
    hasVariants:  !!(row.hasVariants ?? row.has_variants),
    comboItems:   Array.isArray(row.comboItems) ? row.comboItems : [],
    createdAt:    row.createdAt    ?? row.created_at    ?? '',
    variants: variantId ? [{
      id:    variantId,
      sku:   variantSku,
      name:  row.variantName ?? 'default',
      price: Number(variantPrice) || 0,
      cost:  Number(variantCost)  || 0,
      stock: Number(variantStock) || 0,
    }] : [],
  };
}

export async function listProducts(params?: {
  search?: string;
  categoryId?: number;
  status?: string;
  page?: number;
  pageSize?: number;
  limit?: number;
  offset?: number;
  branchId?: number;
}): Promise<{ items: Product[]; total: number; page: number; pageSize: number }> {
  const { data } = await api.get('/products', { params });
  return {
    ...data,
    items: (data.items ?? []).map(mapProduct),
  };
}

export async function getProduct(id: number, branchId?: number): Promise<Product> {
  const params = branchId ? { branchId } : {};
  const { data } = await api.get(`/products/${id}`, { params });
  return mapProduct(data);
}

export async function createProduct(payload: {
  name: string;
  description?: string;
  categoryId?: number;
  status?: string;
  isCombo?: boolean;
  comboItems?: ComboItem[];
  variants?: Partial<ProductVariant>[];
  branchId?: number | null;
}): Promise<{ id: number }> {
  const { data } = await api.post('/products', payload);
  return data;
}

export async function updateProduct(id: number, payload: Partial<Product> & { comboItems?: ComboItem[] }): Promise<void> {
  await api.put(`/products/${id}`, payload);
}

export async function deleteProduct(id: number): Promise<void> {
  await api.delete(`/products/${id}`);
}

// ─── Visibilidad por sucursal ─────────────────────────────────────────────

export interface ProductBranch {
  branchId: number;
  branchName: string;
  isAvailable: boolean;
}

export async function getProductBranches(productId: number): Promise<{ items: ProductBranch[] }> {
  const { data } = await api.get(`/products/${productId}/branches`);
  return data;
}

export async function setProductBranchAvailability(
  productId: number,
  branchId: number,
  isAvailable: boolean
): Promise<void> {
  await api.put(`/products/${productId}/branches/${branchId}`, { isAvailable });
}

export async function listCategories(): Promise<{ items: Category[] }> {
  const { data } = await api.get('/categories');
  return data;
}

export async function createCategory(payload: { name: string; description?: string }): Promise<{ id: number }> {
  const { data } = await api.post('/categories', payload);
  return data;
}

export async function deleteCategory(id: number): Promise<void> {
  await api.delete(`/categories/${id}`);
}

export async function downloadProductTemplate(): Promise<void> {
  const { data } = await api.get('/products/template.csv', { responseType: 'blob' });
  const url = URL.createObjectURL(new Blob([data], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'products_template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export async function uploadProductImage(id: number, file: File): Promise<{ imageUrl: string }> {
  const form = new FormData();
  form.append('image', file);
  const { data } = await api.post(`/products/${id}/image`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

// ─── Múltiples imágenes por producto ─────────────────────────────────────

export interface ProductImage {
  id: number;
  product_id: number;
  image_url: string;
  sort_order: number;
  is_primary: number;
  created_at?: string;
}

export const MAX_PRODUCT_IMAGES = 5;

export async function listProductImages(productId: number): Promise<{ items: ProductImage[]; max: number }> {
  const { data } = await api.get(`/products/${productId}/images`);
  return data;
}

export async function addProductImage(productId: number, file: File): Promise<{ image: ProductImage }> {
  const form = new FormData();
  form.append('image', file);
  const { data } = await api.post(`/products/${productId}/images`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function deleteProductImage(productId: number, imageId: number): Promise<void> {
  await api.delete(`/products/${productId}/images/${imageId}`);
}

export async function setPrimaryProductImage(productId: number, imageId: number): Promise<void> {
  await api.patch(`/products/${productId}/images/${imageId}/primary`);
}

export async function importProducts(file: File): Promise<{ successCount: number; errorCount: number; errors: { row: number; message: string }[] }> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post('/products/import', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

// --- Variant CRUD ---

export async function getProductDetail(id: number, branchId?: number): Promise<any> {
  const params = branchId ? { branchId } : {};
  const { data } = await api.get(`/products/${id}`, { params });
  return data;
}

export async function createVariant(productId: number, payload: {
  name: string;
  sku?: string | null;
  barcode?: string | null;
  price?: number | null;
  cost?: number | null;
}): Promise<{ id: number }> {
  const { data } = await api.post(`/products/${productId}/variants`, payload);
  return data;
}

export async function updateVariant(variantId: number, payload: {
  name?: string;
  sku?: string | null;
  barcode?: string | null;
}): Promise<void> {
  await api.put(`/products/variants/${variantId}`, payload);
}

export async function deleteVariant(variantId: number): Promise<void> {
  await api.delete(`/products/variants/${variantId}`);
}

export async function toggleVariants(productId: number, enable: boolean): Promise<void> {
  await api.put(`/products/${productId}/toggle-variants`, { enable });
}

export async function distributeStock(
  productId: number,
  branchId: number,
  distributions: { variantId: number; qty: number }[]
): Promise<{ distributed: number; remaining: number }> {
  const { data } = await api.put(`/products/${productId}/distribute-stock`, { branchId, distributions });
  return data;
}
