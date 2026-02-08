/**
 * API Service using Lovable Cloud Database
 */

import { supabase } from "@/integrations/supabase/client";

// Types
export interface Visitor {
  id: string;
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
  has_laptop?: boolean;
  laptop_make?: string;
  laptop_model?: string;
  laptop_serial?: string;
  created_at: string;
  updated_at: string;
}

export interface Host {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  designation?: string;
  is_active: boolean;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface VisitPurpose {
  id: string;
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

// ============ VISITORS API ============

export const visitorsApi = {
  getAll: async (params?: { startDate?: string; endDate?: string; status?: string }): Promise<Visitor[]> => {
    let query = supabase.from('visitors').select('*').order('check_in_time', { ascending: false });

    if (params?.status) {
      query = query.eq('status', params.status);
    }
    if (params?.startDate) {
      query = query.gte('check_in_time', `${params.startDate}T00:00:00`);
    }
    if (params?.endDate) {
      query = query.lte('check_in_time', `${params.endDate}T23:59:59`);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data as Visitor[]) ?? [];
  },

  getById: async (id: string): Promise<Visitor> => {
    const { data, error } = await supabase.from('visitors').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error('Visitor not found');
    return data as Visitor;
  },

  checkIn: async (data: Omit<Visitor, 'id' | 'check_in_time' | 'check_out_time' | 'status' | 'created_at' | 'updated_at'>): Promise<Visitor> => {
    const { data: visitor, error } = await supabase
      .from('visitors')
      .insert({
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        company: data.company || null,
        purpose: data.purpose || 'Business Meeting',
        host_name: data.host_name,
        host_department: data.host_department || null,
        id_proof_type: data.id_proof_type || null,
        id_proof_number: data.id_proof_number || null,
        vehicle_number: data.vehicle_number || null,
        has_laptop: data.has_laptop ?? false,
        laptop_make: data.laptop_make || null,
        laptop_model: data.laptop_model || null,
        laptop_serial: data.laptop_serial || null,
        notes: data.notes || null,
        status: 'checked_in',
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return visitor as Visitor;
  },

  checkOut: async (id: string): Promise<Visitor> => {
    const { data, error } = await supabase
      .from('visitors')
      .update({ status: 'checked_out', check_out_time: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Visitor;
  },

  exportCSV: async (params?: { startDate?: string; endDate?: string }) => {
    let query = supabase.from('visitors').select('*').order('check_in_time', { ascending: false });

    if (params?.startDate) {
      query = query.gte('check_in_time', `${params.startDate}T00:00:00`);
    }
    if (params?.endDate) {
      query = query.lte('check_in_time', `${params.endDate}T23:59:59`);
    }

    const { data, error } = await query;
    if (error) throw new Error('Export failed');

    const visitors = data as Visitor[];
    const headers = ['Name', 'Email', 'Phone', 'Company', 'Purpose', 'Host', 'Department', 'ID Type', 'ID Number', 'Vehicle', 'Has Laptop', 'Laptop Make', 'Laptop Model', 'Laptop Serial', 'Check In', 'Check Out', 'Status', 'Notes'];
    const rows = visitors.map(v => [
      v.name, v.email ?? '', v.phone ?? '', v.company ?? '', v.purpose,
      v.host_name, v.host_department ?? '', v.id_proof_type ?? '', v.id_proof_number ?? '',
      v.vehicle_number ?? '', v.has_laptop ? 'Yes' : 'No', v.laptop_make ?? '',
      v.laptop_model ?? '', v.laptop_serial ?? '', v.check_in_time, v.check_out_time ?? '',
      v.status, v.notes ?? ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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
  getAll: async (): Promise<Host[]> => {
    const { data, error } = await supabase.from('hosts').select('*').eq('is_active', true).order('name');
    if (error) throw new Error(error.message);
    return (data as Host[]) ?? [];
  },

  create: async (hostData: Omit<Host, 'id' | 'is_active'>): Promise<Host> => {
    const { data, error } = await supabase
      .from('hosts')
      .insert({
        name: hostData.name,
        email: hostData.email,
        phone: hostData.phone || null,
        department: hostData.department || null,
        designation: hostData.designation || null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Host;
  },
};

// ============ DEPARTMENTS API ============

export const departmentsApi = {
  getAll: async (): Promise<Department[]> => {
    const { data, error } = await supabase.from('departments').select('*').eq('is_active', true).order('name');
    if (error) throw new Error(error.message);
    return (data as Department[]) ?? [];
  },
};

// ============ PURPOSES API ============

export const purposesApi = {
  getAll: async (): Promise<VisitPurpose[]> => {
    const { data, error } = await supabase.from('visit_purposes').select('*').eq('is_active', true).order('name');
    if (error) throw new Error(error.message);
    return (data as VisitPurpose[]) ?? [];
  },
};

// ============ STATISTICS API ============

export const statisticsApi = {
  getDashboard: async (): Promise<DashboardStats> => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    
    // Start of week (Monday)
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset).toISOString();
    
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [todayRes, checkedInRes, weekRes, monthRes] = await Promise.all([
      supabase.from('visitors').select('id', { count: 'exact', head: true }).gte('check_in_time', todayStart),
      supabase.from('visitors').select('id', { count: 'exact', head: true }).eq('status', 'checked_in'),
      supabase.from('visitors').select('id', { count: 'exact', head: true }).gte('check_in_time', weekStart),
      supabase.from('visitors').select('id', { count: 'exact', head: true }).gte('check_in_time', monthStart),
    ]);

    return {
      todayVisitors: todayRes.count ?? 0,
      currentlyCheckedIn: checkedInRes.count ?? 0,
      weekVisitors: weekRes.count ?? 0,
      monthVisitors: monthRes.count ?? 0,
    };
  },
};

// ============ SETTINGS API ============

export const settingsApi = {
  getAll: async () => {
    const { data, error } = await supabase.from('settings').select('*');
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  update: async (key: string, value: string) => {
    const { error } = await supabase.from('settings').update({ setting_value: value }).eq('setting_key', key);
    if (error) throw new Error(error.message);
  },
};
