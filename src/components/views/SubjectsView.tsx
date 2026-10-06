'use client';

import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Calendar,
  Layers,
  Plus,
  Trash2,
  Clock,
  MapPin,
  X,
  User,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button, PageContainer, Select, LiquidWaveSpinner, CardSkeleton } from '@/components/ui';

const LEVEL_OPTIONS = [
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

interface SubjectsViewProps {
  initialClassroom?: string | null;
  currentUser?: any;
}

export default function SubjectsView({ initialClassroom, currentUser }: SubjectsViewProps = {}) {
  const [tab, setTab] = useState<'subjects' | 'classrooms' | 'schedules'>('subjects');

  const [subjects, setSubjects] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = currentUser?.role?.name === 'admin';
  const currentTeacherFullName = currentUser?.name
    ? `${currentUser?.prefix ? `${currentUser.prefix} ` : ''}${currentUser.name}`.trim()
    : 'ครูผู้สอน';

  // Subject Modal
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [subjectForm, setSubjectForm] = useState({
    code: '',
    name: '',
    teacher_name: '',
    user_id: '' as string | number,
    credit: 1.5,
    color: '#db2777',
  });

  // Schedule Modal
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    subject_id: '',
    classroom: initialClassroom || 'ม.4/1',
    day_of_week: 1,
    start_time: '08:30',
    end_time: '10:10',
    room_number: 'ห้อง 412',
  });

  // Classroom Modal
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [creatingClass, setCreatingClass] = useState(false);
  const [classForm, setClassForm] = useState({
    name: '',
    level: 'มัธยมศึกษาปีที่ 4',
    room: '1',
    academic_year: '2569',
    semester: '1',
    advisor_name: isAdmin ? '' : currentTeacherFullName,
  });

  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        setLoading(true);
        const [sbRes, crRes, scRes, uRes] = await Promise.all([
          api.getSubjects(),
          api.getClassrooms(),
          api.getSchedules(),
          api.getUsers().catch(() => ({ data: [] })),
        ]);
        if (!mounted) return;
        if (sbRes.data) setSubjects(sbRes.data);
        if (crRes.data) setClassrooms(crRes.data);
        if (scRes.data) setSchedules(scRes.data);
        if (uRes.data) {
          const teacherUsers = uRes.data.filter((u: any) => u.role?.name === 'teacher');
          setTeachers(teacherUsers.length > 0 ? teacherUsers : uRes.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [sbRes, crRes, scRes, uRes] = await Promise.all([
        api.getSubjects(),
        api.getClassrooms(),
        api.getSchedules(),
        api.getUsers().catch(() => ({ data: [] })),
      ]);
      if (sbRes.data) setSubjects(sbRes.data);
      if (crRes.data) setClassrooms(crRes.data);
      if (scRes.data) setSchedules(scRes.data);
      if (uRes.data) {
        const teacherUsers = uRes.data.filter((u: any) => u.role?.name === 'teacher');
        setTeachers(teacherUsers.length > 0 ? teacherUsers : uRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedTeacher = teachers.find((t) => String(t.id) === String(subjectForm.user_id));
      const payload: any = {
        code: subjectForm.code.trim(),
        name: subjectForm.name.trim(),
        credit: Number(subjectForm.credit),
        color: subjectForm.color,
      };

      if (subjectForm.user_id) {
        payload.user_id = Number(subjectForm.user_id);
        payload.teacher_ids = [Number(subjectForm.user_id)];
        payload.teacher_name = selectedTeacher
          ? `${selectedTeacher.prefix ? `${selectedTeacher.prefix} ` : ''}${selectedTeacher.name}`.trim()
          : subjectForm.teacher_name;
      } else {
        payload.teacher_name = subjectForm.teacher_name || currentTeacherFullName;
      }

      await api.createSubject(payload);
      setIsSubjectModalOpen(false);
      setSubjectForm({ code: '', name: '', teacher_name: '', user_id: '', credit: 1.5, color: '#db2777' });
      loadAll();
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSchedule({
        ...scheduleForm,
        subject_id: Number(scheduleForm.subject_id),
      });
      setIsScheduleModalOpen(false);
      loadAll();
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    if (!confirm('ต้องการลบคาบเรียนนี้?')) return;
    try {
      await api.deleteSchedule(id);
      loadAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.name.trim()) return;
    try {
      setCreatingClass(true);
      const roomVal = classForm.room || (classForm.name.includes('/') ? classForm.name.split('/')[1] : '1');
      const advisor = isAdmin
        ? (classForm.advisor_name || currentTeacherFullName)
        : currentTeacherFullName;

      await api.createClassroom({
        name: classForm.name.trim(),
        level: classForm.level || 'มัธยมศึกษาปีที่ 4',
        room: roomVal,
        academic_year: classForm.academic_year || '2569',
        semester: classForm.semester || '1',
        advisor_name: advisor,
      });
      setIsClassModalOpen(false);
      setClassForm({
        name: '',
        level: 'มัธยมศึกษาปีที่ 4',
        room: '1',
        academic_year: '2569',
        semester: '1',
        advisor_name: isAdmin ? '' : currentTeacherFullName,
      });
      loadAll();
    } catch (err: any) {
      alert('เพิ่มห้องเรียนไม่สำเร็จ: ' + err.message);
    } finally {
      setCreatingClass(false);
    }
  };

  const handleDeleteClassroom = async (id: number | string, name: string) => {
    if (!confirm(`ต้องการลบห้องเรียน "${name}" หรือไม่?`)) return;
    try {
      await api.deleteClassroom(id);
      loadAll();
    } catch (err: any) {
      alert('ลบห้องเรียนไม่สำเร็จ: ' + err.message);
    }
  };

  const days = [
    { num: 1, name: 'วันจันทร์' },
    { num: 2, name: 'วันอังคาร' },
    { num: 3, name: 'วันพุธ' },
    { num: 4, name: 'วันพฤหัสบดี' },
    { num: 5, name: 'วันศุกร์' },
  ];

  return (
    <PageContainer>
      {/* Tab Switcher - White 60% with Pink 30% Active & Sky Blue 10% */}
      <div className="flex items-center justify-between border-b border-pink-100 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab('subjects')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              tab === 'subjects'
                ? 'bg-pink-600 text-white shadow-xs shadow-pink-200'
                : 'text-slate-600 hover:text-slate-900 bg-white border border-pink-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>รายวิชา ({subjects.length})</span>
          </button>

          <button
            onClick={() => setTab('classrooms')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              tab === 'classrooms'
                ? 'bg-pink-600 text-white shadow-xs shadow-pink-200'
                : 'text-slate-600 hover:text-slate-900 bg-white border border-pink-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>ห้องเรียน ({classrooms.length})</span>
          </button>

          <button
            onClick={() => setTab('schedules')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              tab === 'schedules'
                ? 'bg-pink-600 text-white shadow-xs shadow-pink-200'
                : 'text-slate-600 hover:text-slate-900 bg-white border border-pink-100'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>ตารางเรียนรายสัปดาห์</span>
          </button>
        </div>

        {tab === 'subjects' && (
          <Button
            onClick={() => setIsSubjectModalOpen(true)}
            variant="primary"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มรายวิชา</span>
          </Button>
        )}

        {tab === 'classrooms' && (
          <Button
            onClick={() => setIsClassModalOpen(true)}
            variant="primary"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มห้องเรียน</span>
          </Button>
        )}

        {tab === 'schedules' && (
          <Button
            onClick={() => {
              if (subjects.length > 0) {
                setScheduleForm((prev) => ({ ...prev, subject_id: String(subjects[0].id) }));
              }
              setIsScheduleModalOpen(true);
            }}
            variant="primary"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มตารางสอน</span>
          </Button>
        )}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-pink-100 p-8 shadow-xs flex flex-col items-center justify-center">
            <LiquidWaveSpinner
              size="md"
              words={[
                'กำลังโหลดข้อมูลรายวิชาและตารางสอน...',
                'กำลังประมวลผลชั้นเรียน...',
                'กำลังจัดเตรียมข้อมูล...',
              ]}
            />
          </div>
          <CardSkeleton count={6} />
        </div>
      ) : (
        <>
          {/* Tab 1: Subjects List */}
          {tab === 'subjects' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((sb) => (
            <div
              key={sb.id}
              className="bg-white p-5 rounded-2xl border border-pink-100/80 hover:shadow-sm hover:shadow-pink-100 transition-all space-y-3 shadow-xs"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold bg-pink-50 text-pink-700 border border-pink-100">
                    {sb.code}
                  </span>
                  <h3 className="font-bold text-slate-800 text-sm mt-1.5">{sb.name}</h3>
                </div>
                <span className="text-xs font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                  {sb.credit} หน่วยกิต
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-pink-400" />
                  <span>{sb.teacher_name}</span>
                </div>
                <span className="text-slate-400">บันทึก {sb.sessions_count || 0} คาบ</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Classrooms List */}
      {tab === 'classrooms' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classrooms.map((cr) => (
            <div
              key={cr.id}
              className="bg-white p-5 rounded-2xl border border-pink-100/80 space-y-3 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base">{cr.name}</h3>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                  นักเรียน {cr.students_count || 0} คน
                </span>
              </div>

              <div className="text-xs text-slate-500 space-y-1">
                <div>ระดับชั้น: {cr.level || '-'}</div>
                <div>ปีการศึกษา: {cr.academic_year} (ภาคเรียนที่ {cr.semester})</div>
                <div>ครูที่ปรึกษา: <span className="font-semibold text-slate-700">{cr.advisor_name || '-'}</span></div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                <Button
                  onClick={() => handleDeleteClassroom(cr.id, cr.name)}
                  variant="ghost"
                  size="icon"
                  className="text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                  title="ลบห้องเรียน"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Schedules Grid */}
      {tab === 'schedules' && (
        <div className="space-y-4">
          {days.map((d) => {
            const daySchedules = schedules.filter((s) => s.day_of_week === d.num);
            return (
              <div key={d.num} className="bg-white rounded-2xl border border-pink-100/70 overflow-hidden shadow-xs">
                <div className="bg-pink-50/40 px-4 py-2.5 border-b border-pink-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">{d.name}</span>
                  <span className="text-[11px] text-pink-600 font-semibold">{daySchedules.length} คาบสอน</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {daySchedules.length === 0 ? (
                    <div className="p-4 text-xs text-slate-400 italic">ไม่มีตารางเรียนในวันนี้</div>
                  ) : (
                    daySchedules.map((sc) => (
                      <div
                        key={sc.id}
                        className="p-3.5 px-4 flex items-center justify-between hover:bg-pink-50/20"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                            <Clock className="w-3.5 h-3.5 text-sky-600" />
                            <span className="font-mono">
                              {sc.start_time} - {sc.end_time}
                            </span>
                          </div>

                          <div>
                            <span className="text-xs font-bold text-slate-800">
                              {sc.subject?.code} {sc.subject?.name}
                            </span>
                            <span className="ml-2 text-xs text-pink-600 font-semibold">
                              (ห้อง {sc.classroom})
                            </span>
                          </div>

                          {sc.room_number && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-400">
                              <MapPin className="w-3 h-3 text-sky-500" />
                              <span>{sc.room_number}</span>
                            </div>
                          )}
                        </div>

                        <Button
                          onClick={() => handleDeleteSchedule(sc.id)}
                          variant="ghost"
                          size="icon"
                          className="hover:text-rose-600"
                          title="ลบคาบเรียน"
                          aria-label="ลบคาบเรียน"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
          </div>
        )}
        </>
      )}

      {/* Add Subject Modal */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-pink-100 w-full max-w-sm">
            <div className="p-4 border-b border-pink-50 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900">เพิ่มรายวิชาใหม่</h3>
              <Button
                onClick={() => setIsSubjectModalOpen(false)}
                variant="ghost"
                size="icon"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <form onSubmit={handleCreateSubject} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">รหัสวิชา</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ว31102"
                  value={subjectForm.code}
                  onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-pink-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อวิชา</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ชีววิทยา 1"
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-pink-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">อาจารย์ผู้สอน</label>
                {teachers.length > 0 ? (
                  <Select
                    value={subjectForm.user_id}
                    onChange={(e) => {
                      const uId = e.target.value;
                      const teacher = teachers.find((t) => String(t.id) === String(uId));
                      setSubjectForm({
                        ...subjectForm,
                        user_id: uId,
                        teacher_name: teacher
                          ? `${teacher.prefix ? `${teacher.prefix} ` : ''}${teacher.name}`.trim()
                          : '',
                      });
                    }}
                    options={[
                      { value: '', label: '-- เลือกอาจารย์ผู้สอน --' },
                      ...teachers.map((t) => ({
                        value: String(t.id),
                        label: `${t.prefix ? `${t.prefix} ` : ''}${t.name} (${t.email})`,
                      })),
                    ]}
                    className="w-full text-xs"
                  />
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="เช่น อ.ประสิทธิ์ ศรีวิชัย"
                    value={subjectForm.teacher_name}
                    onChange={(e) => setSubjectForm({ ...subjectForm, teacher_name: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-pink-400"
                  />
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">หน่วยกิต</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={subjectForm.credit}
                  onChange={(e) => setSubjectForm({ ...subjectForm, credit: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-pink-400"
                />
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <Button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  variant="secondary"
                  size="sm"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                >
                  บันทึก
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Schedule Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-pink-100 w-full max-w-sm">
            <div className="p-4 border-b border-pink-50 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900">เพิ่มตารางสอน</h3>
              <Button
                onClick={() => setIsScheduleModalOpen(false)}
                variant="ghost"
                size="icon"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <form onSubmit={handleCreateSchedule} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">วิชา</label>
                <Select
                  value={scheduleForm.subject_id}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, subject_id: e.target.value })}
                  className="w-full"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} {s.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ห้องเรียน</label>
                <Select
                  value={scheduleForm.classroom}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, classroom: e.target.value })}
                  className="w-full"
                >
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">วันในสัปดาห์</label>
                <Select
                  value={scheduleForm.day_of_week}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, day_of_week: Number(e.target.value) })}
                  className="w-full"
                >
                  {days.map((d) => (
                    <option key={d.num} value={d.num}>
                      {d.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">เวลาเริ่ม</label>
                  <input
                    type="text"
                    placeholder="08:30"
                    value={scheduleForm.start_time}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, start_time: e.target.value })}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-pink-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">เวลาสิ้นสุด</label>
                  <input
                    type="text"
                    placeholder="10:10"
                    value={scheduleForm.end_time}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, end_time: e.target.value })}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-pink-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ห้องเรียน / สถานที่</label>
                <input
                  type="text"
                  placeholder="เช่น ห้อง 412"
                  value={scheduleForm.room_number}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, room_number: e.target.value })}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-pink-400"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <Button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  variant="secondary"
                  size="sm"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                >
                  บันทึก
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Classroom Modal */}
      {isClassModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-pink-100 w-full max-w-sm">
            <div className="p-4 border-b border-pink-50 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900">เพิ่มห้องเรียนใหม่</h3>
              <Button
                onClick={() => setIsClassModalOpen(false)}
                variant="ghost"
                size="icon"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <form onSubmit={handleCreateClassroom} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อห้องเรียน <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ม.4/3 หรือ ม.5/1"
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-pink-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 items-end">
                <Select
                  label="ระดับชั้น"
                  size="sm"
                  value={classForm.level}
                  onChange={(e) => setClassForm({ ...classForm, level: e.target.value })}
                  options={LEVEL_OPTIONS}
                />
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ปีการศึกษา</label>
                  <input
                    type="text"
                    placeholder="2569"
                    value={classForm.academic_year}
                    onChange={(e) => setClassForm({ ...classForm, academic_year: e.target.value })}
                    className="w-full h-8 px-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-pink-400 font-medium"
                  />
                </div>
              </div>
              {isAdmin ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ครูที่ปรึกษา / ผู้รับผิดชอบห้องเรียน <span className="text-rose-500">*</span>
                  </label>
                  <Select
                    size="sm"
                    value={classForm.advisor_name}
                    onChange={(e) => setClassForm({ ...classForm, advisor_name: e.target.value })}
                    options={[
                      { value: '', label: '-- กรุณาเลือกครูผู้รับผิดชอบ --' },
                      ...teachers.map((t) => {
                        const fullName = `${t.prefix ? `${t.prefix} ` : ''}${t.name}`.trim();
                        const roleDisplay = t.role?.display_name || (t.role?.name === 'teacher' ? 'ครูผู้สอน' : t.role?.name || '');
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ครูที่ปรึกษา / ผู้รับผิดชอบห้องเรียน
                  </label>
                  <div className="p-2.5 bg-pink-50/70 border border-pink-100 rounded-xl flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{currentTeacherFullName}</span>
                    <span className="text-[10px] font-semibold text-pink-600 bg-white px-2 py-0.5 rounded-md border border-pink-200">
                      ล็อกเป็นตัวเอง
                    </span>
                  </div>
                </div>
              )}
              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <Button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  variant="secondary"
                  size="sm"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={creatingClass}
                >
                  บันทึก
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
