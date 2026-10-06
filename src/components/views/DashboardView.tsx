'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  UserCheck,
  ScanLine,
  FileSpreadsheet,
  PhoneCall,
  Calendar,
  Layers,
  Plus,
  GraduationCap,
  ArrowRight,
  X,
  Trash2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { TabType } from '../Sidebar';
import { Button, PageContainer } from '@/components/ui';

interface DashboardViewProps {
  setActiveTab: (tab: TabType) => void;
  onEnterClassroom?: (classroomName: string) => void;
}

export default function DashboardView({ setActiveTab, onEnterClassroom }: DashboardViewProps) {
  const [stats, setStats] = useState<any>(null);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State for Adding Classroom
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [creatingClass, setCreatingClass] = useState(false);
  const [classForm, setClassForm] = useState({
    name: '',
    level: 'มัธยมศึกษาปีที่ 4',
    room: '',
    academic_year: '2569',
    semester: '1',
    advisor_name: '',
  });

  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        setLoading(true);
        const [statsRes, crRes] = await Promise.all([
          api.getAttendanceStats(),
          api.getClassrooms(),
        ]);
        if (!mounted) return;
        if (statsRes.status === 'success') {
          setStats(statsRes.data);
        }
        if (crRes.data) {
          setClassrooms(crRes.data);
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

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, crRes] = await Promise.all([
        api.getAttendanceStats(),
        api.getClassrooms(),
      ]);
      if (statsRes.status === 'success') {
        setStats(statsRes.data);
      }
      if (crRes.data) {
        setClassrooms(crRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.name.trim()) return;

    try {
      setCreatingClass(true);
      const res = await api.createClassroom(classForm);
      if (res.status === 'success' || res.data) {
        setIsAddClassModalOpen(false);
        setClassForm({
          name: '',
          level: 'มัธยมศึกษาปีที่ 4',
          room: '',
          academic_year: '2569',
          semester: '1',
          advisor_name: '',
        });
        await loadDashboardData();
      }
    } catch (err: any) {
      alert('สร้างห้องเรียนไม่สำเร็จ: ' + (err.message || 'เกิดข้อผิดพลาด'));
    } finally {
      setCreatingClass(false);
    }
  };

  const handleDeleteClassroom = async (id: number | string, name: string) => {
    if (!confirm(`ต้องการลบห้องเรียน "${name}" หรือไม่? ข้อมูลตารางสอนและนักเรียนในห้องนี้จะได้รับผลกระทบ`)) return;
    try {
      await api.deleteClassroom(id);
      await loadDashboardData();
    } catch (err: any) {
      alert('ลบห้องเรียนไม่สำเร็จ: ' + err.message);
    }
  };

  const handleGoTeach = (classroomName: string) => {
    if (onEnterClassroom) {
      onEnterClassroom(classroomName);
    } else {
      setActiveTab('attendance');
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-pink-600 text-xs font-semibold">
          <div className="w-5 h-5 border-2 border-pink-600 border-t-transparent rounded-full animate-spin" />
          <span>กำลังโหลดข้อมูลห้องเรียนและสถิติ...</span>
        </div>
      </div>
    );
  }

  const counts = stats?.counts || { present: 0, late: 0, leave: 0, absent: 0 };
  const totalMarks = counts.present + counts.late + counts.leave + counts.absent;
  const presentPct = totalMarks > 0 ? Math.round((counts.present / totalMarks) * 100) : 0;
  const latePct = totalMarks > 0 ? Math.round((counts.late / totalMarks) * 100) : 0;
  const leavePct = totalMarks > 0 ? Math.round((counts.leave / totalMarks) * 100) : 0;
  const absentPct = totalMarks > 0 ? Math.round((counts.absent / totalMarks) * 100) : 0;

  return (
    <PageContainer>
      {/* SECTION 1: ห้องเรียนในความดูแล (Classroom Hub Section) */}
      <div className="bg-white rounded-2xl border border-pink-100/90 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-pink-50 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">ห้องเรียนที่ดูแลทั้งหมด</h2>
              <p className="text-xs text-slate-500">เลือกชั้นเรียนเพื่อเข้าสอน เช็คชื่อ หรือจัดการข้อมูลนักเรียน</p>
            </div>
          </div>

          {/* Add Classroom Button (Dynamic Creation) */}
          <Button
            onClick={() => setIsAddClassModalOpen(true)}
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
          >
            เพิ่มห้องเรียนใหม่
          </Button>
        </div>

        {/* Classroom Cards Grid */}
        {classrooms.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-pink-100 rounded-2xl bg-pink-50/20 space-y-3">
            <Layers className="w-10 h-10 text-pink-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">ยังไม่มีห้องเรียนในระบบ</p>
            <p className="text-xs text-slate-400">กดปุ่ม &quot;เพิ่มห้องเรียนใหม่&quot; ด้านบนเพื่อเริ่มต้นสร้างชั้นเรียน</p>
            <Button
              onClick={() => setIsAddClassModalOpen(true)}
              variant="outline"
              size="sm"
            >
              สร้างห้องเรียนแรก
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {classrooms.map((c) => (
              <div
                key={c.id}
                className="group relative bg-linear-to-b from-white to-slate-50/60 rounded-2xl border border-pink-100/80 hover:border-pink-300 hover:shadow-md hover:shadow-pink-100/60 transition-all duration-200 p-5 flex flex-col justify-between space-y-4 shadow-xs"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-slate-900 tracking-tight group-hover:text-pink-600 transition-colors">
                        ห้อง {c.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-100">
                        {c.academic_year ? `ปี ${c.academic_year}` : 'ภาคเรียนปัจจุบัน'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      {c.level || 'ระดับมัธยมศึกษา'}
                    </p>
                  </div>

                  {/* Delete button (subtle) */}
                  <Button
                    onClick={() => handleDeleteClassroom(c.id, c.name)}
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 hover:text-rose-600 hover:bg-rose-50 transition-all text-slate-300"
                    title="ลบห้องเรียนนี้"
                    aria-label={`ลบห้องเรียน ${c.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {/* Card Meta Stats */}
                <div className="grid grid-cols-2 gap-2 py-2 px-3 bg-white/80 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">จำนวนนักเรียน</span>
                    <span className="font-bold text-slate-800 text-sm flex items-baseline gap-1">
                      {c.students_count || 0}
                      <span className="text-[10px] font-normal text-slate-500">คน</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">ครูที่ปรึกษา</span>
                    <span className="font-semibold text-slate-700 truncate block text-xs" title={c.advisor_name || '-'}>
                      {c.advisor_name || 'ยังไม่ระบุ'}
                    </span>
                  </div>
                </div>

                {/* Card Action Button: เข้าไปสอน / เช็คชื่อ */}
                <div className="pt-2 border-t border-pink-50 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400">
                    {c.students_count > 0 ? 'พร้อมเช็คชื่อ' : 'รอนักเรียน'}
                  </span>
                  <Button
                    onClick={() => handleGoTeach(c.name)}
                    variant="primary"
                    size="sm"
                    className="gap-1.5 shadow-xs shadow-pink-200 group-hover:bg-pink-700"
                    icon={<UserCheck className="w-3.5 h-3.5" />}
                  >
                    <span>เข้าห้องเรียน / ไปสอน</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: แถบเครื่องมือลัด (Quick Action Banner) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Attendance - Pink */}
        <button
          onClick={() => setActiveTab('attendance')}
          className="flex items-center justify-between p-4 bg-white rounded-2xl border border-pink-100 hover:border-pink-300 hover:shadow-sm hover:shadow-pink-100 transition-all text-left group shadow-xs cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center group-hover:bg-pink-600 group-hover:text-white transition-colors shadow-xs">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">เช็คชื่อชั้นเรียน</div>
              <div className="text-xs text-slate-500">บันทึกคาบเรียนปัจจุบัน</div>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-pink-600 transition-colors" />
        </button>

        {/* AI Scan - Pink */}
        <button
          onClick={() => setActiveTab('ai-scan')}
          className="flex items-center justify-between p-4 bg-white rounded-2xl border border-pink-100 hover:border-pink-300 hover:shadow-sm hover:shadow-pink-100 transition-all text-left group shadow-xs cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center group-hover:bg-pink-600 group-hover:text-white transition-colors shadow-xs">
              <ScanLine className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">สแกนใบเช็คชื่อ AI</div>
              <div className="text-xs text-slate-500">อ่านภาพเอกสารอัตโนมัติ</div>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-pink-600 transition-colors" />
        </button>

        {/* Export - Sky Blue 10% */}
        <button
          onClick={() => setActiveTab('export')}
          className="flex items-center justify-between p-4 bg-white rounded-2xl border border-sky-100 hover:border-sky-300 hover:shadow-sm hover:shadow-sky-100 transition-all text-left group shadow-xs cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-colors shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">ส่งออก Excel</div>
              <div className="text-xs text-slate-500">ดาวน์โหลดรายงาน .xlsx</div>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition-colors" />
        </button>
      </div>

      {/* SECTION 3: Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="bg-white p-5 rounded-2xl border border-pink-100/70 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">นักเรียนทั้งหมด</span>
            <Users className="w-4 h-4 text-pink-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{stats?.total_students || 0}</span>
            <span className="text-xs text-slate-500">คน</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">จาก {classrooms.length} ห้องเรียน</div>
        </div>

        {/* Overall Attendance Rate */}
        <div className="bg-white p-5 rounded-2xl border border-pink-100/70 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">อัตราการเข้าเรียนเฉลี่ย</span>
            <TrendingUp className="w-4 h-4 text-pink-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-pink-600">{stats?.overall_rate || 0}%</span>
            <span className="text-xs text-sky-600 font-bold bg-sky-50 px-1.5 py-0.5 rounded">เกณฑ์ 80%+</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">คำนวณจากทุกคาบเรียน</div>
        </div>

        {/* Recorded Sessions - Sky Blue 10% */}
        <div className="bg-white p-5 rounded-2xl border border-sky-100/70 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">คาบเรียนที่บันทึกแล้ว</span>
            <Calendar className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{stats?.total_sessions || 0}</span>
            <span className="text-xs text-slate-500">คาบ</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">ตลอดภาคเรียนปัจจุบัน</div>
        </div>

        {/* High Risk Alerts */}
        <div className="bg-white p-5 rounded-2xl border border-pink-100/70 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">นักเรียนกลุ่มเสี่ยง (ขาด/สาย)</span>
            <AlertTriangle className="w-4 h-4 text-pink-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-pink-600">{stats?.at_risk_students?.length || 0}</span>
            <span className="text-xs text-pink-600 font-medium">คน</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">ขาดเรียนตั้งแต่ 2-3 ครั้งขึ้นไป</div>
        </div>
      </div>

      {/* SECTION 4: Attendance Breakdown Bar */}
      <div className="bg-white p-6 rounded-2xl border border-pink-100/70 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 mb-4">สัดส่วนสถานะการเข้าเรียนรวม</h3>
        
        {/* Bar */}
        <div className="h-4 w-full rounded-full bg-slate-100 flex overflow-hidden">
          <div style={{ width: `${presentPct}%` }} className="bg-pink-500 h-full transition-all" title={`มา: ${presentPct}%`} />
          <div style={{ width: `${latePct}%` }} className="bg-amber-400 h-full transition-all" title={`สาย: ${latePct}%`} />
          <div style={{ width: `${leavePct}%` }} className="bg-sky-400 h-full transition-all" title={`ลา: ${leavePct}%`} />
          <div style={{ width: `${absentPct}%` }} className="bg-rose-500 h-full transition-all" title={`ขาด: ${absentPct}%`} />
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-pink-500" />
            <div>
              <div className="text-xs text-slate-500">มาเรียน</div>
              <div className="text-sm font-bold text-slate-800">{counts.present} ครั้ง ({presentPct}%)</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <div>
              <div className="text-xs text-slate-500">มาสาย</div>
              <div className="text-sm font-bold text-slate-800">{counts.late} ครั้ง ({latePct}%)</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-sky-400" />
            <div>
              <div className="text-xs text-slate-500">ลากิจ/ลาป่วย</div>
              <div className="text-sm font-bold text-slate-800">{counts.leave} ครั้ง ({leavePct}%)</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500" />
            <div>
              <div className="text-xs text-slate-500">ขาดเรียน</div>
              <div className="text-sm font-bold text-slate-800">{counts.absent} ครั้ง ({absentPct}%)</div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 5: Two Column Grid: At-Risk Students & Recent Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* At-Risk Students */}
        <div className="bg-white rounded-2xl border border-pink-100/70 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-pink-50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">นักเรียนที่ต้องติดตามเป็นพิเศษ</h3>
              <p className="text-xs text-slate-500">มีสถิติขาดเรียนหรือมาสายสะสม</p>
            </div>
            <button
              onClick={() => setActiveTab('students')}
              className="text-xs text-pink-600 hover:text-pink-700 font-bold cursor-pointer"
            >
              ดูข้อมูลนักเรียน
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {stats?.at_risk_students?.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">ไม่มีนักเรียนกลุ่มเสี่ยงในขณะนี้</div>
            ) : (
              stats?.at_risk_students?.map((st: any) => (
                <div key={st.id} className="p-4 flex items-center justify-between hover:bg-pink-50/20">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">{st.full_name}</span>
                      <span className="px-1.5 py-0.5 text-[10px] bg-sky-50 text-sky-700 border border-sky-100 rounded">
                        {st.classroom} เลขที่ {st.student_number}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-3">
                      <span className="text-pink-600 font-semibold">ขาด: {st.absent_count} ครั้ง</span>
                      <span className="text-amber-600 font-semibold">สาย: {st.late_count} ครั้ง</span>
                    </div>
                  </div>

                  {st.guardian_phone && (
                    <a
                      href={`tel:${st.guardian_phone}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl transition-colors"
                      title={`โทรติดต่อผู้ปกครอง (${st.guardian_name})`}
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-sky-600" />
                      <span>{st.guardian_phone}</span>
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="bg-white rounded-2xl border border-pink-100/70 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-pink-50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">ประวัติการเช็คชื่อล่าสุด</h3>
              <p className="text-xs text-slate-500">รายการบันทึกเวลาเรียนล่าสุด</p>
            </div>
            <button
              onClick={() => setActiveTab('history')}
              className="text-xs text-pink-600 hover:text-pink-700 font-bold cursor-pointer"
            >
              ดูประวัติทั้งหมด
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {stats?.recent_sessions?.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">ยังไม่มีข้อมูลการเช็คชื่อ</div>
            ) : (
              stats?.recent_sessions?.map((sess: any) => (
                <div key={sess.id} className="p-4 flex items-center justify-between hover:bg-pink-50/20">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">{sess.subject?.name || 'รายวิชา'}</span>
                      <span className="text-xs text-sky-600 font-medium">({sess.classroom})</span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <span>{sess.date}</span>
                      <span>•</span>
                      <span>{sess.period}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded-lg bg-pink-50 text-pink-700 border border-pink-100 font-semibold">
                      มา {sess.present_count}
                    </span>
                    {sess.absent_count > 0 && (
                      <span className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 font-semibold">
                        ขาด {sess.absent_count}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* MODAL: เพิ่มห้องเรียนใหม่ (Dynamic Add Classroom) */}
      {isAddClassModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-pink-100 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-pink-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">เพิ่มห้องเรียนใหม่</h3>
                  <p className="text-xs text-slate-500">สร้างชั้นเรียนเพื่อเริ่มจัดการข้อมูลและเช็คชื่อ</p>
                </div>
              </div>
              <Button
                onClick={() => setIsAddClassModalOpen(false)}
                variant="ghost"
                size="icon"
                title="ปิด"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleCreateClassroom} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  ชื่อห้องเรียน <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ม.4/3, ม.5/1 หรือ 4/1"
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-pink-400 focus:bg-white transition-all"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">ชื่อห้องจะต้องไม่ซ้ำกับห้องเรียนที่มีอยู่แล้ว</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    ระดับชั้น
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น ม.4"
                    value={classForm.level}
                    onChange={(e) => setClassForm({ ...classForm, level: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    ปีการศึกษา
                  </label>
                  <input
                    type="text"
                    placeholder="2569"
                    value={classForm.academic_year}
                    onChange={(e) => setClassForm({ ...classForm, academic_year: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  ครูที่ปรึกษา / ครูประจำชั้น
                </label>
                <input
                  type="text"
                  placeholder="เช่น อ.กนกพร สิทธิชัย"
                  value={classForm.advisor_name}
                  onChange={(e) => setClassForm({ ...classForm, advisor_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  onClick={() => setIsAddClassModalOpen(false)}
                  variant="secondary"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={creatingClass}
                >
                  สร้างห้องเรียน
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
