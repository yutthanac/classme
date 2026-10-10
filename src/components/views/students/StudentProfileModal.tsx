'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Button, LiquidWaveSpinner } from '@/components/ui';
import { StudentProfileData } from '@/types/student';

interface StudentProfileModalProps {
  isOpen: boolean;
  isLoading: boolean;
  studentData: StudentProfileData | null;
  onClose: () => void;
}

export function StudentProfileModal({
  isOpen,
  isLoading,
  studentData,
  onClose,
}: StudentProfileModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl border border-pink-100 w-full max-w-xl max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-pink-50 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            {studentData ? (
              <>
                <h3 className="text-sm font-bold text-slate-900">
                  <span className="text-pink-600 mr-1">{studentData.student?.title}</span>
                  {studentData.student?.first_name} {studentData.student?.last_name}
                </h3>
                <p className="text-xs text-slate-500">
                  ชั้น {studentData.student?.classroom} เลขที่ {studentData.student?.student_number} (รหัส {studentData.student?.student_code})
                </p>
              </>
            ) : (
              <h3 className="text-sm font-bold text-slate-900">ประวัติการเข้าเรียน</h3>
            )}
          </div>
          <Button onClick={onClose} variant="ghost" size="icon" aria-label="ปิด">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {isLoading ? (
          <div className="p-10 flex flex-col items-center justify-center">
            <LiquidWaveSpinner
              size="sm"
              words={['กำลังโหลดสถิติการเข้าเรียน...', 'กำลังประมวลผลข้อมูล...']}
            />
          </div>
        ) : studentData ? (
          <div className="p-5 space-y-5">
            {/* Stats overview */}
            <div className="grid grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-pink-50 text-center border border-pink-100">
                <div className="text-xs text-pink-700 font-semibold">มาเรียน</div>
                <div className="text-lg font-bold text-pink-800">
                  {studentData.stats?.present || 0}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 text-center border border-amber-100">
                <div className="text-xs text-amber-700 font-semibold">มาสาย</div>
                <div className="text-lg font-bold text-amber-800">
                  {studentData.stats?.late || 0}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-sky-50 text-center border border-sky-100">
                <div className="text-xs text-sky-700 font-semibold">ลา</div>
                <div className="text-lg font-bold text-sky-800">
                  {studentData.stats?.leave || 0}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 text-center border border-rose-100">
                <div className="text-xs text-rose-700 font-semibold">ขาด</div>
                <div className="text-lg font-bold text-rose-800">
                  {studentData.stats?.absent || 0}
                </div>
              </div>
            </div>

            {/* Attendance Rate */}
            <div className="p-3.5 bg-sky-50/60 border border-sky-200/70 rounded-xl flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">ร้อยละการเข้าเรียนสะสม:</span>
              <span className="text-sm font-bold text-sky-700">
                {studentData.stats?.attendance_rate ?? 100}%
              </span>
            </div>

            {/* History list */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 mb-2">ประวัติการบันทึกแต่ละคาบ</h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                {studentData.history?.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    ยังไม่มีประวัติการเช็คชื่อ
                  </div>
                ) : (
                  studentData.history?.map((att) => (
                    <div
                      key={att.id}
                      className="p-3 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-slate-800">
                          {att.session?.subject?.name || 'รายวิชา'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {att.session?.date} ({att.session?.period})
                        </div>
                      </div>

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
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
export default StudentProfileModal;
