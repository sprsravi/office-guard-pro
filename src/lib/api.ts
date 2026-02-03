/**
 * API Service for MySQL Backend
 * 
 * Update the API_BASE_URL to point to your backend server
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Types
export interface Visitor {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  purpose: string;
  host_name: string;
  host_department?: string;
  badge_number?: string;
  photo_url?: string;
  id_proof_type?: string;
  id_proof_number?: string;
  vehicle_number?: string;
  check_in_time: string;
  check_out_time?: string;
  status: 'checked_in' | 'checked_out' | 'pre_registered';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Host {
  id: number;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  designation?: string;
  is_active: boolean;
}

export interface Department {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface VisitPurpose {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface DashboardStats {
  todayVisitors: number;
  currentlyCheckedIn: number;
  weekVisitors: number;
  monthVisitors: number;
}

// API Helper
async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// ============ VISITORS API ============

export const visitorsApi = {
  // Get all visitors with optional filters
  getAll: (params?: { startDate?: string; endDate?: string; status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    if (params?.status) searchParams.append('status', params.status);
    
    const query = searchParams.toString();
    return apiRequest<Visitor[]>(`/visitors${query ? `?${query}` : ''}`);
  },

  // Get single visitor
  getById: (id: number) => apiRequest<Visitor>(`/visitors/${id}`),

  // Check-in visitor
  checkIn: (data: Omit<Visitor, 'id' | 'check_in_time' | 'check_out_time' | 'status' | 'created_at' | 'updated_at'>) =>
    apiRequest<Visitor>('/visitors/checkin', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Check-out visitor
  checkOut: (id: number) =>
    apiRequest<Visitor>(`/visitors/${id}/checkout`, { method: 'PUT' }),

  // Export visitors as CSV
  exportCSV: async (params?: { startDate?: string; endDate?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    
    const query = searchParams.toString();
    const response = await fetch(`${API_BASE_URL}/visitors/export/csv${query ? `?${query}` : ''}`);
    
    if (!response.ok) throw new Error('Export failed');
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visitors-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },
};

// ============ HOSTS API ============

export const hostsApi = {
  getAll: () => apiRequest<Host[]>('/hosts'),
  create: (data: Omit<Host, 'id' | 'is_active'>) =>
    apiRequest<Host>('/hosts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ============ DEPARTMENTS API ============

export const departmentsApi = {
  getAll: () => apiRequest<Department[]>('/departments'),
};

// ============ PURPOSES API ============

export const purposesApi = {
  getAll: () => apiRequest<VisitPurpose[]>('/purposes'),
};

// ============ STATISTICS API ============

export const statisticsApi = {
  getDashboard: () => apiRequest<DashboardStats>('/statistics/dashboard'),
  getByDateRange: (startDate: string, endDate: string) =>
    apiRequest<any[]>(`/statistics/visitors?startDate=${startDate}&endDate=${endDate}`),
};

// ============ HEALTH CHECK ============

export const healthApi = {
  check: () => apiRequest<{ status: string; database: string }>('/health'),
};
