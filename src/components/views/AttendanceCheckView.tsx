'use client';

import React, { useEffect, useState } from 'react';
import {
  Check,
  Clock,
  FileText,
  X,
  CheckCheck,
  Save,
  CheckCircle2,
  Calendar,
  Layers,
  BookOpen,
} from 'lucide-react';
import { api } from '@/lib/api';

type AttendanceStatus = 'present' | 'late' | 'leave' | 'absent';

interface StudentRecord {
  id: number;
  student_number: number;
  student_code: string;
  title: string;
  full_name: string;
  classroom: string;
  status: AttendanceStatus;
  remark: string;
}

export default function AttendanceCheckView() {
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<string>('ม.4/1');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [period, setPeriod] = useState<string>('คาบ 1-2');
  const [topic, setTopic] = useState<string>('');
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Load classrooms & subjects
  useEffect(() => {
    async function loadMeta() {
      try {
        const [crRes, sbRes] = await Promise.all([
          api.getClassrooms(),
          api.getSubjects(),
        ]);
        if (crRes.data?.length) {
          setClassrooms(crRes.data);
          if (!selectedClassroom) setSelectedClassroom(crRes.data[0].name);
        }
        if (sbRes.data?.length) {
          setSubjects(sbRes.data);
          setSelectedSubjectId(String(sbRes.data[0].id));
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadMeta();
  }, []);

  // Load students when selectedClassroom changes
  useEffect(() => {
    if (!selectedClassroom) return;
    loadStudents();
  }, [selectedClassroom]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const res = await api.getStudents({ classroom: selectedClassroom });
      if (res.data) {
        setStudents(
          res.data.map((st: any) => ({
            id: st.id,
            student_number: st.student_number,
            student_code: st.student_code,
            title: st.title || 'นาย',
            full_name: st.full_name,
            classroom: st.classroom,
            status: 'present',
            remark: '',
          }))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const setAllStatus = (status: AttendanceStatus) => {
    setStudents((prev) =>
      prev.map((s) => ({
        ...s,
        status,
      }))
    );
  };

  const updateStudentStatus = (id: number, status: AttendanceStatus) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    );
  };

  const updateStudentRemark = (id: number, remark: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, remark } : s))
    );
  };

  const handleSave = async () => {
    if (!selectedSubjectId || !selectedClassroom) return;
    try {
      setSaving(true);
      setSaveSuccess(null);
      const payload = {
        subject_id: Number(selectedSubjectId),
        classroom: selectedClassroom,
        date,
        period,
        topic: topic || 'การจัดการเรียนรู้ประจำวัน',
        records: students.map((s) => ({
          student_id: s.id,
          status: s.status,
          remark: s.remark,
        })),
      };

      const res = await api.saveAttendance(payload);
      if (res.status === 'success') {
        setSaveSuccess('บันทึกข้อมูลการเช็คชื่อเข้าสู่ระบบเรียบร้อยแล้ว');
        setTimeout(() => setSaveSuccess(null), 4000);
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการบันทึก: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const presentCount = students.filter((s) => s.status === 'present').length;
  const lateCount = students.filter((s) => s.status === 'late').length;
  const leaveCount = students.filter((s) => s.status === 'leave').length;
  const absentCount = students.filter((s) => s.status === 'absent').length;

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Configuration Header Card - White 60% with Pink 30% border */}
      <div className="bg-white p-6 rounded-2xl border border-pink-100 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Classroom Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">ห้องเรียน</label>
            <select
              value={selectedClassroom}
              onChange={(e) => setSelectedClassroom(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-pink-400"
            >
              {classrooms.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name} ({c.students_count || 0} คน)
                </option>
              ))}
            </select>
          </div>

          {/* Subject Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">รายวิชา</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-pink-400"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">วันที่</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
          </div>

          {/* Period */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">คาบเรียน</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-pink-400"
            >
              <option value="คาบ 1-2">คาบ 1-2 (08:30 - 10:10)</option>
              <option value="คาบ 3-4">คาบ 3-4 (10:20 - 12:00)</option>
              <option value="คาบ 5-6">คาบ 5-6 (13:00 - 14:40)</option>
              <option value="คาบ 7-8">คาบ 7-8 (14:40 - 16:20)</option>
            </select>
          </div>
        </div>

        {/* Topic / Note */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            หัวข้อการเรียนรู้ / เรื่องที่สอน (ถ้ามี)
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="เช่น บทที่ 2 กฎการเคลื่อนที่ของนิวตัน"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
        </div>
      </div>

      {/* Live Counter & Bulk Actions Bar */}
      <div className="bg-white p-4 rounded-2xl border border-pink-100 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        {/* Status Counters */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-50 text-pink-700 border border-pink-100 text-xs font-bold">
            <Check className="w-3.5 h-3.5" />
            <span>มา: {presentCount}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 text-xs font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>สาย: {lateCount}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 text-sky-700 border border-sky-100 text-xs font-bold">
            <FileText className="w-3.5 h-3.5" />
            <span>ลา: {leaveCount}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-100 text-xs font-bold">
            <X className="w-3.5 h-3.5" />
            <span>ขาด: {absentCount}</span>
          </div>
          <div className="text-xs text-slate-400 pl-2 border-l border-slate-200 hidden sm:block">
            ทั้งหมด {students.length} คน
          </div>
        </div>

        {/* Fast Action Buttons (Pink 30% primary & Sky 10% accent) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAllStatus('present')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5 text-sky-600" />
            <span>เช็คมาทั้งหมด</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saving || students.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-pink-600 hover:bg-pink-700 text-white transition-colors shadow-xs shadow-pink-200 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'กำลังบันทึก...' : 'บันทึกการเช็คชื่อ'}</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {saveSuccess && (
        <div className="p-4 bg-pink-50 border border-pink-200 rounded-2xl flex items-center gap-3 text-pink-900 text-xs font-medium">
          <CheckCircle2 className="w-5 h-5 text-pink-600 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Student List Table */}
      <div className="bg-white rounded-2xl border border-pink-100/70 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">กำลังโหลดรายชื่อนักเรียน...</div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">ไม่พบรายชื่อนักเรียนในห้องเรียนนี้</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-pink-50 text-slate-500 font-semibold">
                  <th className="py-3 px-4 w-16 text-center">เลขที่</th>
                  <th className="py-3 px-4 w-28">รหัส</th>
                  <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                  <th className="py-3 px-4 w-80 text-center">สถานะการเข้าเรียน</th>
                  <th className="py-3 px-4">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((st) => (
                  <tr key={st.id} className="hover:bg-pink-50/20 transition-colors">
                    <td className="py-3 px-4 text-center font-medium text-slate-600">{st.student_number}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{st.student_code}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      <span className="text-pink-600 font-bold mr-1">{st.title}</span>
                      {st.full_name}
                    </td>
                    <td className="py-3 px-4">
                      {/* 4 Status Segmented Buttons */}
                      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl max-w-xs mx-auto">
                        {/* มา - Pink 30% */}
                        <button
                          type="button"
                          onClick={() => updateStudentStatus(st.id, 'present')}
                          className={`flex items-center justify-center gap-1 py-1 rounded-lg text-xs font-semibold transition-all ${
                            st.status === 'present'
                              ? 'bg-pink-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                          <span>มา</span>
                        </button>

                        {/* สาย */}
                        <button
                          type="button"
                          onClick={() => updateStudentStatus(st.id, 'late')}
                          className={`flex items-center justify-center gap-1 py-1 rounded-lg text-xs font-semibold transition-all ${
                            st.status === 'late'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>สาย</span>
                        </button>

                        {/* ลา - Sky Blue 10% */}
                        <button
                          type="button"
                          onClick={() => updateStudentStatus(st.id, 'leave')}
                          className={`flex items-center justify-center gap-1 py-1 rounded-lg text-xs font-semibold transition-all ${
                            st.status === 'leave'
                              ? 'bg-sky-500 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <FileText className="w-3 h-3" />
                          <span>ลา</span>
                        </button>

                        {/* ขาด */}
                        <button
                          type="button"
                          onClick={() => updateStudentStatus(st.id, 'absent')}
                          className={`flex items-center justify-center gap-1 py-1 rounded-lg text-xs font-semibold transition-all ${
                            st.status === 'absent'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <X className="w-3 h-3" />
                          <span>ขาด</span>
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        placeholder="ระบุหมายเหตุ (ถ้ามี)"
                        value={st.remark}
                        onChange={(e) => updateStudentRemark(st.id, e.target.value)}
                        className="w-full px-2.5 py-1 text-xs bg-transparent border border-slate-200 focus:bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-400 text-slate-700"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
