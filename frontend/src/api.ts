import {
  PhoneProduct,
  Order,
  CustomerInquiry,
  PromoCode,
} from './types';

/**
 * Base API URL.
 * - Dev: Vite proxies '/api' -> http://localhost:8000 (see vite.config.ts)
 * - Override via VITE_API_URL env var when needed (e.g. Docker: http://localhost:8000/api)
 */
const API_BASE: string = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';

export interface AdminStats {
  revenue: number;
  ordersCount: number;
  productsCount: number;
  inStockUnits: number;
  lowStock: number;
  avgOrderValue: number;
  newInquiries: number;
  pendingOrders: number;
  statusBreakdown: Record<string, number>;
  recentOrders: Order[];
  recentInquiries: CustomerInquiry[];
}

interface ApiEnvelope<T> {
  ok: boolean;
  data: T;
  message?: string;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    ...options,
  });

  const body = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!res.ok || !body?.ok) {
    throw new Error(body?.message ?? `API request failed (${res.status})`);
  }

  return body.data;
}

// Products
export const getProducts = (params: { brand?: string; search?: string } = {}) => {
  const query = new URLSearchParams();
  if (params.brand && params.brand !== 'All') query.set('brand', params.brand);
  if (params.search) query.set('search', params.search);
  const qs = query.toString();
  return request<PhoneProduct[]>(`/products${qs ? `?${qs}` : ''}`);
};

export const createProduct = (payload: Partial<PhoneProduct>) =>
  request<PhoneProduct>('/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updateProduct = (id: string, payload: Partial<PhoneProduct>) =>
  request<PhoneProduct>(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

export const deleteProduct = (id: string) =>
  request<{ id: string }>(`/products/${id}`, { method: 'DELETE' });

// Orders
export const getOrders = () => request<Order[]>('/orders');

export const createOrder = (payload: Order) =>
  request<Order>('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updateOrderStatus = (id: string, status: Order['status']) =>
  request<Order>(`/orders/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

// Inquiries
export const getInquiries = () => request<CustomerInquiry[]>('/inquiries');

export const createInquiry = (payload: Partial<CustomerInquiry>) =>
  request<CustomerInquiry>('/inquiries', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updateInquiryStatus = (id: string, status: CustomerInquiry['status']) =>
  request<CustomerInquiry>(`/inquiries/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

export const deleteInquiry = (id: string) =>
  request<{ id: string }>(`/inquiries/${id}`, { method: 'DELETE' });

// Promos
export const getPromos = () => request<PromoCode[]>('/promos');

export const createPromo = (payload: Omit<PromoCode, 'id'>) =>
  request<PromoCode>('/promos', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updatePromo = (id: number, payload: Omit<PromoCode, 'id'>) =>
  request<PromoCode>(`/promos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

export const deletePromo = (id: number) =>
  request<{ id: number }>(`/promos/${id}`, { method: 'DELETE' });

// Stats (admin dashboard)
export const getStats = () => request<AdminStats>('/stats');

export const api = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getOrders,
  createOrder,
  updateOrderStatus,
  getInquiries,
  createInquiry,
  updateInquiryStatus,
  deleteInquiry,
  getPromos,
  createPromo,
  updatePromo,
  deletePromo,
  getStats,
  healthy: () => request<unknown>('/health'),
};

export default api;