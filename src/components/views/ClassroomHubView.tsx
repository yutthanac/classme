'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  UserCheck,
  Users,
  Calendar,
  CheckCircle2,
  Save,
  Phone,
  Download,
  UploadCloud,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useApp } from '@/context/AppContext';
import { Button, PageContainer, Select, LiquidWaveSpinner, Skeleton, Clock } from '@/components/ui';
import ClassroomCalendar from './ClassroomCalendar';
import StudentImportModal from './StudentImportModal';
import ImportSpeedDial, { ImportOptionType } from '@/components/ui/import-speed-dial';

interface ClassroomHubViewProps {
  classroomName: string;
  onBack: () => void;
  currentUser?: any;
}

type HubTab = 'overview' | 'attendance' | 'students' | 'schedules' | 'ai-scan' | 'export';
type AttendanceStatus = 'present' | 'late' | 'leave' | 'absent';

export default function ClassroomHubView({ classroomName, onBack, currentUser }: ClassroomHubViewProps) {
  const router = useRouter();
  const { setSelectedClassroom, setSelectedSubjectId: setAppSubjectId } = useApp();
  const [activeHubTab, setActiveHubTab] = useState<HubTab>('overview');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importInitialTab, setImportInitialTab] = useState<'file' | 'camera' | 'paste'>('file');
  const [importAutoTrigger, setImportAutoTrigger] = useState<'file' | 'camera' | 'image' | null>(null);

  const handleSelectImportOption = (option: ImportOptionType) => {
    if (option === 'file') {
      setImportInitialTab('file');
      setImportAutoTrigger('file');
    } else if (option === 'image') {
      setImportInitialTab('camera');
      setImportAutoTrigger('image');
    } else if (option === 'camera') {
      setImportInitialTab('camera');
      setImportAutoTrigger('camera');
    } else {
      setImportInitialTab('paste');
      setImportAutoTrigger(null);
    }
    setIsImportModalOpen(true);
  };

  const [classroomData, setClassroomData] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [attendanceSessions, setAttendanceSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Attendance Form State
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [period, setPeriod] = useState<string>('คาบ 1-2');
  const [topic, setTopic] = useState<string>('');
  const [attendanceRecords, setAttendanceRecords] = useState<
    Array<{
      id: number;
      student_number: number;
      student_code: string;
      title: string;
      full_name: string;
      status: AttendanceStatus;
      remark: string;
    }>
  >([]);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [attendanceSuccess, setAttendanceSuccess] = useState<string | null>(null);

  // Export State
  const [exportSubjectId] = useState<string>('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        setLoading(true);
        const [crList, stList, sbList, scList, sessList] = await Promise.all([
          api.getClassrooms(),
          api.getStudents({ classroom: classroomName }),
          api.getSubjects(),
          api.getSchedules({ classroom: classroomName }),
          api.getAttendanceSessions({ classroom: classroomName }),
        ]);

        if (!mounted) return;
        const found = crList.data?.find((c: any) => c.name === classroomName);
        if (found) setClassroomData(found);

        if (sessList.data?.data) {
          setAttendanceSessions(sessList.data.data);
        } else if (Array.isArray(sessList.data)) {
          setAttendanceSessions(sessList.data);
        }

        const isAdmin = currentUser?.role?.name === 'admin';
        const currentUserName = currentUser?.name;

        if (sbList.data?.length) {
          const allSubs: any[] = sbList.data;
          const userSubIds: number[] = (currentUser?.subjects || []).map((s: any) => s.id);

          const teacherSubs = isAdmin
            ? allSubs
            : allSubs.filter((s: any) => {
                if (userSubIds.includes(s.id) || s.user_id === currentUser?.id) return true;
                if (s.teachers && s.teachers.some((t: any) => t.id === currentUser?.id)) return true;
                return currentUserName && s.teacher_name && s.teacher_name.includes(currentUserName);
              });

          const finalSubs = teacherSubs.length > 0 ? teacherSubs : allSubs;
          setSubjects(finalSubs);
          setSelectedSubjectId(String(finalSubs[0].id));
        }

        if (scList.data) {
          const allScheds: any[] = scList.data;
          const userSubIds: number[] = (currentUser?.subjects || []).map((s: any) => s.id);

          const filteredScheds = isAdmin
            ? allScheds
            : allScheds.filter((sc: any) => {
                if (userSubIds.includes(sc.subject_id)) return true;
                if (currentUser?.id && sc.subject?.user_id === currentUser.id) return true;
                if (currentUserName && sc.subject?.teacher_name && sc.subject.teacher_name.includes(currentUserName)) return true;
                return false;
              });

          setSchedules(filteredScheds);
        }

        if (stList.data) {
          setStudents(stList.data);
          setAttendanceRecords(
            stList.data.map((s: any) => ({
              id: s.id,
              student_number: s.student_number,
              student_code: s.student_code,
              title: s.title || 'นาย',
              full_name: s.full_name || `${s.first_name} ${s.last_name}`,
              status: 'present',
              remark: '',
            }))
          );
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
  }, [classroomName]);

  const handleUpdateStatus = (id: number, status: AttendanceStatus) => {
    setAttendanceRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
  };

  const handleSetAllStatus = (status: AttendanceStatus) => {
    setAttendanceRecords((prev) =>
      prev.map((r) => ({ ...r, status }))
    );
  };

  const handleSaveAttendance = async () => {
    if (!selectedSubjectId) {
      alert('กรุณาเลือกวิชาที่สอน');
      return;
    }

    try {
      setSavingAttendance(true);
      const payload = {
        subject_id: Number(selectedSubjectId),
        classroom: classroomName,
        date,
        period,
        topic: topic || undefined,
        students: attendanceRecords.map((s) => ({
          student_id: s.id,
          status: s.status,
          remark: s.remark || undefined,
        })),
      };

      const res = await api.saveAttendance(payload);
      if (res.status === 'success') {
        setAttendanceSuccess(`บันทึกการเช็คชื่อห้อง ${classroomName} เรียบร้อยแล้ว!`);
        setTimeout(() => setAttendanceSuccess(null), 3000);
      }
    } catch (err: any) {
      alert('บันทึกไม่สำเร็จ: ' + err.message);
    } finally {
      setSavingAttendance(false);
    }
  };

  const handleExportExcel = () => {
    try {
      setExporting(true);
      const downloadUrl = api.getExportExcelUrl(classroomName, exportSubjectId || undefined);
      window.open(downloadUrl, '_blank');
    } catch (err: any) {
      alert('ส่งออกไฟล์ Excel ไม่สำเร็จ: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleReloadStudents = async () => {
    try {
      const res = await api.getStudents({ classroom: classroomName });
      if (res.data) setStudents(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  // If activeHubTab is ever set to 'attendance', redirect to the dedicated attendance page
  useEffect(() => {
    if (activeHubTab === 'attendance') {
      setSelectedClassroom(classroomName);
      if (selectedSubjectId) setAppSubjectId(String(selectedSubjectId));
      const params = new URLSearchParams();
      if (classroomName) params.set('classroom', classroomName);
      if (selectedSubjectId) params.set('subject_id', String(selectedSubjectId));
      if (date) params.set('date', date);
      if (period) params.set('period', period);
      router.push(`/attendance?${params.toString()}`);
    }
  }, [activeHubTab, classroomName, selectedSubjectId, date, period, router, setSelectedClassroom, setAppSubjectId]);

  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-pink-100 p-8 shadow-xs flex flex-col items-center justify-center">
            <LiquidWaveSpinner
              size="md"
              words={[
                `กำลังโหลดข้อมูลห้องเรียน ${classroomName}...`,
                'กำลังเชื่อมต่อตารางสอนและรายชื่อนักเรียน...',
                'กำลังจัดเตรียมสถิติการเข้าเรียน...',
              ]}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-64 w-full rounded-3xl" />
              <Skeleton className="h-40 w-full rounded-3xl" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-44 w-full rounded-3xl" />
              <Skeleton className="h-60 w-full rounded-3xl" />
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  const presentCount = attendanceRecords.filter((r) => r.status === 'present').length;
  const lateCount = attendanceRecords.filter((r) => r.status === 'late').length;
  const leaveCount = attendanceRecords.filter((r) => r.status === 'leave').length;
  const absentCount = attendanceRecords.filter((r) => r.status === 'absent').length;

  return (
    <PageContainer>
      {/* Top Banner: ห้องเรียนที่เลือก & ปุ่มย้อนกลับ */}
      <div className="bg-white rounded-3xl border border-pink-100 p-6 shadow-xs space-y-4 relative z-30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={onBack}
              variant="secondary"
              size="sm"
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              กลับหน้าแดชบอร์ด
            </Button>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  ชั้นเรียนห้อง {classroomName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-pink-50 text-pink-700 border border-pink-200">
                  นักเรียน {students.length} คน
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                ครูที่ปรึกษา: <span className="text-slate-700 font-semibold">{classroomData?.advisor_name || 'ยังไม่ระบุ'}</span> • ปีการศึกษา {classroomData?.academic_year || '2569'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Clock />
            <ImportSpeedDial onSelectOption={handleSelectImportOption} />
            <Button
              onClick={handleExportExcel}
              variant="accent"
              size="sm"
              loading={exporting}
              icon={<Download className="w-3.5 h-3.5" />}
            >
              ส่งออก Excel ห้องนี้
            </Button>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {attendanceSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between text-xs font-semibold animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{attendanceSuccess}</span>
          </div>
          <button onClick={() => setAttendanceSuccess(null)} className="text-emerald-500 hover:text-emerald-700">✕</button>
        </div>
      )}

      {/* TAB 0: ภาพรวมห้อง (ปฏิทินเกือบเต็มจอ + ฝั่งขวาสรุปคาบ/ชั่วโมง) */}
      {activeHubTab === 'overview' && (
        <ClassroomCalendar
          classroomName={classroomName}
          schedules={schedules}
          attendanceSessions={attendanceSessions}
          studentsCount={students.length}
          onGoToAttendance={(subjectId, targetDate, targetPeriod) => {
            setSelectedClassroom(classroomName);
            if (subjectId) {
              setAppSubjectId(String(subjectId));
              setSelectedSubjectId(String(subjectId));
            }
            const params = new URLSearchParams();
            if (classroomName) params.set('classroom', classroomName);
            if (subjectId) params.set('subject_id', String(subjectId));
            if (targetDate) params.set('date', targetDate);
            if (targetPeriod) params.set('period', targetPeriod);
            router.push(`/attendance?${params.toString()}`);
          }}
          onGoToStudents={() => setActiveHubTab('students')}
        />
      )}

      {/* TAB 1: บันทึกการเข้าเรียน (Attendance Checking) */}
      {activeHubTab === 'attendance' && (
        <div className="space-y-6">
          {/* Controls Bar: วิชา, วันที่, คาบ */}
          <div className="bg-white p-5 rounded-2xl border border-pink-100 shadow-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  วิชาที่สอนในคาบนี้ <span className="text-rose-500">*</span>
                </label>
                <Select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full"
                >
                  {subjects.map((sb) => (
                    <option key={sb.id} value={sb.id}>
                      {sb.code} - {sb.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  วันที่
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  คาบเรียน
                </label>
                <input
                  type="text"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  placeholder="เช่น คาบ 1-2 (08:30-10:10)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  หัวข้อ / เนื้อหาการสอน (ถ้ามี)
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="เช่น บทที่ 2 ระบบนิเวศ"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>
            </div>

            {/* Quick Batch Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">เลือกทั้งหมด:</span>
                <Button onClick={() => handleSetAllStatus('present')} variant="secondary" size="sm">
                  มาเรียนทั้งหมด
                </Button>
                <Button onClick={() => handleSetAllStatus('late')} variant="secondary" size="sm">
                  สายทั้งหมด
                </Button>
              </div>

              {/* Status Summary & Save Button */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded-lg bg-pink-50 text-pink-700 font-bold border border-pink-100">
                    มา: {presentCount}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 font-bold border border-amber-100">
                    สาย: {lateCount}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-sky-50 text-sky-700 font-bold border border-sky-100">
                    ลา: {leaveCount}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 font-bold border border-rose-100">
                    ขาด: {absentCount}
                  </span>
                </div>

                <Button
                  onClick={handleSaveAttendance}
                  variant="primary"
                  loading={savingAttendance}
                  icon={<Save className="w-4 h-4" />}
                >
                  บันทึกการเช็คชื่อ
                </Button>
              </div>
            </div>
          </div>

          {/* Student Attendance List Table */}
          <div className="bg-white rounded-2xl border border-pink-100 overflow-hidden shadow-xs">
            {attendanceRecords.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                ยังไม่มีนักเรียนในห้อง {classroomName}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50/75 border-b border-pink-50 text-slate-500 font-semibold">
                    <tr>
                      <th className="py-3 px-4 w-14 text-center">เลขที่</th>
                      <th className="py-3 px-4 w-24">รหัส</th>
                      <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                      <th className="py-3 px-4 text-center w-80">สถานะการเข้าเรียน</th>
                      <th className="py-3 px-4">หมายเหตุ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attendanceRecords.map((st) => (
                      <tr key={st.id} className="hover:bg-pink-50/20 transition-colors">
                        <td className="py-3 px-4 text-center font-bold text-slate-600">
                          {st.student_number}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">{st.student_code}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          <span className="text-pink-600 mr-1">{st.title}</span>
                          {st.full_name}
                        </td>
                        <td className="py-3 px-4">
                          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl max-w-xs mx-auto">
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(st.id, 'present')}
                              className={`py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                st.status === 'present'
                                  ? 'bg-pink-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              มา
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(st.id, 'late')}
                              className={`py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                st.status === 'late'
                                  ? 'bg-amber-500 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              สาย
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(st.id, 'leave')}
                              className={`py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                st.status === 'leave'
                                  ? 'bg-sky-500 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              ลา
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(st.id, 'absent')}
                              className={`py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                st.status === 'absent'
                                  ? 'bg-rose-500 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              ขาด
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={st.remark}
                            onChange={(e) => {
                              const v = e.target.value;
                              setAttendanceRecords((prev) =>
                                prev.map((item) => (item.id === st.id ? { ...item, remark: v } : item))
                              );
                            }}
                            placeholder="บันทึกเพิ่มเติม..."
                            className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-pink-400"
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
      )}

      {/* TAB 2: รายชื่อนักเรียนในห้องนี้ (Students Tab) */}
      {activeHubTab === 'students' && (
        <div className="bg-white rounded-2xl border border-pink-100 shadow-xs relative z-20">
          <div className="p-5 border-b border-pink-50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">
              รายชื่อนักเรียนห้อง {classroomName} ทั้งหมด ({students.length} คน)
            </h3>
            <ImportSpeedDial onSelectOption={handleSelectImportOption} />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50/75 border-b border-pink-50 text-slate-500 font-semibold">
                <tr>
                  <th className="py-3 px-4 w-14 text-center">เลขที่</th>
                  <th className="py-3 px-4 w-28">รหัสประจำตัว</th>
                  <th className="py-3 px-4">คำนำหน้า & ชื่อ-สกุล</th>
                  <th className="py-3 px-4 w-20 text-center">เพศ</th>
                  <th className="py-3 px-4">ผู้ปกครอง</th>
                  <th className="py-3 px-4 w-32">เบอร์ติดต่อ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((st) => (
                  <tr key={st.id} className="hover:bg-pink-50/20 transition-colors">
                    <td className="py-3 px-4 text-center font-bold text-slate-600">{st.student_number}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{st.student_code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      <span className="text-pink-600 mr-1">{st.title}</span>
                      {st.first_name} {st.last_name}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-500">
                      {st.gender === 'male' ? 'ชาย' : 'หญิง'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{st.guardian_name || '-'}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {st.guardian_phone ? (
                        <a
                          href={`tel:${st.guardian_phone}`}
                          className="hover:text-sky-600 flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3 text-sky-400" />
                          <span>{st.guardian_phone}</span>
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ตารางสอนประจำห้องนี้ (Schedules Tab) */}
      {activeHubTab === 'schedules' && (
        <div className="bg-white rounded-2xl border border-pink-100 overflow-hidden shadow-xs p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-800">
            ตารางเรียน & คาบสอนประจำห้อง {classroomName}
          </h3>

          {schedules.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
              ยังไม่มีตารางสอนสำหรับห้องนี้ สามารถเพิ่มได้ที่แท็บ &quot;วิชาและตารางเรียน&quot;
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {schedules.map((sc) => (
                <div
                  key={sc.id}
                  className="p-4 rounded-xl border border-pink-100/80 bg-slate-50/50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-pink-100 text-pink-700">
                      วัน{['', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์'][sc.day_of_week] || 'เรียน'}
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      {sc.start_time} - {sc.end_time}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {sc.subject?.name || 'รายวิชา'} ({sc.subject?.code})
                  </h4>
                  <p className="text-xs text-slate-500">
                    สถานที่: <span className="font-semibold text-slate-700">{sc.room_number || '-'}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* Multi-Modal Student Import Modal */}
      <StudentImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={handleReloadStudents}
        defaultClassroom={classroomName}
        initialTab={importInitialTab}
        autoTrigger={importAutoTrigger}
      />
    </PageContainer>
  );
}
