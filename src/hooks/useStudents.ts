import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Student } from '@/types/student';

interface UseStudentsOptions {
  initialClassroom?: string | null;
}

export function useStudents({ initialClassroom }: UseStudentsOptions = {}) {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<string>(initialClassroom || 'all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialClassroom) {
      setSelectedClassroom(initialClassroom);
    }
  }, [initialClassroom]);

  const loadStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: { classroom?: string; search?: string } = {};
      if (selectedClassroom !== 'all') {
        params.classroom = selectedClassroom;
      }
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      const res = await api.getStudents(params);
      if (res.data) {
        setStudents(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load students:', err);
      setError(err?.message || 'ไม่สามารถโหลดข้อมูลนักเรียนได้');
    } finally {
      setLoading(false);
    }
  }, [selectedClassroom, searchTerm]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const deleteStudent = useCallback(async (id: number): Promise<boolean> => {
    if (!confirm('ยืนยันที่จะลบข้อมูลนักเรียนรายนี้?')) return false;
    try {
      await api.deleteStudent(id);
      await loadStudents();
      return true;
    } catch (err: any) {
      alert('ไม่สามารถลบได้: ' + (err?.message || 'เกิดข้อผิดพลาด'));
      return false;
    }
  }, [loadStudents]);

  return {
    students,
    loading,
    error,
    selectedClassroom,
    setSelectedClassroom,
    searchTerm,
    setSearchTerm,
    loadStudents,
    deleteStudent,
  };
}
