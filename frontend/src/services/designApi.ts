import type { DressDesign, ImageUploadResponse } from '../types/dress';

const API_BASE = '/api';

function getHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

function getJsonHeaders(): Record<string, string> {
  return {
    ...getHeaders(),
    'Content-Type': 'application/json',
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }
  return response.json();
}

export const designApi = {
  // Dress designs (custom design studio)
  getAll: async (): Promise<DressDesign[]> => {
    const res = await fetch(`${API_BASE}/dress-designs`, { headers: getHeaders() });
    return handleResponse<DressDesign[]>(res);
  },

  getPresets: async (): Promise<DressDesign[]> => {
    const res = await fetch(`${API_BASE}/dress-designs/presets`, { headers: getHeaders() });
    return handleResponse<DressDesign[]>(res);
  },

  getMyDesigns: async (): Promise<DressDesign[]> => {
    const res = await fetch(`${API_BASE}/dress-designs/my-designs`, { headers: getHeaders() });
    return handleResponse<DressDesign[]>(res);
  },

  getById: async (id: number): Promise<DressDesign> => {
    const res = await fetch(`${API_BASE}/dress-designs/${id}`, { headers: getHeaders() });
    return handleResponse<DressDesign>(res);
  },

  create: async (data: { name: string; baseStyle: string; customizations: string; imageUrl?: string }): Promise<{ id: number }> => {
    const res = await fetch(`${API_BASE}/dress-designs`, {
      method: 'POST',
      headers: getJsonHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<{ id: number }>(res);
  },

  update: async (id: number, data: { name?: string; baseStyle?: string; customizations?: string; imageUrl?: string }): Promise<void> => {
    const res = await fetch(`${API_BASE}/dress-designs/${id}`, {
      method: 'PUT',
      headers: getJsonHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<void>(res);
  },

  delete: async (id: number): Promise<void> => {
    const res = await fetch(`${API_BASE}/dress-designs/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse<void>(res);
  },

  // Image uploads
  uploadDressImage: async (file: File): Promise<ImageUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/image/dress`, {
      method: 'POST',
      headers: getHeaders(),
      body: formData,
    });
    return handleResponse<ImageUploadResponse>(res);
  },

  uploadUserPhoto: async (file: File): Promise<ImageUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/image/user-photo`, {
      method: 'POST',
      headers: getHeaders(),
      body: formData,
    });
    return handleResponse<ImageUploadResponse>(res);
  },

  getUserPhotos: async () => {
    const res = await fetch(`${API_BASE}/image/user-photos`, { headers: getHeaders() });
    return handleResponse<Array<{ id: number; imageUrl: string; createdAt: string }>>(res);
  },

  deleteUserPhoto: async (id: number): Promise<void> => {
    const res = await fetch(`${API_BASE}/image/user-photos/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse<void>(res);
  },
};

export default designApi;
