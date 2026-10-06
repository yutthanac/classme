'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
  Info,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useApp } from '@/context/AppContext';
import { Button, PageContainer, Select } from '@/components/ui';

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

interface AttendanceCheckViewProps {
  initialClassroom?: string | null;
  currentUser?: any;
}

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

export default function AttendanceCheckView({
  initialClassroom,
  currentUser: propCurrentUser,
}: AttendanceCheckViewProps = {}) {
  const { currentUser: appContextUser, selectedSubjectId: appContextSubjId } = useApp();
  const currentUser = propCurrentUser || appContextUser;
  const isAdmin = currentUser?.role?.name === 'admin';

  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(appContextSubjId || '');
  const [selectedClassroom, setSelectedClassroom] = useState<string>(initialClassroom || '');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [period, setPeriod] = useState<string>('คาบ 1-2');
  const [topic, setTopic] = useState<string>('');
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Compute available classrooms for a given subject
  const getAvailableClassrooms = (
    subjId: string,
    crList = classrooms,
    sbList = subjects,
    user = currentUser
  ) => {
    if (!subjId || !crList.length) return crList;

    const subj = sbList.find((s) => String(s.id) === String(subjId));
    const scheduledRooms: string[] = (subj?.schedules || []).map((sc: any) => sc.classroom);
    const userIsAdmin = user?.role?.name === 'admin';

    // 1. Admin sees all classrooms that have this subject scheduled (or all classrooms in school)
    if (userIsAdmin) {
      if (scheduledRooms.length > 0) {
        const filtered = crList.filter((c) => scheduledRooms.includes(c.name));
        return filtered.length > 0 ? filtered : crList;
      }
      return crList;
    }

    // 2. Teacher: only show classrooms where the teacher actually teaches this subject
    const isMySubject = isSamePerson(subj?.teacher_name, user?.name);
    let matchedRooms: any[] = [];

    if (isMySubject && scheduledRooms.length > 0) {
      // The teacher teaches this subject -> show classrooms from the schedule
      matchedRooms = crList.filter((c) => scheduledRooms.includes(c.name));
    } else {
      // If not the primary subject teacher, check if this teacher is advisor of any room
      matchedRooms = crList.filter((c) => {
        const isAdvisor = isSamePerson(c.advisor_name, user?.name);
        const inSchedule = scheduledRooms.includes(c.name);
        return (isAdvisor && inSchedule) || isAdvisor;
      });
    }

    // Fallback if no direct match found (e.g. newly created subject or demo data)
    if (matchedRooms.length === 0) {
      const advisorRooms = crList.filter((c) => isSamePerson(c.advisor_name, user?.name));
      if (advisorRooms.length > 0) {
        matchedRooms = advisorRooms;
      } else if (scheduledRooms.length > 0) {
        matchedRooms = crList.filter((c) => scheduledRooms.includes(c.name));
      } else {
        matchedRooms = crList;
      }
    }

    return matchedRooms;
  };

  // Load classrooms & subjects on mount
  useEffect(() => {
    async function loadMeta() {
      try {
        const [crRes, sbRes] = await Promise.all([
          api.getClassrooms(),
          api.getSubjects(),
        ]);
        const crList = crRes.data || [];
        const sbList = sbRes.data || [];
        setClassrooms(crList);
        setSubjects(sbList);

        if (sbList.length > 0) {
          // Find initial default subject:
          let defaultSubj = sbList[0];
          if (appContextSubjId && sbList.some((s: any) => String(s.id) === String(appContextSubjId))) {
            defaultSubj = sbList.find((s: any) => String(s.id) === String(appContextSubjId));
          } else if (!isAdmin && currentUser) {
            const mySubj = sbList.find((s: any) => isSamePerson(s.teacher_name, currentUser.name));
            if (mySubj) defaultSubj = mySubj;
          }
          const defaultSubjId = String(defaultSubj.id);
          setSelectedSubjectId(defaultSubjId);

          // Find available classrooms for this default subject
          const availableRooms = getAvailableClassrooms(defaultSubjId, crList, sbList, currentUser);
          if (initialClassroom && availableRooms.some((r: any) => r.name === initialClassroom)) {
            setSelectedClassroom(initialClassroom);
          } else if (availableRooms.length > 0) {
            setSelectedClassroom(availableRooms[0].name);
          } else if (crList.length > 0) {
            setSelectedClassroom(crList[0].name);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadMeta();
  }, [currentUser?.name, isAdmin]);

  // Handle user changing the Subject
  const handleSubjectChange = (newSubjId: string) => {
    setSelectedSubjectId(newSubjId);
    const availableRooms = getAvailableClassrooms(newSubjId);

    // If current selected classroom is in the available rooms, keep it
    const isCurrentValid = availableRooms.some((r: any) => r.name === selectedClassroom);
    if (!isCurrentValid) {
      if (availableRooms.length > 0) {
        setSelectedClassroom(availableRooms[0].name);
      } else {
        setSelectedClassroom('');
      }
    }
  };

  // Recompute available classrooms for current selectedSubjectId
  const availableClassrooms = useMemo(() => {
    return getAvailableClassrooms(selectedSubjectId);
  }, [selectedSubjectId, classrooms, subjects, currentUser?.name, isAdmin]);

  // Current subject object
  const currentSubject = useMemo(() => {
    return subjects.find((s) => String(s.id) === String(selectedSubjectId));
  }, [selectedSubjectId, subjects]);

  // Categorize subjects for teacher (My Subjects vs Other Subjects)
  const { myTeachingSubjects, otherSubjects } = useMemo(() => {
    if (isAdmin || !currentUser) {
      return { myTeachingSubjects: subjects, otherSubjects: [] };
    }
    const my: any[] = [];
    const other: any[] = [];
    subjects.forEach((s) => {
      if (isSamePerson(s.teacher_name, currentUser.name)) {
        my.push(s);
      } else {
        other.push(s);
      }
    });
    return { myTeachingSubjects: my, otherSubjects: other };
  }, [subjects, currentUser?.name, isAdmin]);

  // Load students when selectedClassroom changes
  useEffect(() => {
    if (!selectedClassroom) {
      setStudents([]);
      return;
    }
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
    if (!selectedSubjectId || !selectedClassroom) {
      alert('กรุณาเลือกรายวิชาและห้องเรียนก่อนบันทึก');
      return;
    }
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
    <PageContainer>
      {/* Configuration Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-pink-100 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Subject Selector (FIRST) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-pink-600" />
                <span>รายวิชา</span>
              </span>
              {currentSubject && (
                <span className="text-[10px] text-pink-600 font-normal truncate max-w-[130px]">
                  ผู้สอน: {currentSubject.teacher_name}
                </span>
              )}
            </label>
            <Select
              value={selectedSubjectId}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="w-full"
            >
              {!isAdmin && myTeachingSubjects.length > 0 ? (
                <>
                  <optgroup label="วิชาที่คุณสอน">
                    {myTeachingSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </optgroup>
                  {otherSubjects.length > 0 && (
                    <optgroup label="รายวิชาอื่นๆ">
                      {otherSubjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.code} - {s.name} ({s.teacher_name})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </>
              ) : (
                subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} - {s.name} ({s.teacher_name})
                  </option>
                ))
              )}
            </Select>
          </div>

          {/* 2. Classroom Selector (FILTERED by selected subject & role) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-pink-600" />
                <span>ห้องเรียน</span>
              </span>
              {isAdmin ? (
                <span className="text-[10px] text-pink-600 font-normal">
                  ห้องของวิชานี้ ({availableClassrooms.length} ห้อง)
                </span>
              ) : (
                <span className="text-[10px] text-pink-600 font-normal">
                  เฉพาะห้องที่คุณสอน
                </span>
              )}
            </label>
            <Select
              value={selectedClassroom}
              onChange={(e) => setSelectedClassroom(e.target.value)}
              className="w-full"
              disabled={availableClassrooms.length === 0}
            >
              {availableClassrooms.length === 0 ? (
                <option value="" disabled>ไม่มีห้องเรียนที่สอนวิชานี้</option>
              ) : (
                availableClassrooms.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name} ({c.students_count || 0} คน)
                  </option>
                ))
              )}
            </Select>
          </div>

          {/* 3. Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-pink-600" />
              <span>วันที่</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
          </div>

          {/* 4. Period */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-pink-600" />
              <span>คาบเรียน</span>
            </label>
            <Select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full"
            >
              <option value="คาบ 1-2">คาบ 1-2 (08:30 - 10:10)</option>
              <option value="คาบ 3-4">คาบ 3-4 (10:20 - 12:00)</option>
              <option value="คาบ 5-6">คาบ 5-6 (13:00 - 14:40)</option>
              <option value="คาบ 7-8">คาบ 7-8 (14:40 - 16:20)</option>
            </Select>
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
          <div className="text-xs text-slate-400 font-medium ml-2">
            ทั้งหมด {students.length} คน
          </div>
        </div>

        {/* Bulk Action Buttons & Save */}
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl font-medium border border-emerald-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>{saveSuccess}</span>
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAllStatus('present')}
            className="text-sky-700 border-sky-200 hover:bg-sky-50/60"
          >
            <CheckCheck className="w-3.5 h-3.5 mr-1" />
            <span>เช็คมาทั้งหมด</span>
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={saving || students.length === 0}
            onClick={handleSave}
          >
            <Save className="w-3.5 h-3.5 mr-1" />
            <span>{saving ? 'กำลังบันทึก...' : 'บันทึกการเช็คชื่อ'}</span>
          </Button>
        </div>
      </div>

      {/* Student List Table */}
      <div className="bg-white rounded-2xl border border-pink-100/70 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">กำลังโหลดรายชื่อนักเรียน...</div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            {selectedClassroom ? 'ไม่พบรายชื่อนักเรียนในห้องเรียนนี้' : 'กรุณาเลือกรายวิชาและห้องเรียนเพื่อเริ่มเช็คชื่อ'}
          </div>
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
                        {/* มา */}
                        <button
                          type="button"
                          onClick={() => updateStudentStatus(st.id, 'present')}
                          className={`flex items-center justify-center gap-1 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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
                          className={`flex items-center justify-center gap-1 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            st.status === 'late'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>สาย</span>
                        </button>

                        {/* ลา */}
                        <button
                          type="button"
                          onClick={() => updateStudentStatus(st.id, 'leave')}
                          className={`flex items-center justify-center gap-1 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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
                          className={`flex items-center justify-center gap-1 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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
    </PageContainer>
  );
}
