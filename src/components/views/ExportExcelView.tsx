'use client';

import React, { useEffect, useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  CheckCircle2,
  Calendar,
  Layers,
  BookOpen,
  ArrowDownToLine,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button, PageContainer, Select } from '@/components/ui';

interface ExportExcelViewProps {
  initialClassroom?: string | null;
}

export default function ExportExcelView({ initialClassroom }: ExportExcelViewProps = {}) {
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<string>(initialClassroom || 'ม.4/1');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [previewStudents, setPreviewStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialClassroom) {
      setSelectedClassroom(initialClassroom);
    }
  }, [initialClassroom]);

  useEffect(() => {
    async function init() {
      const [cr, sb] = await Promise.all([api.getClassrooms(), api.getSubjects()]);
      if (cr.data?.length) {
        setClassrooms(cr.data);
        if (!initialClassroom) {
          setSelectedClassroom(cr.data[0].name);
        }
      }
      if (sb.data?.length) {
        setSubjects(sb.data);
      }
    }
    init();
  }, [initialClassroom]);

  useEffect(() => {
    if (!selectedClassroom) return;
    loadPreview();
  }, [selectedClassroom]);

  const loadPreview = async () => {
    try {
      setLoading(true);
      const res = await api.getStudents({ classroom: selectedClassroom });
      if (res.data) {
        setPreviewStudents(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const downloadUrl = api.getExportExcelUrl(selectedClassroom, selectedSubjectId || undefined);
    window.open(downloadUrl, '_blank');
  };

  return (
    <PageContainer>
      {/* Parameters - White 60% with Pink 30% borders & Sky Blue 10% Action */}
      <div className="bg-white p-6 rounded-2xl border border-pink-100 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">ส่งออกรายงานการเข้าเรียน (Excel Spreadsheet)</h3>
            <p className="text-xs text-slate-500">สร้างไฟล์สรุปสถิติพร้อมสูตรและสัญลักษณ์เช็คชื่ออัตโนมัติ</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">ห้องเรียนที่ต้องการส่งออก</label>
            <Select
              value={selectedClassroom}
              onChange={(e) => setSelectedClassroom(e.target.value)}
              className="w-full"
            >
              {classrooms.map((c) => (
                <option key={c.id} value={c.name}>
                  ห้อง {c.name} ({c.students_count || 0} คน)
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">วิชา (เลือกหรือไม่เลือกก็ได้)</label>
            <Select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full"
            >
              <option value="">ทุกรายวิชา</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} {s.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              onClick={handleDownload}
              variant="accent"
              className="w-full h-[38px]"
            >
              <Download className="w-4 h-4" />
              <span>ดาวน์โหลด Excel (.xlsx)</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Card */}
      <div className="bg-white rounded-2xl border border-pink-100/70 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-pink-50 flex items-center justify-between bg-slate-50/50">
          <div>
            <h4 className="text-xs font-bold text-slate-800">
              ตัวอย่างรายชื่อนักเรียนในเอกสาร ({selectedClassroom})
            </h4>
            <p className="text-[11px] text-slate-500">
              ข้อมูลจะถูกจัดรูปแบบตารางพร้อมสูตรคำนวณและสัญลักษณ์ ✓ ข ส ล อัตโนมัติ
            </p>
          </div>
          <span className="text-xs text-sky-600 font-bold bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-100">
            รวม {previewStudents.length} รายชื่อ
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-b border-pink-50 text-slate-600 font-semibold">
              <tr>
                <th className="py-2.5 px-4 w-14 text-center">ลำดับ</th>
                <th className="py-2.5 px-4 w-28">รหัสนักเรียน</th>
                <th className="py-2.5 px-4">ชื่อ - นามสกุล</th>
                <th className="py-2.5 px-4 w-24 text-center">ห้อง</th>
                <th className="py-2.5 px-4">ผู้ปกครอง</th>
                <th className="py-2.5 px-4 w-32">เบอร์ติดต่อ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {previewStudents.slice(0, 10).map((st) => (
                <tr key={st.id} className="hover:bg-pink-50/20">
                  <td className="py-2.5 px-4 text-center text-slate-600">{st.student_number}</td>
                  <td className="py-2.5 px-4 font-mono text-slate-500">{st.student_code}</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-800">
                    <span className="text-pink-600 mr-1">{st.title}</span>
                    {st.first_name} {st.last_name}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-lg bg-sky-50 text-sky-700 border border-sky-100 font-medium">
                      {st.classroom}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-600">{st.guardian_name || '-'}</td>
                  <td className="py-2.5 px-4 text-slate-500 font-mono">{st.guardian_phone || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageContainer>
  );
}
