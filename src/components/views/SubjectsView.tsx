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

export default function SubjectsView() {
  const [tab, setTab] = useState<'subjects' | 'classrooms' | 'schedules'>('subjects');

  const [subjects, setSubjects] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Subject Modal
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [subjectForm, setSubjectForm] = useState({
    code: '',
    name: '',
    teacher_name: '',
    credit: 1.5,
    color: '#db2777',
  });

  // Schedule Modal
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    subject_id: '',
    classroom: 'ม.4/1',
    day_of_week: 1,
    start_time: '08:30',
    end_time: '10:10',
    room_number: 'ห้อง 412',
  });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [sbRes, crRes, scRes] = await Promise.all([
        api.getSubjects(),
        api.getClassrooms(),
        api.getSchedules(),
      ]);
      if (sbRes.data) setSubjects(sbRes.data);
      if (crRes.data) setClassrooms(crRes.data);
      if (scRes.data) setSchedules(scRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSubject(subjectForm);
      setIsSubjectModalOpen(false);
      setSubjectForm({ code: '', name: '', teacher_name: '', credit: 1.5, color: '#db2777' });
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

  const days = [
    { num: 1, name: 'วันจันทร์' },
    { num: 2, name: 'วันอังคาร' },
    { num: 3, name: 'วันพุธ' },
    { num: 4, name: 'วันพฤหัสบดี' },
    { num: 5, name: 'วันศุกร์' },
  ];

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
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
          <button
            onClick={() => setIsSubjectModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-semibold shadow-xs shadow-pink-200"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มรายวิชา</span>
          </button>
        )}

        {tab === 'schedules' && (
          <button
            onClick={() => {
              if (subjects.length > 0) {
                setScheduleForm((prev) => ({ ...prev, subject_id: String(subjects[0].id) }));
              }
              setIsScheduleModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-semibold shadow-xs shadow-pink-200"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มตารางสอน</span>
          </button>
        )}
      </div>

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

                        <button
                          onClick={() => handleDeleteSchedule(sc.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-lg"
                          title="ลบคาบเรียน"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Subject Modal */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-pink-100 w-full max-w-sm">
            <div className="p-4 border-b border-pink-50 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900">เพิ่มรายวิชาใหม่</h3>
              <button
                onClick={() => setIsSubjectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">ครูผู้สอน</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น อ.ประสิทธิ์ ศรีวิชัย"
                  value={subjectForm.teacher_name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, teacher_name: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-pink-400"
                />
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
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-pink-600 text-white rounded-xl shadow-xs shadow-pink-200"
                >
                  บันทึก
                </button>
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
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateSchedule} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">วิชา</label>
                <select
                  value={scheduleForm.subject_id}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, subject_id: e.target.value })}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-pink-400"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ห้องเรียน</label>
                <select
                  value={scheduleForm.classroom}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, classroom: e.target.value })}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-pink-400"
                >
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">วันในสัปดาห์</label>
                <select
                  value={scheduleForm.day_of_week}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, day_of_week: Number(e.target.value) })}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-pink-400"
                >
                  {days.map((d) => (
                    <option key={d.num} value={d.num}>
                      {d.name}
                    </option>
                  ))}
                </select>
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
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-pink-600 text-white rounded-xl shadow-xs shadow-pink-200"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
