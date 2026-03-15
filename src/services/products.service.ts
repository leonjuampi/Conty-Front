import { api } from './api';

export interface ProductVariant {
  id: number;
  sku: string | null;
  name: string;
  price: number;
  cost: number | null;
  stock?: number;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  categoryId: number | null;
  categoryName: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  imageUrl: string | null;
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
  const variantPrice = row.first_variant_price ?? row.variantPrice ?? row.price ?? 0;
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
  limit?: number;
  offset?: number;
}): Promise<{ items: Product[] }> {
  const { data } = await api.get('/products', { params });
  return {
    ...data,
    items: (data.items ?? []).map(mapProduct),
  };
}

export async function getProduct(id: number): Promise<Product> {
  const { data } = await api.get(`/products/${id}`);
  return mapProduct(data);
}

export async function createProduct(payload: {
  name: string;
  description?: string;
  categoryId?: number;
  status?: string;
  variants?: Partial<ProductVariant>[];
}): Promise<{ id: number }> {
  const { data } = await api.post('/products', payload);
  return data;
}

export async function updateProduct(id: number, payload: Partial<Product>): Promise<void> {
  await api.put(`/products/${id}`, payload);
}

export async function deleteProduct(id: number): Promise<void> {
  await api.delete(`/products/${id}`);
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
