export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
export const STORAGE_BASE = process.env.NEXT_PUBLIC_STORAGE_URL || 'http://127.0.0.1:8000';
export { getAvatarUrl, uploadAvatarFile, AVATAR_PRESETS } from './avatar';

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('classme_token');
  }
  return null;
}

export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('classme_token', token);
  }
}

export function removeAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('classme_token');
    localStorage.removeItem('classme_user');
    localStorage.removeItem('classme_classroom');
    localStorage.removeItem('classme_subject');
  }
}

export function getStoredClassroom(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('classme_classroom');
  }
  return null;
}

export function setStoredClassroom(name: string | null): void {
  if (typeof window !== 'undefined') {
    if (name) {
      localStorage.setItem('classme_classroom', name);
    } else {
      localStorage.removeItem('classme_classroom');
    }
  }
}

export function getStoredSubjectId(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('classme_subject');
  }
  return null;
}

export function setStoredSubjectId(id: string | null): void {
  if (typeof window !== 'undefined') {
    if (id) {
      localStorage.setItem('classme_subject', id);
    } else {
      localStorage.removeItem('classme_subject');
    }
  }
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
const memoryCache: Record<string, CacheEntry<any>> = {};
const CACHE_TTL_MS = 60_000; // 60s cache for meta

export function clearApiCache(prefix?: string) {
  if (!prefix) {
    for (const key in memoryCache) delete memoryCache[key];
  } else {
    for (const key in memoryCache) {
      if (key.startsWith(prefix)) delete memoryCache[key];
    }
  }
}

export function getStoredUser(): any | null {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem('classme_user');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function setStoredUser(user: any): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('classme_user', JSON.stringify(user));
  }
}

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}`;
    try {
      const json = await res.json();
      if (json.message) errorMsg = json.message;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export const api = {
  // Authentication
  login: async (credentials: { email: string; password: string }) => {
    const res = await fetchApi<{ status: string; message: string; data: { user: any; token: string } }>('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (res.data?.token) {
      setAuthToken(res.data.token);
      setStoredUser(res.data.user);
    }
    return res;
  },
  logout: async () => {
    try {
      await fetchApi<{ status: string; message: string }>('/auth/logout', {
        method: 'POST',
      });
    } catch {
      // ignore
    } finally {
      removeAuthToken();
    }
  },
  getMe: () => fetchApi<{ status: string; data: any }>('/auth/me'),

  // Prefixes
  getPrefixes: (type?: 'student' | 'staff') => {
    const q = type ? `?type=${type}` : '';
    return fetchApi<{ status: string; data: any[] }>(`/prefixes${q}`);
  },
  createPrefix: (data: { name: string; type: 'student' | 'staff' | 'all' }) =>
    fetchApi<{ status: string; message: string; data: any }>('/prefixes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  deletePrefix: (id: number | string) =>
    fetchApi<{ status: string; message: string }>(`/prefixes/${id}`, {
      method: 'DELETE',
    }),

  // Students
  getStudents: (params?: { classroom?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.classroom) q.append('classroom', params.classroom);
    if (params?.search) q.append('search', params.search);
    return fetchApi<{ status: string; data: any[] }>(`/students?${q.toString()}`);
  },
  getStudent: (id: number | string) => fetchApi<{ status: string; data: any }>(`/students/${id}`),
  createStudent: (data: any) => fetchApi<{ status: string; data: any }>('/students', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  updateStudent: (id: number | string, data: any) => fetchApi<{ status: string; data: any }>(`/students/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  deleteStudent: (id: number | string) => fetchApi<{ status: string }>(`/students/${id}`, {
    method: 'DELETE',
  }),
  batchImportStudents: (data: { classroom: string; students: any[] }) =>
    fetchApi<{ status: string; message: string; data: any }>('/students/batch-import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  aiScanRoster: async (formData: FormData) => {
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/students/ai-scan-roster`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Upload failed with status ${res.status}`);
    }
    return res.json();
  },

  // Classrooms
  getClassrooms: async () => {
    const key = 'classrooms';
    const cached = memoryCache[key];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
    const res = await fetchApi<{ status: string; data: any[] }>('/classrooms');
    memoryCache[key] = { data: res, timestamp: Date.now() };
    return res;
  },
  getClassroom: (id: number | string) => fetchApi<{ status: string; data: any }>(`/classrooms/${id}`),
  createClassroom: async (data: any) => {
    clearApiCache('classrooms');
    return fetchApi<{ status: string; message?: string; data: any }>('/classrooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  updateClassroom: async (id: number | string, data: any) => {
    clearApiCache('classrooms');
    return fetchApi<{ status: string; message?: string; data: any }>(`/classrooms/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  deleteClassroom: async (id: number | string) => {
    clearApiCache('classrooms');
    return fetchApi<{ status: string; message?: string }>(`/classrooms/${id}`, {
      method: 'DELETE',
    });
  },

  // Subjects
  getSubjects: async () => {
    const key = 'subjects';
    const cached = memoryCache[key];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
    const res = await fetchApi<{ status: string; data: any[] }>('/subjects');
    memoryCache[key] = { data: res, timestamp: Date.now() };
    return res;
  },
  createSubject: async (data: any) => {
    clearApiCache('subjects');
    return fetchApi<{ status: string; data: any }>('/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  // Schedules
  getSchedules: (params?: { classroom?: string; subject_id?: string }) => {
    const q = new URLSearchParams();
    if (params?.classroom) q.append('classroom', params.classroom);
    if (params?.subject_id) q.append('subject_id', params.subject_id);
    return fetchApi<{ status: string; data: any[] }>(`/schedules?${q.toString()}`);
  },
  createSchedule: (data: any) => fetchApi<{ status: string; data: any }>('/schedules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  updateSchedule: (id: number | string, data: any) => fetchApi<{ status: string; data: any }>(`/schedules/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  deleteSchedule: (id: number | string) => fetchApi<{ status: string }>(`/schedules/${id}`, {
    method: 'DELETE',
  }),

  // Attendance
  getAttendanceStats: (params?: { classroom?: string; subject_id?: string }) => {
    const q = new URLSearchParams();
    if (params?.classroom) q.append('classroom', params.classroom);
    if (params?.subject_id) q.append('subject_id', params.subject_id);
    return fetchApi<{ status: string; data: any }>(`/attendance/stats?${q.toString()}`);
  },
  getAttendanceSessions: (params?: { classroom?: string; subject_id?: string; date?: string }) => {
    const q = new URLSearchParams();
    if (params?.classroom) q.append('classroom', params.classroom);
    if (params?.subject_id) q.append('subject_id', params.subject_id);
    if (params?.date) q.append('date', params.date);
    return fetchApi<{ status: string; data: { data: any[] } }>(`/attendance/sessions?${q.toString()}`);
  },
  getSessionDetail: (id: number | string) => fetchApi<{ status: string; data: any }>(`/attendance/sessions/${id}`),
  saveAttendance: (data: any) => fetchApi<{ status: string; message: string; data: any }>('/attendance/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  getExportExcelUrl: (classroom: string, subjectId?: string) => {
    const q = new URLSearchParams({ classroom });
    if (subjectId) q.append('subject_id', subjectId);
    return `${API_BASE}/attendance/export-excel?${q.toString()}`;
  },

  // AI OCR
  uploadAndScanSheet: async (formData: FormData) => {
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/ai/upload-sheet`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Upload failed with status ${res.status}`);
    }
    return res.json();
  },
  confirmAiSheet: (data: any) => fetchApi<{ status: string; message: string; data: any }>('/ai/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  getAiUploadHistory: () => fetchApi<{ status: string; data: any[] }>('/ai/history'),

  // Alerts
  getAlerts: () => fetchApi<{ status: string; data: any[] }>('/alerts'),
  markAlertRead: (id: number | string) => fetchApi<{ status: string; data: any }>(`/alerts/${id}/read`, {
    method: 'POST',
  }),
  scanAlerts: () => fetchApi<{ status: string; message: string }>('/alerts/scan', {
    method: 'POST',
  }),

  // Roles & Permissions & User Profile
  getRoles: () => fetchApi<{ status: string; data: any[] }>('/roles'),
  getPermissions: () => fetchApi<{ status: string; data: Record<string, any[]> }>('/roles/permissions'),
  updateRolePermissions: (roleId: number | string, permissionIds: number[]) =>
    fetchApi<{ status: string; message: string; data: any }>(`/roles/${roleId}/permissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permission_ids: permissionIds }),
    }),
  getUserProfile: () => fetchApi<{ status: string; data: any }>('/user/profile'),
  updateUserProfile: (data: { prefix?: string; name: string; role_id?: number }) =>
    fetchApi<{ status: string; message: string; data: any }>('/user/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  // Users Management
  getUsers: () => fetchApi<{ status: string; data: any[] }>('/users'),
  getUser: (id: number | string) => fetchApi<{ status: string; data: any }>(`/users/${id}`),
  createUser: async (data: any) => {
    if (typeof window !== 'undefined' && data instanceof FormData) {
      const token = getAuthToken();
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers,
        body: data,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
      return json;
    }
    return fetchApi<{ status: string; message: string; data: any }>('/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  updateUser: async (id: number | string, data: any) => {
    if (typeof window !== 'undefined' && data instanceof FormData) {
      const token = getAuthToken();
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/users/${id}`, {
        method: 'POST',
        headers,
        body: data,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
      return json;
    }
    return fetchApi<{ status: string; message: string; data: any }>(`/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  uploadUserAvatar: async (userId: number | string, file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const token = getAuthToken();
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/users/${userId}/avatar`, {
      method: 'POST',
      headers,
      body: formData,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.message || `อัปโหลดรูปไม่สำเร็จ (${res.status})`);
    return json;
  },
  deleteUser: (id: number | string) =>
    fetchApi<{ status: string; message: string }>(`/users/${id}`, {
      method: 'DELETE',
    }),
};
