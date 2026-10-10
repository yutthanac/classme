'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Button, Select } from '@/components/ui';
import { StudentFormData } from '@/types/student';

interface StudentFormModalProps {
  isOpen: boolean;
  isEditing: boolean;
  formData: StudentFormData;
  prefixMode: string;
  customPrefix: string;
  availablePrefixes: string[];
  classrooms: Array<{ id: number; name: string }>;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onFieldChange: <K extends keyof StudentFormData>(key: K, value: StudentFormData[K]) => void;
  onPrefixModeChange: (val: string) => void;
  onCustomPrefixChange: (val: string) => void;
}

export function StudentFormModal({
  isOpen,
  isEditing,
  formData,
  prefixMode,
  customPrefix,
  availablePrefixes,
  classrooms,
  submitting,
  onClose,
  onSubmit,
  onFieldChange,
  onPrefixModeChange,
  onCustomPrefixChange,
}: StudentFormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl border border-pink-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-pink-50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            {isEditing ? 'แก้ไขข้อมูลนักเรียน' : 'เพิ่มนักเรียนใหม่'}
          </h3>
          <Button onClick={onClose} variant="ghost" size="icon" aria-label="ปิด">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={onSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                รหัสนักเรียน
              </label>
              <input
                type="text"
                required
                value={formData.student_code}
                onChange={(e) => onFieldChange('student_code', e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-pink-400"
                placeholder="เช่น 6701021"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เลขที่
              </label>
              <input
                type="number"
                required
                value={formData.student_number}
                onChange={(e) => onFieldChange('student_number', Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-pink-400"
              />
            </div>
          </div>

          {/* Title / Prefix Selection + Custom field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              คำนำหน้านักเรียน (Prefix)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={prefixMode}
                onChange={(e) => onPrefixModeChange(e.target.value)}
                className="w-full"
              >
                {availablePrefixes.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
                <option value="other">ระบุเอง...</option>
              </Select>

              {prefixMode === 'other' ? (
                <input
                  type="text"
                  required
                  placeholder="เช่น ด.ช., ม.ล."
                  value={customPrefix}
                  onChange={(e) => onCustomPrefixChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-pink-200 rounded-xl text-xs focus:ring-2 focus:ring-pink-400"
                />
              ) : (
                <div className="text-xs text-slate-400 flex items-center px-2">
                  ใช้คำนำหน้ามาตรฐาน
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อ</label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => onFieldChange('first_name', e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-pink-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">นามสกุล</label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => onFieldChange('last_name', e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-pink-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ห้องเรียน</label>
              <Select
                value={formData.classroom}
                onChange={(e) => onFieldChange('classroom', e.target.value)}
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">เพศ</label>
              <Select
                value={formData.gender}
                onChange={(e) => onFieldChange('gender', e.target.value)}
                className="w-full"
              >
                <option value="male">ชาย</option>
                <option value="female">หญิง</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อผู้ปกครอง</label>
              <input
                type="text"
                value={formData.guardian_name}
                onChange={(e) => onFieldChange('guardian_name', e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-pink-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">เบอร์ติดต่อผู้ปกครอง</label>
              <input
                type="text"
                value={formData.guardian_phone}
                onChange={(e) => onFieldChange('guardian_phone', e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-pink-400"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              size="sm"
              disabled={submitting}
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={submitting}
            >
              บันทึกข้อมูล
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default StudentFormModal;
