'use client';

import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Layers,
  BookOpen,
  Eye,
  X,
  Check,
  Clock,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api';

export default function HistoryView() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<string>('all');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Detail Modal
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);

  useEffect(() => {
    async function init() {
      const [cr, sb] = await Promise.all([api.getClassrooms(), api.getSubjects()]);
      if (cr.data) setClassrooms(cr.data);
      if (sb.data) setSubjects(sb.data);
    }
    init();
    loadSessions();
  }, []);

  useEffect(() => {
    loadSessions();
  }, [selectedClassroom, selectedSubjectId]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedClassroom !== 'all') params.classroom = selectedClassroom;
      if (selectedSubjectId !== 'all') params.subject_id = selectedSubjectId;
      const res = await api.getAttendanceSessions(params);
      if (res.data?.data) {
        setSessions(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = async (id: number) => {
    try {
      setSessionLoading(true);
      setActiveSession(null);
      const res = await api.getSessionDetail(id);
      if (res.data) setActiveSession(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setSessionLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Filters - White 60% with Pink 30% border */}
      <div className="bg-white p-5 rounded-2xl border border-pink-100/80 flex flex-wrap items-center gap-4 shadow-xs">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">ห้องเรียน</label>
          <select
            value={selectedClassroom}
            onChange={(e) => setSelectedClassroom(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-pink-400"
          >
            <option value="all">ทุกห้องเรียน</option>
            {classrooms.map((c) => (
              <option key={c.id} value={c.name}>
                ห้อง {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">รายวิชา</label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-pink-400"
          >
            <option value="all">ทุกรายวิชา</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Session list */}
      <div className="bg-white rounded-2xl border border-pink-100/70 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">กำลังโหลดประวัติการเช็คชื่อ...</div>
        ) : sessions.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">ยังไม่มีประวัติการเช็คชื่อ</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50/75 border-b border-pink-50 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">วันที่</th>
                  <th className="py-3 px-4">วิชา</th>
                  <th className="py-3 px-4 w-20 text-center">ห้อง</th>
                  <th className="py-3 px-4">คาบเรียน</th>
                  <th className="py-3 px-4">หัวข้อ</th>
                  <th className="py-3 px-4 text-center">สรุปผลการเข้าเรียน</th>
                  <th className="py-3 px-4 w-20 text-center">ดูรายละเอียด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sessions.map((sess) => (
                  <tr key={sess.id} className="hover:bg-pink-50/20 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-800">{sess.date}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {sess.subject?.code} {sess.subject?.name}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-lg bg-sky-50 text-sky-700 border border-sky-100 font-medium">
                        {sess.classroom}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{sess.period}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {sess.topic || '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 font-semibold">
                        <span className="px-2 py-0.5 rounded-lg bg-pink-50 text-pink-700 border border-pink-100">
                          มา {sess.present_count}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
                          สาย {sess.late_count}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-sky-50 text-sky-700 border border-sky-100">
                          ลา {sess.leave_count}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-100">
                          ขาด {sess.absent_count}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleOpenDetail(sess.id)}
                        className="p-1.5 text-pink-600 hover:text-pink-800 rounded-lg hover:bg-pink-50 transition-colors"
                        title="ดูรายละเอียด"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Session Detail Modal */}
      {activeSession && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-pink-100 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-pink-50 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  {activeSession.subject?.code} {activeSession.subject?.name} (ห้อง {activeSession.classroom})
                </h3>
                <p className="text-[11px] text-slate-500">
                  วันที่ {activeSession.date} • {activeSession.period}
                </p>
              </div>
              <button
                onClick={() => setActiveSession(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto p-4 flex-1">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-pink-50 text-slate-600 font-semibold sticky top-0">
                  <tr>
                    <th className="py-2 px-3 w-12 text-center">เลขที่</th>
                    <th className="py-2 px-3">ชื่อ - สกุล</th>
                    <th className="py-2 px-3 w-28 text-center">สถานะ</th>
                    <th className="py-2 px-3">หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeSession.attendances?.map((att: any) => (
                    <tr key={att.id} className="hover:bg-pink-50/20">
                      <td className="py-2 px-3 text-center text-slate-600">
                        {att.student?.student_number}
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-800">
                        <span className="text-pink-600 mr-1">{att.student?.title}</span>
                        {att.student?.first_name} {att.student?.last_name}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                            att.status === 'present'
                              ? 'bg-pink-50 text-pink-700 border border-pink-200'
                              : att.status === 'late'
                              ? 'bg-amber-50 text-amber-700'
                              : att.status === 'leave'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {att.status === 'present'
                            ? 'มา'
                            : att.status === 'late'
                            ? 'สาย'
                            : att.status === 'leave'
                            ? 'ลา'
                            : 'ขาด'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-500">{att.remark || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
