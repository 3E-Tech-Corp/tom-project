const API_BASE = '/api';

interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 401) {
    // Don't redirect for login/setup endpoints — let the form show the error
    if (!endpoint.includes('/auth/login') && !endpoint.includes('/auth/setup')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    const error = await response.json().catch(() => ({ message: 'Unauthorized' }));
    throw new ApiError(error.message || 'Unauthorized', 401);
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new ApiError(error.message || 'Request failed', response.status);
  }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, body: unknown) => request<T>(endpoint, { method: 'POST', body }),
  put: <T>(endpoint: string, body: unknown) => request<T>(endpoint, { method: 'PUT', body }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};

// --- Dress Types ---
export interface Dress {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  category: string;
  size: string;
  color: string;
  price: number;
  inStock: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface DressCategory {
  id: number;
  name: string;
  description: string;
  sortOrder: number;
}

export interface UserSelection {
  id: number;
  userId: number;
  dressId: number;
  notes: string;
  createdAt: string;
  dressName: string;
  dressImageUrl: string;
  dressPrice: number;
  dressCategory: string;
  dressSize: string;
  dressColor: string;
}

export interface DressFilters {
  category?: string;
  size?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  inStock?: boolean;
}

export interface CreateDressRequest {
  name: string;
  description: string;
  imageUrl: string;
  category: string;
  size: string;
  color: string;
  price: number;
  inStock: boolean;
}

export interface CreateSelectionRequest {
  dressId: number;
  notes: string;
}

// --- Dress API ---
function buildQuery(filters: DressFilters): string {
  const params = new URLSearchParams();
  if (filters.category) params.set('category', filters.category);
  if (filters.size) params.set('size', filters.size);
  if (filters.color) params.set('color', filters.color);
  if (filters.minPrice !== undefined) params.set('minPrice', filters.minPrice.toString());
  if (filters.maxPrice !== undefined) params.set('maxPrice', filters.maxPrice.toString());
  if (filters.search) params.set('search', filters.search);
  if (filters.inStock !== undefined) params.set('inStock', filters.inStock.toString());
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const dressApi = {
  list: (filters: DressFilters = {}) =>
    api.get<Dress[]>(`/dresses${buildQuery(filters)}`),
  get: (id: number) =>
    api.get<Dress>(`/dresses/${id}`),
  create: (data: CreateDressRequest) =>
    api.post<Dress>('/dresses', data),
  update: (id: number, data: Partial<CreateDressRequest>) =>
    api.put<Dress>(`/dresses/${id}`, data),
  delete: (id: number) =>
    api.delete<{ message: string }>(`/dresses/${id}`),
  categories: () =>
    api.get<DressCategory[]>('/dresses/categories'),
  createCategory: (data: { name: string; description: string; sortOrder: number }) =>
    api.post<DressCategory>('/dresses/categories', data),
};

export const selectionApi = {
  list: () =>
    api.get<UserSelection[]>('/selections'),
  add: (data: CreateSelectionRequest) =>
    api.post<UserSelection>('/selections', data),
  remove: (id: number) =>
    api.delete<{ message: string }>(`/selections/${id}`),
};

export { ApiError };
export default api;
