'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileCheck,
  Check,
  Clock,
  FileText,
  X,
  Sparkles,
  Save,
  CheckCircle2,
  RefreshCw,
  ImageIcon,
  Eye,
} from 'lucide-react';
import { api, STORAGE_BASE } from '@/lib/api';

export default function AiScanView() {
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<string>('ม.4/1');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [period, setPeriod] = useState<string>('คาบ 1-2');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [uploadId, setUploadId] = useState<number | null>(null);

  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load classrooms & subjects
  useEffect(() => {
    async function init() {
      try {
        const [cr, sb] = await Promise.all([api.getClassrooms(), api.getSubjects()]);
        if (cr.data?.length) {
          setClassrooms(cr.data);
          setSelectedClassroom(cr.data[0].name);
        }
        if (sb.data?.length) {
          setSubjects(sb.data);
          setSelectedSubjectId(String(sb.data[0].id));
        }
      } catch (e) {
        console.error(e);
      }
    }
    init();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAiResult(null);
      setConfirmed(false);
    }
  };

  // Helper to generate a mock canvas sheet
  const handleUseSampleSheet = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 800, 1000);

      // Title
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(`ใบเช็คชื่อนักเรียน ประจำชั้น ${selectedClassroom}`, 50, 60);

      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText(`วันที่: ${date}   คาบเรียน: ${period}`, 50, 95);

      // Table Header
      ctx.fillStyle = '#fdf2f8'; // pink tint
      ctx.fillRect(50, 120, 700, 40);
      ctx.strokeStyle = '#fbcfe8';
      ctx.strokeRect(50, 120, 700, 40);

      ctx.fillStyle = '#831843';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('เลขที่', 70, 145);
      ctx.fillText('รหัส', 140, 145);
      ctx.fillText('ชื่อ - นามสกุล', 250, 145);
      ctx.fillText('ผลการเช็คชื่อ', 600, 145);

      // Mock rows
      for (let i = 1; i <= 15; i++) {
        const y = 160 + (i - 1) * 50;
        ctx.fillStyle = i % 2 === 0 ? '#fff1f2' : '#ffffff';
        ctx.fillRect(50, y, 700, 50);
        ctx.strokeRect(50, y, 700, 50);

        ctx.fillStyle = '#334155';
        ctx.font = '14px sans-serif';
        ctx.fillText(String(i), 80, y + 30);
        ctx.fillText(`67010${i < 10 ? '0' + i : i}`, 140, y + 30);
        ctx.fillText(`นักเรียนคนที่ ${i}`, 250, y + 30);

        // Checkmarks
        ctx.fillStyle = i === 3 ? '#e11d48' : i === 7 ? '#d97706' : '#db2777';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText(i === 3 ? 'ข' : i === 7 ? 'ส' : '✓', 635, y + 32);
      }

      canvas.toBlob((blob) => {
        if (blob) {
          const sampleFile = new File([blob], `sample_sheet_${selectedClassroom}.png`, {
            type: 'image/png',
          });
          setSelectedFile(sampleFile);
          setPreviewUrl(URL.createObjectURL(sampleFile));
          setAiResult(null);
          setConfirmed(false);
        }
      });
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!selectedFile || !selectedSubjectId || !selectedClassroom) {
      alert('กรุณาเลือกไฟล์และระบุข้อมูลห้องเรียน/วิชาให้ครบถ้วน');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('sheet_image', selectedFile);
      formData.append('classroom', selectedClassroom);
      formData.append('subject_id', selectedSubjectId);
      formData.append('date', date);
      formData.append('period', period);

      const res = await api.uploadAndScanSheet(formData);
      if (res.status === 'success') {
        setUploadId(res.data.id);
        setAiResult(res.data.parsed_data);
        if (res.data.file_url) {
          const fullStorageUrl = res.data.file_url.startsWith('http')
            ? res.data.file_url
            : `${STORAGE_BASE}${res.data.file_url}`;
          setPreviewUrl(fullStorageUrl);
        }
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการวิเคราะห์เอกสาร: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const updateStudentStatus = (studentId: number, status: 'present' | 'late' | 'leave' | 'absent') => {
    if (!aiResult) return;
    const updated = aiResult.students.map((st: any) =>
      st.student_id === studentId ? { ...st, status } : st
    );
    const present = updated.filter((s: any) => s.status === 'present').length;
    const late = updated.filter((s: any) => s.status === 'late').length;
    const leave = updated.filter((s: any) => s.status === 'leave').length;
    const absent = updated.filter((s: any) => s.status === 'absent').length;

    setAiResult({
      ...aiResult,
      students: updated,
      summary: {
        ...aiResult.summary,
        present,
        late,
        leave,
        absent,
      },
    });
  };

  const handleConfirmAndSave = async () => {
    if (!aiResult) return;
    try {
      setSaving(true);
      const payload = {
        upload_id: uploadId,
        subject_id: Number(selectedSubjectId),
        classroom: selectedClassroom,
        date,
        period,
        topic: 'บันทึกผ่าน AI Scan ใบเช็คชื่อ',
        records: aiResult.students.map((s: any) => ({
          student_id: s.student_id,
          status: s.status,
          remark: s.remark,
        })),
      };

      const res = await api.confirmAiSheet(payload);
      if (res.status === 'success') {
        setConfirmed(true);
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการบันทึก: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Parameters Header - White 60% with Pink 30% borders */}
      <div className="bg-white p-6 rounded-2xl border border-pink-100 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">ห้องเรียน</label>
            <select
              value={selectedClassroom}
              onChange={(e) => setSelectedClassroom(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-pink-400"
            >
              {classrooms.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

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

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">วันที่ในเอกสาร</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
          </div>

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
            </select>
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      {!aiResult && (
        <div className="bg-white p-8 rounded-2xl border border-dashed border-pink-200 text-center space-y-4 shadow-xs">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,application/pdf"
            className="hidden"
          />

          <div className="w-14 h-14 bg-pink-50 text-pink-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
            <UploadCloud className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-800">
              {selectedFile ? selectedFile.name : 'เลือกหรือลากไฟล์ภาพใบเช็คชื่อมาวางที่นี่'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              รองรับรูปถ่ายไฟล์ JPG, PNG, WEBP หรือเอกสาร PDF (จัดเก็บผ่าน Laravel Storage)
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs shadow-pink-200"
            >
              เลือกไฟล์จากเครื่อง
            </button>
            <button
              type="button"
              onClick={handleUseSampleSheet}
              className="px-4 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-semibold rounded-xl transition-colors"
            >
              สร้างภาพใบเช็คชื่อตัวอย่าง
            </button>
          </div>

          {selectedFile && (
            <div className="pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleUploadAndAnalyze}
                disabled={uploading}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm shadow-pink-200 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>AI กำลังวิเคราะห์เอกสาร...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>เริ่มให้อ่านเอกสารด้วย AI</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* AI Analysis Result - Split View */}
      {aiResult && (
        <div className="space-y-6">
          {/* Success Banner */}
          {confirmed ? (
            <div className="p-4 bg-pink-50 border border-pink-200 rounded-2xl flex items-center justify-between text-pink-900 text-xs font-medium">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-pink-600" />
                <span className="font-semibold">บันทึกข้อมูลการเช็คชื่อจาก AI เข้าสู่ฐานข้อมูลเรียบร้อยแล้ว</span>
              </div>
              <button
                onClick={() => {
                  setAiResult(null);
                  setSelectedFile(null);
                  setPreviewUrl(null);
                  setConfirmed(false);
                }}
                className="px-3 py-1 bg-pink-600 text-white rounded-lg text-xs font-medium hover:bg-pink-700 shadow-xs shadow-pink-200"
              >
                สแกนใบใหม่
              </button>
            </div>
          ) : (
            <div className="p-4 bg-pink-50/70 border border-pink-200 rounded-2xl flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2.5 text-xs text-pink-900">
                <Sparkles className="w-4 h-4 text-pink-600" />
                <span>
                  AI อ่านข้อมูลสำเร็จ (ความแม่นยำ {(aiResult.summary.overall_confidence * 100).toFixed(0)}%)
                  กรุณาตรวจสอบความถูกต้องก่อนกดยืนยัน
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setAiResult(null);
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl"
                >
                  ยกเลิก / อัปโหลดใหม่
                </button>
                <button
                  onClick={handleConfirmAndSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold rounded-xl shadow-xs shadow-pink-200 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'กำลังบันทึก...' : 'ยืนยันและบันทึกข้อมูลเข้าระบบ'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Split Screen Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Document Preview */}
            <div className="lg:col-span-5 bg-white p-4 rounded-2xl border border-pink-100 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-pink-500" />
                  <span>ภาพเอกสารใบเช็คชื่อ</span>
                </h4>
                <span className="text-[11px] text-sky-600 font-medium">เก็บใน Laravel Storage</span>
              </div>

              <div className="aspect-[3/4] w-full bg-slate-50 rounded-xl overflow-hidden border border-pink-100 relative flex items-center justify-center">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Attendance Sheet"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-xs text-slate-400">ไม่มีภาพตัวอย่าง</div>
                )}
              </div>
            </div>

            {/* Right: AI Recognized Student Table */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-pink-100/80 overflow-hidden shadow-xs flex flex-col">
              {/* Header Summary */}
              <div className="p-4 border-b border-pink-50 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-pink-50 text-pink-700 border border-pink-100 text-xs font-bold">
                    มา {aiResult.summary.present}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-100 text-xs font-bold">
                    สาย {aiResult.summary.late}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-100 text-xs font-bold">
                    ลา {aiResult.summary.leave}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-100 text-xs font-bold">
                    ขาด {aiResult.summary.absent}
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  รวม {aiResult.students.length} คน
                </div>
              </div>

              {/* Table */}
              <div className="overflow-y-auto max-h-[600px]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-slate-50 border-b border-pink-50 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3 w-12 text-center">เลขที่</th>
                      <th className="py-2.5 px-3">ชื่อ - สกุล</th>
                      <th className="py-2.5 px-3 text-center">AI ตรวจพบ</th>
                      <th className="py-2.5 px-3 w-64 text-center">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {aiResult.students.map((st: any) => (
                      <tr key={st.student_id} className="hover:bg-pink-50/20">
                        <td className="py-2.5 px-3 text-center font-medium text-slate-600">
                          {st.student_number}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-800">{st.full_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{st.student_code}</div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded font-bold text-xs ${
                              st.detected_mark === '✓'
                                ? 'bg-pink-50 text-pink-700 border border-pink-200'
                                : st.detected_mark === 'ข'
                                ? 'bg-rose-50 text-rose-700'
                                : st.detected_mark === 'ส'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-sky-50 text-sky-700 border border-sky-200'
                            }`}
                          >
                            {st.detected_mark}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="grid grid-cols-4 gap-1 p-0.5 bg-slate-100 rounded-xl">
                            <button
                              type="button"
                              onClick={() => updateStudentStatus(st.student_id, 'present')}
                              className={`py-1 rounded-lg text-[11px] font-semibold ${
                                st.status === 'present'
                                  ? 'bg-pink-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              มา
                            </button>
                            <button
                              type="button"
                              onClick={() => updateStudentStatus(st.student_id, 'late')}
                              className={`py-1 rounded-lg text-[11px] font-semibold ${
                                st.status === 'late'
                                  ? 'bg-amber-500 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              สาย
                            </button>
                            <button
                              type="button"
                              onClick={() => updateStudentStatus(st.student_id, 'leave')}
                              className={`py-1 rounded-lg text-[11px] font-semibold ${
                                st.status === 'leave'
                                  ? 'bg-sky-500 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              ลา
                            </button>
                            <button
                              type="button"
                              onClick={() => updateStudentStatus(st.student_id, 'absent')}
                              className={`py-1 rounded-lg text-[11px] font-semibold ${
                                st.status === 'absent'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              ขาด
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
