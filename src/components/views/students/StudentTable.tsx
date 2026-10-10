'use client';

import React from 'react';
import { Eye, Edit2, Trash2, Phone } from 'lucide-react';
import { Button, LiquidWaveSpinner } from '@/components/ui';
import { Student } from '@/types/student';

interface StudentTableProps {
  students: Student[];
  loading: boolean;
  onViewProfile: (id: number) => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (id: number) => void;
}

export function StudentTable({
  students,
  loading,
  onViewProfile,
  onEditStudent,
  onDeleteStudent,
}: StudentTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-pink-100/70 p-10 flex flex-col items-center justify-center shadow-xs">
        <LiquidWaveSpinner
          size="sm"
          words={[
            'กำลังโหลดรายชื่อนักเรียน...',
            'กำลังดึงข้อมูลชั้นเรียนและเลขที่...',
            'กำลังประมวลผลข้อมูลการติดต่อ...',
          ]}
        />
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-pink-100/70 p-12 text-center text-xs text-slate-400 shadow-xs">
        ไม่พบรายชื่อนักเรียน
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-pink-100/70 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-50/75 border-b border-pink-50 text-slate-500 font-semibold">
            <tr>
              <th className="py-3 px-4 w-14 text-center">เลขที่</th>
              <th className="py-3 px-4 w-24">รหัส</th>
              <th className="py-3 px-4">คำนำหน้า & ชื่อ - สกุล</th>
              <th className="py-3 px-4 w-20 text-center">ห้อง</th>
              <th className="py-3 px-4 w-20 text-center">เพศ</th>
              <th className="py-3 px-4">ผู้ปกครอง</th>
              <th className="py-3 px-4 w-32">เบอร์ติดต่อ</th>
              <th className="py-3 px-4 w-28 text-center">การจัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((st) => (
              <tr key={st.id} className="hover:bg-pink-50/30 transition-colors">
                <td className="py-3 px-4 text-center font-medium text-slate-600">
                  {st.student_number}
                </td>
                <td className="py-3 px-4 font-mono text-slate-500">
                  {st.student_code}
                </td>
                <td className="py-3 px-4 font-semibold text-slate-800">
                  <span className="text-pink-600 mr-1">{st.title}</span>
                  {st.first_name} {st.last_name}
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="px-2 py-0.5 rounded-lg bg-sky-50 text-sky-700 border border-sky-100 font-medium">
                    {st.classroom}
                  </span>
                </td>
                <td className="py-3 px-4 text-center text-slate-500">
                  {st.gender === 'male' ? 'ชาย' : 'หญิง'}
                </td>
                <td className="py-3 px-4 text-slate-600">
                  {st.guardian_name || '-'}
                </td>
                <td className="py-3 px-4 text-slate-600 font-mono">
                  {st.guardian_phone ? (
                    <a
                      href={`tel:${st.guardian_phone}`}
                      className="hover:text-sky-600 hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3 text-sky-400" />
                      <span>{st.guardian_phone}</span>
                    </a>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <Button
                      onClick={() => onViewProfile(st.id)}
                      variant="ghost"
                      size="icon"
                      className="hover:text-sky-600"
                      title="ดูประวัติการเข้าเรียน"
                      aria-label="ดูประวัติการเข้าเรียน"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      onClick={() => onEditStudent(st)}
                      variant="ghost"
                      size="icon"
                      className="hover:text-pink-600"
                      title="แก้ไขข้อมูล"
                      aria-label="แก้ไขข้อมูล"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      onClick={() => onDeleteStudent(st.id)}
                      variant="ghost"
                      size="icon"
                      className="hover:text-rose-600"
                      title="ลบ"
                      aria-label="ลบ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export default StudentTable;
