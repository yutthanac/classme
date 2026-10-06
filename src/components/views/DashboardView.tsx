'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  UserCheck,
  ScanLine,
  FileSpreadsheet,
  PhoneCall,
  Calendar,
} from 'lucide-react';
import { api } from '@/lib/api';
import { TabType } from '../Sidebar';

interface DashboardViewProps {
  setActiveTab: (tab: TabType) => void;
}

export default function DashboardView({ setActiveTab }: DashboardViewProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const res = await api.getAttendanceStats();
      if (res.status === 'success') {
        setStats(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-pink-600 text-xs font-semibold">
          <div className="w-5 h-5 border-2 border-pink-600 border-t-transparent rounded-full animate-spin" />
          <span>กำลังโหลดข้อมูลสถิติ...</span>
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
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Quick Action Banner (Pink 30% & Sky Blue 10% on White 60%) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Attendance - Pink */}
        <button
          onClick={() => setActiveTab('attendance')}
          className="flex items-center justify-between p-4 bg-white rounded-2xl border border-pink-100 hover:border-pink-300 hover:shadow-sm hover:shadow-pink-100 transition-all text-left group shadow-xs"
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
          className="flex items-center justify-between p-4 bg-white rounded-2xl border border-pink-100 hover:border-pink-300 hover:shadow-sm hover:shadow-pink-100 transition-all text-left group shadow-xs"
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
          className="flex items-center justify-between p-4 bg-white rounded-2xl border border-sky-100 hover:border-sky-300 hover:shadow-sm hover:shadow-sky-100 transition-all text-left group shadow-xs"
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

      {/* Main KPI Cards */}
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
          <div className="mt-2 text-xs text-slate-400">ห้อง ม.4/1 และ ม.4/2</div>
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

      {/* Attendance Breakdown Bar */}
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

      {/* Two Column Grid: At-Risk Students & Recent Sessions */}
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
              className="text-xs text-pink-600 hover:text-pink-700 font-bold"
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
              className="text-xs text-pink-600 hover:text-pink-700 font-bold"
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
    </div>
  );
}
