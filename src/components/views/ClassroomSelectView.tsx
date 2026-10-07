'use client';

import React, { useEffect, useState } from 'react';
import {
  GraduationCap,
  Layers,
  Plus,
  Users,
  Search,
  ArrowRight,
  Trash2,
  Calendar,
  LogOut,
  User,
  BookOpen,
  X,
  ShieldCheck,
  Edit2,
  Clock,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button, Select, LiquidWaveSpinner, CardSkeleton } from '@/components/ui';
import FlipDiskClock from '@/components/ui/FlipDiskClock';
import ScheduleManagementModal from './ScheduleManagementModal';

export const LEVEL_OPTIONS = [
  { value: 'มัธยมศึกษาปีที่ 1', label: 'มัธยมศึกษาปีที่ 1 (ม.1)' },
  { value: 'มัธยมศึกษาปีที่ 2', label: 'มัธยมศึกษาปีที่ 2 (ม.2)' },
  { value: 'มัธยมศึกษาปีที่ 3', label: 'มัธยมศึกษาปีที่ 3 (ม.3)' },
  { value: 'มัธยมศึกษาปีที่ 4', label: 'มัธยมศึกษาปีที่ 4 (ม.4)' },
  { value: 'มัธยมศึกษาปีที่ 5', label: 'มัธยมศึกษาปีที่ 5 (ม.5)' },
  { value: 'มัธยมศึกษาปีที่ 6', label: 'มัธยมศึกษาปีที่ 6 (ม.6)' },
  { value: 'ประถมศึกษาปีที่ 1', label: 'ประถมศึกษาปีที่ 1 (ป.1)' },
  { value: 'ประถมศึกษาปีที่ 2', label: 'ประถมศึกษาปีที่ 2 (ป.2)' },
  { value: 'ประถมศึกษาปีที่ 3', label: 'ประถมศึกษาปีที่ 3 (ป.3)' },
  { value: 'ประถมศึกษาปีที่ 4', label: 'ประถมศึกษาปีที่ 4 (ป.4)' },
  { value: 'ประถมศึกษาปีที่ 5', label: 'ประถมศึกษาปีที่ 5 (ป.5)' },
  { value: 'ประถมศึกษาปีที่ 6', label: 'ประถมศึกษาปีที่ 6 (ป.6)' },
  { value: 'ปวช.1', label: 'ปวช.1' },
  { value: 'ปวช.2', label: 'ปวช.2' },
  { value: 'ปวช.3', label: 'ปวช.3' },
  { value: 'ปวส.1', label: 'ปวส.1' },
  { value: 'ปวส.2', label: 'ปวส.2' },
];

function normalizeName(name?: string | null): string {
  if (!name) return '';
  return name
    .replace(/^(อาจารย์|อ\.|ครู|นาย|นางสาว|นาง|ดร\.|ผศ\.|รศ\.)\s*/i, '')
    .trim()
    .toLowerCase();
}

function isSamePerson(name1?: string | null, name2?: string | null): boolean {
  if (!name1 || !name2) return false;
  const n1 = normalizeName(name1);
  const n2 = normalizeName(name2);
  if (!n1 || !n2) return false;
  return n1 === n2 || n1.includes(n2) || n2.includes(n1);
}

// -------------------------------------------------------------
// Sub-component: Classroom Card
// -------------------------------------------------------------
interface ClassroomCardProps {
  classroom: any;
  activeSubject: any;
  isAdmin: boolean;
  onSelect: (name: string) => void;
  onEdit: (e: React.MouseEvent, c: any) => void;
  onDelete: (e: React.MouseEvent, id: number | string, name: string) => void;
}

function ClassroomCard({
  classroom: c,
  activeSubject,
  isAdmin,
  onSelect,
  onEdit,
  onDelete,
}: ClassroomCardProps) {
  return (
    <div
      onClick={() => onSelect(c.name)}
      className="group relative bg-white rounded-3xl border border-pink-100/90 hover:border-pink-400 hover:shadow-xl hover:shadow-pink-200/40 transition-all duration-200 p-6 flex flex-col justify-between space-y-5 shadow-xs cursor-pointer"
    >
      {/* Card Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight group-hover:text-pink-600 transition-colors">
              ห้อง {c.name}
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-100">
              {c.academic_year ? `ปี ${c.academic_year}` : 'ปีปัจจุบัน'}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {c.level || 'ระดับมัธยมศึกษา'}
          </p>
        </div>

        {/* Action Buttons: Show on Hover */}
        <div className="flex items-center gap-1">
          <Button
            onClick={(e) => onEdit(e, c)}
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-pink-600 hover:bg-pink-50 transition-all cursor-pointer"
            title="แก้ไขห้องเรียนและผู้รับผิดชอบ"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            onClick={(e) => onDelete(e, c.id, c.name)}
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
            title="ลบห้องเรียน"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Active Subject Badge */}
      {activeSubject && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-50/80 border border-pink-100 rounded-xl text-xs font-bold text-pink-700">
          <BookOpen className="w-3.5 h-3.5 text-pink-500 shrink-0" />
          <span className="truncate">สอนวิชา: {activeSubject.code} {activeSubject.name}</span>
        </div>
      )}

      {/* Card Stats */}
      <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100">
        <div className="space-y-0.5">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-pink-500" />
            นักเรียน
          </span>
          <span className="text-lg font-bold text-slate-900 block">
            {c.students_count || 0}{' '}
            <span className="text-xs font-normal text-slate-500">คน</span>
          </span>
        </div>

        <div className="space-y-0.5">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-sky-500" />
            ครูที่ปรึกษา
          </span>
          <span
            className="text-xs font-semibold text-slate-700 block truncate"
            title={c.advisor_name || 'ยังไม่ระบุ'}
          >
            {c.advisor_name || 'ยังไม่ระบุ'}
          </span>
        </div>
      </div>

      {/* Card Footer */}
      <div className="pt-2 border-t border-pink-50 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 group-hover:text-pink-600 transition-colors">
          {activeSubject ? `สอนวิชา ${activeSubject.code}` : 'คลิกเพื่อเปิดหน้าจัดการ'}
        </span>
        <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pink-50 text-pink-700 font-bold text-xs group-hover:bg-pink-600 group-hover:text-white transition-all shadow-xs">
          <span>{activeSubject ? 'เข้าสอนวิชานี้' : 'เข้าห้องเรียน'}</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Sub-component: Classroom Modal (Add & Edit)
// -------------------------------------------------------------
interface ClassroomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  editingClassroom: any | null;
  classForm: {
    name: string;
    level: string;
    room: string;
    academic_year: string;
    semester: string;
    advisor_name: string;
    selected_subject_ids: number[];
  };
  onChangeForm: (next: any) => void;
  teachers: any[];
  subjects: any[];
  isAdmin: boolean;
  currentTeacherFullName: string;
  currentUser: any;
  creating: boolean;
}

function ClassroomModal({
  isOpen,
  onClose,
  onSubmit,
  editingClassroom,
  classForm,
  onChangeForm,
  teachers,
  subjects,
  isAdmin,
  currentTeacherFullName,
  currentUser,
  creating,
}: ClassroomModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 z-50 animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-pink-100 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-pink-50 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center shadow-2xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {editingClassroom ? 'แก้ไขข้อมูลห้องเรียน' : 'เพิ่มห้องเรียนใหม่'}
              </h3>
              <p className="text-xs text-slate-500">
                {editingClassroom
                  ? 'ปรับปรุงข้อมูล ระดับชั้น ครูผู้รับผิดชอบ และรายวิชาที่เปิดสอน'
                  : 'สร้างห้องเรียนเพื่อเริ่มทำการสอนและเช็คชื่อ'}
              </p>
            </div>
          </div>
          <Button onClick={onClose} variant="ghost" size="icon" title="ปิด">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Modal Body: 2-column layout */}
        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Basic Information */}
            <div className="space-y-4 bg-slate-50/60 p-5 rounded-2xl border border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-pink-500" />
                ข้อมูลทั่วไปของห้องเรียน
              </h4>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  ชื่อห้องเรียน <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ม.4/1, ม.4/2 หรือ ป.2"
                  value={classForm.name}
                  onChange={(e) => onChangeForm({ ...classForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-pink-400 transition-all"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  ชื่อห้องต้องไม่ซ้ำกับห้องที่มีอยู่แล้ว
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 items-end">
                <Select
                  label="ระดับชั้น"
                  value={classForm.level}
                  onChange={(e) => onChangeForm({ ...classForm, level: e.target.value })}
                  options={LEVEL_OPTIONS}
                />
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ปีการศึกษา
                  </label>
                  <input
                    type="text"
                    placeholder="2569"
                    value={classForm.academic_year}
                    onChange={(e) => onChangeForm({ ...classForm, academic_year: e.target.value })}
                    className="w-full h-9 px-3.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-400 font-medium"
                  />
                </div>
              </div>

              {/* Advisor / Teacher in Charge */}
              {isAdmin ? (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      ครูที่ปรึกษา / ผู้รับผิดชอบ <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] font-semibold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                      สิทธิ์แอดมิน
                    </span>
                  </div>
                  <Select
                    value={classForm.advisor_name}
                    onChange={(e) => onChangeForm({ ...classForm, advisor_name: e.target.value })}
                    options={[
                      { value: '', label: '-- กรุณาเลือกครูผู้รับผิดชอบ --' },
                      ...teachers.map((t) => {
                        const fullName = `${t.prefix ? `${t.prefix} ` : ''}${t.name}`.trim();
                        const roleDisplay =
                          t.role?.display_name || (t.role?.name === 'teacher' ? 'ครูผู้สอน' : t.role?.name || '');
                        return {
                          value: fullName,
                          label: `${fullName}${roleDisplay ? ` (${roleDisplay})` : ''}`,
                        };
                      }),
                    ]}
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    ครูที่ปรึกษา / ผู้รับผิดชอบห้องเรียน
                  </label>
                  <div className="p-3 bg-white rounded-xl border border-pink-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-pink-500 text-white font-bold text-xs flex items-center justify-center">
                        {currentUser?.name?.charAt(0) || 'ค'}
                      </div>
                      <div>
                        <span className="text-[10px] text-pink-600 font-bold block">
                          บัญชีของคุณ
                        </span>
                        <span className="text-xs font-bold text-slate-900 block">
                          {currentTeacherFullName}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-pink-700 bg-pink-50 px-2 py-0.5 rounded-lg border border-pink-100">
                      อัตโนมัติ
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Teaching Subjects Selection */}
            <div className="space-y-3 bg-slate-50/60 p-5 rounded-2xl border border-slate-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-pink-500" />
                    รายวิชาที่สอนในห้องนี้
                  </h4>
                  <span className="text-[10px] font-bold text-pink-600 bg-pink-50 px-2.5 py-0.5 rounded-full border border-pink-100">
                    เลือกได้หลายวิชา
                  </span>
                </div>

                {subjects.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">ยังไม่มีรายวิชาในระบบ</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {subjects.map((s) => {
                      const subjId = Number(s.id);
                      const isChecked = classForm.selected_subject_ids.includes(subjId);
                      const isMy = isSamePerson(s.teacher_name, currentUser?.name);

                      return (
                        <label
                          key={s.id}
                          className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                            isChecked
                              ? 'bg-pink-50/90 text-pink-900 border-pink-300 shadow-2xs ring-1 ring-pink-300/40'
                              : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200/80'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const nextIds = e.target.checked
                                  ? [...classForm.selected_subject_ids, subjId]
                                  : classForm.selected_subject_ids.filter((id) => id !== subjId);
                                onChangeForm({ ...classForm, selected_subject_ids: nextIds });
                              }}
                              className="w-4 h-4 text-pink-600 rounded-md border-slate-300 focus:ring-pink-500 cursor-pointer"
                            />
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: s.color || '#db2777' }}
                            />
                            <div className="truncate">
                              <span className="font-extrabold mr-1.5">{s.code}</span>
                              <span className="font-medium text-slate-600">{s.name}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            {isMy && (
                              <span className="text-[10px] font-bold text-pink-700 bg-pink-100 px-1.5 py-0.5 rounded-md">
                                วิชาของคุณ
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400">
                              ({s.credit} นก.)
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-200/60">
                วิชาที่เลือกจะถูกเชื่อมโยงเป็นตารางสอนของห้องนี้ เพื่อให้ครูและแอดมินเข้าเช็คชื่อได้ทันที
              </p>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button type="button" onClick={onClose} variant="secondary">
              ยกเลิก
            </Button>
            <Button type="submit" variant="primary" loading={creating}>
              {creating
                ? editingClassroom
                  ? 'กำลังบันทึก...'
                  : 'กำลังสร้าง...'
                : editingClassroom
                ? 'บันทึกการแก้ไข'
                : 'สร้างห้องเรียน'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Main View: ClassroomSelectView
// -------------------------------------------------------------
interface ClassroomSelectViewProps {
  currentUser: any;
  onSelectClassroom: (classroomName: string, subjectId?: string) => void;
  onLogout: () => void;
  initialSubjectId?: string | null;
}

export default function ClassroomSelectView({
  currentUser,
  onSelectClassroom,
  onLogout,
  initialSubjectId,
}: ClassroomSelectViewProps) {
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialSubjectId || '');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State for adding/editing classroom
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);

  // Modal State for schedule management
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleActiveClassroom, setScheduleActiveClassroom] = useState<string>('');

  const isAdmin = currentUser?.role?.name === 'admin';
  const currentTeacherFullName = currentUser?.name
    ? `${currentUser?.prefix ? `${currentUser.prefix} ` : ''}${currentUser.name}`.trim()
    : 'ครูผู้สอน';

  const [classForm, setClassForm] = useState<{
    name: string;
    level: string;
    room: string;
    academic_year: string;
    semester: string;
    advisor_name: string;
    selected_subject_ids: number[];
  }>({
    name: '',
    level: 'มัธยมศึกษาปีที่ 4',
    room: '1',
    academic_year: '2569',
    semester: '1',
    advisor_name: isAdmin ? '' : currentTeacherFullName,
    selected_subject_ids: [],
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [crRes, uRes, sbRes] = await Promise.all([
        api.getClassrooms(),
        api.getUsers().catch(() => ({ data: [] })),
        api.getSubjects().catch(() => ({ data: [] })),
      ]);

      if (crRes.data) {
        setClassrooms(crRes.data);
      }
      if (uRes.data) {
        const teacherUsers = uRes.data.filter((u: any) => u.role?.name === 'teacher');
        setTeachers(teacherUsers.length > 0 ? teacherUsers : uRes.data);
      }
      if (sbRes.data) {
        const allSubjects: any[] = sbRes.data;
        if (isAdmin) {
          setSubjects(allSubjects);
        } else {
          // If teacher: show only subjects linked to this teacher via subject_user / user_id or matching teacher_name
          const userSubjectIds: number[] = (currentUser?.subjects || []).map((s: any) => s.id);
          const teacherAssignedSubjects = allSubjects.filter((s: any) => {
            const isLinkedById = userSubjectIds.includes(s.id) || s.user_id === currentUser?.id;
            const isLinkedByName = isSamePerson(s.teacher_name, currentUser?.name);
            const isPivotLinked = (s.teachers || []).some((t: any) => t.id === currentUser?.id);
            return isLinkedById || isLinkedByName || isPivotLinked;
          });
          setSubjects(teacherAssignedSubjects);
          if (!initialSubjectId && teacherAssignedSubjects.length > 0) {
            setSelectedSubjectId(String(teacherAssignedSubjects[0].id));
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAddModal = () => {
    setEditingClassroom(null);
    const defaultAdvisor = isAdmin
      ? teachers.length > 0
        ? `${teachers[0].prefix ? `${teachers[0].prefix} ` : ''}${teachers[0].name}`.trim()
        : ''
      : currentTeacherFullName;

    const defaultSubjIds: number[] = [];
    if (!isAdmin && currentUser?.name) {
      const mySubjs = subjects.filter((s) => isSamePerson(s.teacher_name, currentUser.name));
      defaultSubjIds.push(...mySubjs.map((s) => Number(s.id)));
    } else if (selectedSubjectId) {
      defaultSubjIds.push(Number(selectedSubjectId));
    }

    setClassForm({
      name: '',
      level: 'มัธยมศึกษาปีที่ 4',
      room: '1',
      academic_year: '2569',
      semester: '1',
      advisor_name: defaultAdvisor,
      selected_subject_ids: defaultSubjIds,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (e: React.MouseEvent, c: any) => {
    e.stopPropagation();
    setEditingClassroom(c);

    const existingSubjIds = (c.schedules || []).map((sc: any) => Number(sc.subject_id)).filter(Boolean);

    setClassForm({
      name: c.name,
      level: c.level || 'มัธยมศึกษาปีที่ 4',
      room: c.room || '1',
      academic_year: c.academic_year || '2569',
      semester: c.semester || '1',
      advisor_name: c.advisor_name || (isAdmin ? '' : currentTeacherFullName),
      selected_subject_ids: Array.from(new Set(existingSubjIds)) as number[],
    });
    setIsModalOpen(true);
  };

  const handleSaveClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.name.trim()) return;

    const roomVal = classForm.room || (classForm.name.includes('/') ? classForm.name.split('/')[1] : '1');
    const advisor = isAdmin
      ? classForm.advisor_name || currentTeacherFullName
      : currentTeacherFullName;

    const payload = {
      name: classForm.name.trim(),
      level: classForm.level || 'มัธยมศึกษาปีที่ 4',
      room: roomVal,
      academic_year: classForm.academic_year || '2569',
      semester: classForm.semester || '1',
      advisor_name: advisor,
      subject_ids: classForm.selected_subject_ids,
    };

    try {
      setCreating(true);
      if (editingClassroom) {
        await api.updateClassroom(editingClassroom.id, payload);
      } else {
        await api.createClassroom(payload);
      }
      setIsModalOpen(false);
      setEditingClassroom(null);
      await loadData();
    } catch (err: any) {
      alert((editingClassroom ? 'แก้ไขห้องเรียนไม่สำเร็จ: ' : 'สร้างห้องเรียนไม่สำเร็จ: ') + (err.message || 'เกิดข้อผิดพลาด'));
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteClassroom = async (e: React.MouseEvent, id: number | string, name: string) => {
    e.stopPropagation();
    if (!confirm(`ต้องการลบห้องเรียน "${name}" หรือไม่? ข้อมูลนักเรียนและตารางสอนจะได้รับผลกระทบ`)) return;

    try {
      await api.deleteClassroom(id);
      await loadData();
    } catch (err: any) {
      alert('ลบห้องเรียนไม่สำเร็จ: ' + err.message);
    }
  };

  // Today's day index (1 = Mon, 2 = Tue, ..., 7 = Sun)
  const currentDayOfWeek = (() => {
    const d = new Date().getDay();
    return d === 0 ? 7 : d; // 1 = Monday .. 7 = Sunday
  })();

  const activeSubject = subjects.find((s) => String(s.id) === String(selectedSubjectId));

  const filteredClassrooms = classrooms.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.advisor_name && c.advisor_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.level && c.level.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    // When a specific subject is selected:
    // Keep the classroom visible if:
    // 1) The classroom explicitly has this subject assigned in subject_ids/subjects
    // 2) Or it has any schedule matching this subject
    // 3) Or if no room has a schedule yet for this subject, show teacher's classrooms so they don't disappear
    if (selectedSubjectId && activeSubject) {
      const scheduledRooms: string[] = (activeSubject.schedules || []).map((sc: any) => sc.classroom);
      const hasInClassroomSchedules = (c.schedules || []).some(
        (sc: any) => String(sc.subject_id) === String(selectedSubjectId)
      );
      const hasAssignedSubject = (c.subjects || []).some(
        (s: any) => String(s.id) === String(selectedSubjectId)
      );

      // If scheduled in this room or assigned to this room
      if (scheduledRooms.includes(c.name) || hasInClassroomSchedules || hasAssignedSubject) {
        return true;
      }

      // Fallback: If this room is advised by this teacher or teacher teaches in this room,
      // allow teacher to still see it even if Monday was just deleted!
      const isAdvisor = isSamePerson(c.advisor_name, currentUser?.name);
      return isAdvisor;
    }

    if (isAdmin) return true;

    // If viewing all subjects:
    // Show classrooms where teacher is advisor or teaches any subject
    const isAdvisor = isSamePerson(c.advisor_name, currentUser?.name);
    const teacherSubjectIds = subjects.map((s) => s.id);

    const teachesInThisClassroom = (c.schedules || []).some((sc: any) => {
      const isSubjIdMatch = teacherSubjectIds.includes(sc.subject_id);
      const isTeacherNameMatch = isSamePerson(sc.subject?.teacher_name, currentUser?.name);
      return isSubjIdMatch || isTeacherNameMatch;
    });

    const isAssignedToRoom = (c.subjects || []).some((s: any) => teacherSubjectIds.includes(s.id));

    return isAdvisor || teachesInThisClassroom || isAssignedToRoom;
  });

  const totalStudents = classrooms.reduce((acc, c) => acc + (c.students_count || 0), 0);

  return (
    <div className="min-h-screen w-screen bg-slate-50/60 flex flex-col selection:bg-pink-500 selection:text-white">
      {/* Top Navbar */}
      <header className="h-16 bg-white border-b border-pink-100/80 px-6 sm:px-10 flex items-center justify-between shrink-0 shadow-xs z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-400 text-white flex items-center justify-center font-bold shadow-sm shadow-pink-200">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-base leading-tight flex items-center gap-2">
              ClassMe
              <span className="text-[10px] font-semibold bg-pink-50 text-pink-700 px-2 py-0.5 rounded-full border border-pink-100 hidden sm:inline-block">
                ระบบจัดการชั้นเรียน
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">ระบบบริหารจัดการชั้นเรียนและเช็คชื่ออัจฉริยะ</p>
          </div>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-3">
          <Button
            onClick={() => {
              // Pick the first filtered classroom as the active context, or empty if none
              const firstRoom = filteredClassrooms[0]?.name || classrooms[0]?.name || '';
              setScheduleActiveClassroom(firstRoom);
              setIsScheduleModalOpen(true);
            }}
            variant="accent"
            size="sm"
            icon={<Clock className="w-3.5 h-3.5" />}
            title="จัดการตารางสอนและคาบเรียน"
          >
            <span>จัดการตารางสอน</span>
          </Button>

          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-sky-50 text-sky-700 border border-sky-200/80 rounded-xl text-xs font-semibold">
            <Calendar className="w-3.5 h-3.5 text-sky-600" />
            <span>ภาคเรียนที่ 1/2569</span>
          </div>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-100">
            <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-xs">
              {currentUser?.name?.charAt(0) || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-slate-800 leading-tight">
                {currentUser?.prefix ? `${currentUser.prefix} ` : ''}{currentUser?.name || 'ผู้ใช้งาน'}
              </div>
              <div className="text-[10px] font-medium text-pink-600 flex items-center gap-1">
                {isAdmin ? <ShieldCheck className="w-3 h-3 inline" /> : null}
                {currentUser?.role?.display_name || 'ครูผู้สอน'}
              </div>
            </div>

            <Button
              onClick={onLogout}
              variant="ghost"
              size="sm"
              className="text-slate-500 hover:text-rose-600 ml-1"
              icon={<LogOut className="w-3.5 h-3.5" />}
              title="ออกจากระบบ"
            >
              <span className="hidden sm:inline">ออก</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Welcome Hero Banner with Polished Layout & FlipDiskClock */}
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-pink-600 via-rose-500 to-pink-500 text-white p-6 sm:p-7 shadow-lg shadow-pink-200/50">
          {/* Subtle Ambient Decorative Glows */}
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 right-1/4 w-48 h-48 bg-rose-400/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col xl:flex-row items-center justify-between gap-6">
            {/* Left: Heading & Welcome Message */}
            <div className="space-y-2 text-center xl:text-left max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold text-white shadow-xs">
                <GraduationCap className="w-3.5 h-3.5 text-white/90" />
                <span>ยินดีต้อนรับสู่ระบบจัดการชั้นเรียน ClassMe</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                <span className="text-[11px] text-emerald-100 font-bold">
                  {['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'][new Date().getDay()]}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                เลือกห้องเรียนที่ต้องการจัดการ
              </h2>
              <p className="text-pink-100 text-xs sm:text-sm font-medium leading-relaxed">
                คลิกเลือกรายวิชาและห้องเรียนด้านล่างเพื่อเปิดหน้าจัดการชั้นเรียน เช็คชื่อรายคาบ สแกนใบเช็คชื่อด้วย AI และดูรายชื่อนักเรียน
              </p>
            </div>

            {/* Right: Electromechanical Clock & Stat Metrics */}
            <div className="flex flex-col sm:flex-row items-center gap-3.5 sm:gap-4 shrink-0">
              {/* Electromechanical Clock */}
              <FlipDiskClock className="shrink-0 drop-shadow-md" />

              {/* Quick Stat Counter Cards */}
              <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                <div className="bg-white/15 hover:bg-white/20 transition-colors backdrop-blur-md rounded-2xl p-3 text-center border border-white/25 min-w-[76px] sm:min-w-[84px] shadow-xs">
                  <span className="text-xl sm:text-2xl font-black block leading-none">{subjects.length}</span>
                  <span className="text-[10px] block text-pink-100 font-medium mt-1">วิชาที่สอน</span>
                </div>
                <div className="bg-white/15 hover:bg-white/20 transition-colors backdrop-blur-md rounded-2xl p-3 text-center border border-white/25 min-w-[76px] sm:min-w-[84px] shadow-xs">
                  <span className="text-xl sm:text-2xl font-black block leading-none">{filteredClassrooms.length}</span>
                  <span className="text-[10px] block text-pink-100 font-medium mt-1">ห้องเรียน</span>
                </div>
                <div className="bg-white/15 hover:bg-white/20 transition-colors backdrop-blur-md rounded-2xl p-3 text-center border border-white/25 min-w-[76px] sm:min-w-[84px] shadow-xs">
                  <span className="text-xl sm:text-2xl font-black block leading-none">
                    {filteredClassrooms.reduce((acc, c) => acc + (c.students_count || 0), 0)}
                  </span>
                  <span className="text-[10px] block text-pink-100 font-medium mt-1">นักเรียนรวม</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Action Bar */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-pink-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-1">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาห้องเรียน หรือชื่อครูที่ปรึกษา..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:bg-white transition-all font-medium"
              />
            </div>

            {/* Clean Subject Dropdown using UI Select component */}
            {subjects.length > 0 && (
              <div className="w-full sm:w-80">
                <Select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  options={[
                    {
                      value: '',
                      label: isAdmin
                        ? `ทุกรายวิชา (${classrooms.length} ห้อง)`
                        : `วิชาที่รับผิดชอบทั้งหมด (${subjects.length} วิชา)`,
                    },
                    ...subjects.map((s) => {
                      const scheduledRooms = (s.schedules || []).map((sc: any) => sc.classroom);
                      const roomCount = scheduledRooms.length;
                      return {
                        value: String(s.id),
                        label: `${s.code} ${s.name} (${roomCount} ห้อง)`,
                      };
                    }),
                  ]}
                  className="w-full font-bold text-slate-700 bg-slate-50 border-slate-200 focus:bg-white"
                />
              </div>
            )}
          </div>

          <Button
            onClick={handleOpenAddModal}
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
          >
            เพิ่มห้องเรียนใหม่
          </Button>
        </div>

        {/* Classroom Cards Grid */}
        {loading ? (
          <div className="space-y-8 py-6">
            <div className="flex flex-col items-center justify-center p-6 bg-white/70 backdrop-blur-sm rounded-3xl border border-pink-100 shadow-xs">
              <LiquidWaveSpinner
                size="md"
                words={[
                  'กำลังเตรียมห้องเรียน...',
                  'กำลังโหลดรายชื่อและวิชาที่สอน...',
                  'กำลังจัดเตรียมตารางเรียน...',
                ]}
              />
            </div>
            <CardSkeleton count={6} />
          </div>
        ) : filteredClassrooms.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-pink-200/80 p-8 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-pink-50 text-pink-500 flex items-center justify-center mx-auto">
              <Layers className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {selectedSubjectId
                  ? `ไม่พบห้องเรียนที่สอนวิชา ${activeSubject?.code || ''}`
                  : searchTerm
                  ? 'ไม่พบห้องเรียนที่ค้นหา'
                  : 'ยังไม่มีห้องเรียนในระบบ'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {selectedSubjectId
                  ? 'วิชานี้อาจจะยังไม่ได้กำหนดตารางสอนลงห้องเรียน หรือคุณไม่มีชั่วโมงสอนในวิชานี้'
                  : searchTerm
                  ? 'ลองพิมพ์ค้นหาด้วยคำอื่น หรือกดล้างการค้นหา'
                  : 'เริ่มต้นโดยการกดปุ่ม "เพิ่มห้องเรียนใหม่" เพื่อสร้างชั้นเรียนแรกของคุณ'}
              </p>
            </div>
            <Button
              onClick={() => {
                if (selectedSubjectId) setSelectedSubjectId('');
                else if (searchTerm) setSearchTerm('');
                else handleOpenAddModal();
              }}
              variant="primary"
              size="sm"
            >
              {selectedSubjectId ? 'ดูห้องเรียนทุกวิชา' : searchTerm ? 'ล้างคำค้นหา' : 'เพิ่มห้องเรียนแรก'}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClassrooms.map((c) => (
              <ClassroomCard
                key={c.id}
                classroom={c}
                activeSubject={activeSubject}
                isAdmin={isAdmin}
                onSelect={(name) => onSelectClassroom(name, selectedSubjectId || undefined)}
                onEdit={handleOpenEditModal}
                onDelete={handleDeleteClassroom}
              />
            ))}
          </div>
        )}
      </main>

      {/* Classroom Modal Component */}
      <ClassroomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveClassroom}
        editingClassroom={editingClassroom}
        classForm={classForm}
        onChangeForm={setClassForm}
        teachers={teachers}
        subjects={subjects}
        isAdmin={isAdmin}
        currentTeacherFullName={currentTeacherFullName}
        currentUser={currentUser}
        creating={creating}
      />

      {/* Schedule Management Modal */}
      <ScheduleManagementModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        currentUser={currentUser}
        isAdmin={isAdmin}
        classrooms={classrooms}
        subjects={subjects}
        teachers={teachers}
        activeClassroom={scheduleActiveClassroom}
        onSaved={loadData}
      />
    </div>
  );
}
