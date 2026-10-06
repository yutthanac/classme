import { STORAGE_BASE, API_BASE, getAuthToken } from './api';

/**
 * Resolve full URL for an avatar path or URL.
 */
export function getAvatarUrl(avatar?: string | null): string | null {
  if (!avatar || typeof avatar !== 'string') return null;

  const trimmed = avatar.trim();
  if (!trimmed) return null;

  // If already absolute URL or data URL
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // Handle storage paths
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  if (cleanPath.startsWith('/storage/')) {
    return `${STORAGE_BASE}${cleanPath}`;
  }

  return `${STORAGE_BASE}/storage${cleanPath}`;
}

/**
 * Upload an avatar image file to the backend storage library.
 */
export async function uploadAvatarFile(file: File): Promise<{ path: string; url: string }> {
  // Validate file
  if (!file.type.startsWith('image/')) {
    throw new Error('กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, WEBP, GIF)');
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('ขนาดไฟล์รูปภาพต้องไม่เกิน 5MB');
  }

  const formData = new FormData();
  formData.append('avatar', file);

  const token = getAuthToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/users/avatar-upload`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json.message || `อัปโหลดรูปภาพไม่สำเร็จ (${res.status})`);
  }

  return json.data;
}

/**
 * Avatar presets available for quick selection if user does not upload custom photo.
 */
export const AVATAR_PRESETS = [
  {
    id: 'teacher-m1',
    name: 'ครูผู้ชาย 1',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=TeacherMale1&backgroundColor=b6e3f4',
  },
  {
    id: 'teacher-f1',
    name: 'ครูผู้หญิง 1',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=TeacherFemale1&backgroundColor=ffd5dc',
  },
  {
    id: 'teacher-m2',
    name: 'ครูผู้ชาย 2',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=c0aede',
  },
  {
    id: 'teacher-f2',
    name: 'ครูผู้หญิง 2',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=ffdfbf',
  },
  {
    id: 'admin-1',
    name: 'แอดมิน 1',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=AdminBoss&backgroundColor=d1d4f9',
  },
  {
    id: 'admin-2',
    name: 'แอดมิน 2',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AdminPro&backgroundColor=ffd5dc',
  },
];
