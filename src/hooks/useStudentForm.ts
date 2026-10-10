import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Student, StudentFormData } from '@/types/student';

const DEFAULT_PREFIXES = ['นาย', 'นางสาว', 'ด.ช.', 'ด.ญ.', 'เด็กชาย', 'เด็กหญิง'];

const INITIAL_FORM_DATA: StudentFormData = {
  student_code: '',
  student_number: 1,
  title: 'นาย',
  first_name: '',
  last_name: '',
  classroom: 'ม.4/1',
  gender: 'male',
  guardian_name: '',
  guardian_phone: '',
  status: 'active',
};

export function useStudentForm() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [prefixMode, setPrefixMode] = useState<string>('นาย');
  const [customPrefix, setCustomPrefix] = useState<string>('');
  const [formData, setFormData] = useState<StudentFormData>(INITIAL_FORM_DATA);
  const [availablePrefixes, setAvailablePrefixes] = useState<string[]>(DEFAULT_PREFIXES);

  useEffect(() => {
    async function loadPrefixes() {
      try {
        const res = await api.getPrefixes('student');
        if (res.data && res.data.length > 0) {
          setAvailablePrefixes(res.data.map((p: any) => p.name));
        }
      } catch (e) {
        console.error('Failed to load prefixes:', e);
      }
    }
    loadPrefixes();
  }, []);

  const openCreateModal = useCallback((defaultClassroom?: string, nextStudentNumber: number = 1) => {
    setEditingStudent(null);
    setPrefixMode('นาย');
    setCustomPrefix('');
    setFormData({
      ...INITIAL_FORM_DATA,
      student_number: nextStudentNumber,
      classroom: defaultClassroom && defaultClassroom !== 'all' ? defaultClassroom : 'ม.4/1',
    });
    setIsModalOpen(true);
  }, []);

  const openEditModal = useCallback((student: Student) => {
    setEditingStudent(student);
    const isStdPrefix = availablePrefixes.includes(student.title);
    setPrefixMode(isStdPrefix ? student.title : 'other');
    setCustomPrefix(isStdPrefix ? '' : student.title);
    setFormData({
      student_code: student.student_code,
      student_number: student.student_number,
      title: student.title,
      first_name: student.first_name,
      last_name: student.last_name,
      classroom: student.classroom,
      gender: student.gender,
      guardian_name: student.guardian_name || '',
      guardian_phone: student.guardian_phone || '',
      status: student.status,
    });
    setIsModalOpen(true);
  }, [availablePrefixes]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingStudent(null);
  }, []);

  const updateField = useCallback(<K extends keyof StudentFormData>(key: K, value: StudentFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const submitForm = useCallback(async (e: React.FormEvent, onSuccess: () => void) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const finalTitle = prefixMode === 'other' ? customPrefix.trim() : prefixMode;
      const payload = {
        ...formData,
        title: finalTitle,
      };

      if (editingStudent) {
        await api.updateStudent(editingStudent.id, payload);
      } else {
        await api.createStudent(payload);
      }

      setIsModalOpen(false);
      onSuccess();
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + (err?.message || 'ไม่สามารถบันทึกข้อมูลได้'));
    } finally {
      setSubmitting(false);
    }
  }, [prefixMode, customPrefix, formData, editingStudent]);

  return {
    isModalOpen,
    editingStudent,
    submitting,
    formData,
    prefixMode,
    customPrefix,
    availablePrefixes,
    setPrefixMode,
    setCustomPrefix,
    openCreateModal,
    openEditModal,
    closeModal,
    updateField,
    submitForm,
  };
}
