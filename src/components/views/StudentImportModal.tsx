'use client';

import React, { useState, useRef, useMemo } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Camera,
  ClipboardCopy,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Plus,
  Download,
  RefreshCw,
  X,
  Users,
  Check,
  Eye,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { Button, Select } from '@/components/ui';
import {
  type StudentDraft,
  scanRosterWithAi,
  batchImportStudents,
  parseTextToStudents,
  parseSpreadsheetBuffer,
  fetchGoogleSheetByUrl,
  compressImageForUpload,
  downloadSampleTemplate,
} from '@/action/action';

export type { StudentDraft };

interface StudentImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultClassroom?: string | null;
  classrooms?: any[];
  initialTab?: ImportTab;
  autoTrigger?: 'file' | 'camera' | 'image' | null;
}

type ImportTab = 'file' | 'camera' | 'paste';

export default function StudentImportModal({
  isOpen,
  onClose,
  onSuccess,
  defaultClassroom,
  classrooms = [],
  initialTab = 'file',
  autoTrigger = null,
}: StudentImportModalProps) {
  const [activeTab, setActiveTab] = useState<ImportTab>(initialTab || 'file');
  const [targetClassroom, setTargetClassroom] = useState<string>(defaultClassroom || '');
  const [isDragOver, setIsDragOver] = useState(false);
  const [pastedText, setPastedText] = useState('');

  // AI Camera / Photo states
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [scanningPhoto, setScanningPhoto] = useState(false);

  // Draft students in preview table
  const [studentsList, setStudentsList] = useState<StudentDraft[]>([]);
  const [savingBatch, setSavingBatch] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // File loading state
  const [readingFile, setReadingFile] = useState(false);
  const [readingFileName, setReadingFileName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Sync initialTab and autoTrigger when modal opens
  React.useEffect(() => {
    if (isOpen) {
      if (initialTab) setActiveTab(initialTab);
      if (autoTrigger === 'file') {
        setTimeout(() => fileInputRef.current?.click(), 120);
      } else if (autoTrigger === 'camera') {
        setTimeout(() => cameraInputRef.current?.click(), 120);
      } else if (autoTrigger === 'image') {
        setTimeout(() => fileInputRef.current?.click(), 120);
      }
    }
  }, [isOpen, initialTab, autoTrigger]);

  // Sync classroom
  React.useEffect(() => {
    if (defaultClassroom) {
      setTargetClassroom(defaultClassroom);
    } else if (classrooms.length > 0 && !targetClassroom) {
      setTargetClassroom(classrooms[0].name);
    }
  }, [defaultClassroom, classrooms]);

  if (!isOpen) return null;

  // Handle file drop / select
  const handleProcessFile = (file: File) => {
    setErrorMsg(null);

    // If user dropped or selected an image file in the file tab, automatically route to AI image scan!
    if (file.type.startsWith('image/') || file.name.match(/\.(jpg|jpeg|png|webp|heic)$/i)) {
      setActiveTab('camera');
      handlePhotoUploadAndScan(file);
      return;
    }

    setReadingFile(true);
    setReadingFileName(file.name);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const parsed = await parseSpreadsheetBuffer(buffer, file.name);
        if (parsed.length === 0) {
          setErrorMsg('ไม่พบข้อมูลรายชื่อในไฟล์ กรุณาตรวจสอบหัวคอลัมน์ หรือใช้ไฟล์แม่แบบ Excel/CSV');
          return;
        }
        setStudentsList(parsed);
      } catch (err: any) {
        setErrorMsg('ไม่สามารถอ่านไฟล์ได้: ' + err.message);
      } finally {
        setReadingFile(false);
      }
    };
    reader.onerror = () => {
      setErrorMsg('เกิดข้อผิดพลาดในการเปิดไฟล์');
      setReadingFile(false);
    };
    reader.readAsArrayBuffer(file);
  };

  // Handle Photo OCR
  const handlePhotoUploadAndScan = async (file: File) => {
    setErrorMsg(null);
    setSelectedPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    setScanningPhoto(true);

    try {
      // 1. Compress image on client via canvas (zero CPU lag, under 400KB)
      const compressed = await compressImageForUpload(file);

      // 2. Send to backend AI Vision endpoint
      const formData = new FormData();
      formData.append('image', compressed);
      if (targetClassroom) formData.append('classroom', targetClassroom);

      const customKey = typeof window !== 'undefined' ? localStorage.getItem('classme_gemini_api_key') : null;
      if (customKey) formData.append('api_key', customKey);

      const res = await scanRosterWithAi(formData);
      if (res.status === 'success' && res.data?.students?.length > 0) {
        const mapped: StudentDraft[] = res.data.students.map((st: any, idx: number) => ({
          id: `ai-${Date.now()}-${idx}`,
          student_number: st.student_number || idx + 1,
          student_code: st.student_code || `100${String(idx + 1).padStart(2, '0')}`,
          title: st.title || 'นาย',
          first_name: st.first_name || st.name || '',
          last_name: st.last_name || '',
          gender: st.gender === 'female' ? 'female' : 'male',
          guardian_phone: st.guardian_phone || '',
        }));
        setStudentsList(mapped);
      } else {
        setErrorMsg('AI ตรวจสอบภาพถ่ายแล้ว ไม่พบรายชื่อนักเรียนในภาพนี้ กรุณาถ่ายภาพให้ชัดเจนขึ้นหรือลองอัปโหลดด้วยไฟล์ CSV/Excel');
      }
    } catch (err: any) {
      setErrorMsg('เกิดข้อผิดพลาดในการสแกนภาพด้วย AI: ' + (err.message || 'โปรดตรวจสอบการเชื่อมต่อ'));
    } finally {
      setScanningPhoto(false);
    }
  };

  // Handle Clipboard text paste or Google Sheets URL
  const handleParsePastedText = async () => {
    setErrorMsg(null);
    const trimmed = pastedText.trim();
    if (!trimmed) {
      setErrorMsg('กรุณาวางข้อความหรือลิงก์ Google Sheets ก่อนกดแปลงข้อมูล');
      return;
    }

    // Check if user pasted a Google Sheets URL
    if (trimmed.includes('docs.google.com/spreadsheets/d/')) {
      setReadingFile(true);
      setReadingFileName('Google Sheets');
      try {
        const parsed = await fetchGoogleSheetByUrl(trimmed);
        setStudentsList(parsed);
      } catch (err: any) {
        setErrorMsg('ไม่สามารถนำเข้าจากลิงก์ Google Sheets ได้: ' + err.message);
      } finally {
        setReadingFile(false);
      }
      return;
    }

    const parsed = parseTextToStudents(trimmed);
    if (parsed.length === 0) {
      setErrorMsg('ไม่สามารถแยกข้อมูลได้ กรุณาก๊อปปี้จากตาราง Excel หรือ Google Sheets โดยตรง');
      return;
    }
    setStudentsList(parsed);
  };

  // Update a single draft student
  const handleUpdateStudent = (id: string | number, field: keyof StudentDraft, value: any) => {
    setStudentsList((prev) =>
      prev.map((st) => (st.id === id ? { ...st, [field]: value } : st))
    );
  };

  // Remove a draft student
  const handleRemoveStudent = (id: string | number) => {
    setStudentsList((prev) => prev.filter((st) => st.id !== id));
  };

  // Add empty row
  const handleAddRow = () => {
    const nextNum = studentsList.length + 1;
    setStudentsList((prev) => [
      ...prev,
      {
        id: `manual-${Date.now()}`,
        student_number: nextNum,
        student_code: `100${String(nextNum).padStart(2, '0')}`,
        title: 'นาย',
        first_name: '',
        last_name: '',
        gender: 'male',
        guardian_phone: '',
      },
    ]);
  };

  // Save Batch to Backend
  const handleSaveBatch = async () => {
    if (!targetClassroom) {
      setErrorMsg('กรุณาเลือกห้องเรียนก่อนบันทึก');
      return;
    }
    if (studentsList.length === 0) {
      setErrorMsg('ยังไม่มีรายชื่อนักเรียนที่จะบันทึก');
      return;
    }

    // Validation: Check empty names
    const invalid = studentsList.find((s) => !s.first_name.trim() || !s.last_name.trim());
    if (invalid) {
      setErrorMsg(`เลขที่ ${invalid.student_number} ยังกรอกชื่อหรือนามสกุลไม่ครบ`);
      return;
    }

    try {
      setSavingBatch(true);
      setErrorMsg(null);

      const payload = {
        classroom: targetClassroom,
        students: studentsList.map((st) => ({
          student_number: st.student_number,
          student_code: st.student_code,
          title: st.title,
          first_name: st.first_name,
          last_name: st.last_name,
          gender: st.gender,
          guardian_phone: st.guardian_phone || null,
        })),
      };

      const res = await batchImportStudents(payload);
      if (res.status === 'success') {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setSavingBatch(false);
    }
  };

  const maleCount = studentsList.filter((s) => s.gender === 'male').length;
  const femaleCount = studentsList.filter((s) => s.gender === 'female').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-pink-100 shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Top Header */}
        <div className="p-5 border-b border-pink-50 flex items-center justify-between bg-linear-to-r from-pink-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-pink-500 text-white flex items-center justify-center shadow-md shadow-pink-200">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                นำเข้ารายชื่อนักเรียน (Student Roster Import)
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                เลือกรูปแบบที่ต้องการ: ลากไฟล์ Excel/CSV, สแกนจากภาพถ่าย AI, หรือคัดลอกวางจากตาราง
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Classroom selector banner */}
        <div className="px-6 py-3.5 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-pink-600" />
            <span className="font-bold text-slate-700">นำเข้าสำหรับห้องเรียน:</span>
            {classrooms.length > 0 ? (
              <Select
                value={targetClassroom}
                onChange={(e) => setTargetClassroom(e.target.value)}
                className="font-bold text-slate-900 bg-white"
              >
                {classrooms.map((c) => (
                  <option key={c.id || c.name} value={c.name}>
                    ห้อง {c.name} ({c.students_count || 0} คน)
                  </option>
                ))}
              </Select>
            ) : (
              <span className="font-extrabold text-pink-700 px-2 py-0.5 bg-pink-100 rounded-lg">
                ห้อง {targetClassroom || '1/1'}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={downloadSampleTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-pink-300 text-slate-700 hover:text-pink-600 text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-pink-500" />
            <span>ดาวน์โหลดแม่แบบ Excel / CSV</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Error Message Alert */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center justify-between text-xs font-semibold animate-in fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-700">✕</button>
            </div>
          )}

          {/* TAB BUTTONS (3 MODES) */}
          {studentsList.length === 0 && (
            <div className="space-y-4">
              <div className="flex p-1 bg-slate-100/80 rounded-2xl border border-slate-200 max-w-xl mx-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('file')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'file'
                      ? 'bg-white text-pink-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4 text-pink-500" />
                  <span>1. โยนไฟล์ (Excel / CSV)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('camera')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'camera'
                      ? 'bg-white text-pink-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Camera className="w-4 h-4 text-pink-500" />
                  <span>2. ถ่ายรูป / สแกน AI</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('paste')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'paste'
                      ? 'bg-white text-pink-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ClipboardCopy className="w-4 h-4 text-pink-500" />
                  <span>3. คัดลอกวางจากตาราง</span>
                </button>
              </div>

              {/* TAB 1: FILE DRAG & DROP */}
              {activeTab === 'file' && (
                readingFile ? (
                  <div className="border-2 border-pink-300 bg-pink-50/70 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-4 animate-in fade-in">
                    <div className="w-16 h-16 rounded-2xl bg-pink-500 text-white flex items-center justify-center shadow-lg shadow-pink-200">
                      <RefreshCw className="w-8 h-8 animate-spin" />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-base font-black text-slate-800">
                        กำลังโหลดไฟล์และประมวลผลข้อมูล...
                      </h3>
                      {readingFileName && (
                        <p className="text-xs text-pink-700 font-bold bg-pink-100/80 px-3 py-1 rounded-full inline-block">
                          📄 {readingFileName}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 font-medium">
                        กรุณารอสักครู่ ระบบกำลังอ่านและสกัดรายชื่อนักเรียน เลขที่ และรหัสประจำตัว
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragOver(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleProcessFile(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
                      isDragOver
                        ? 'border-pink-500 bg-pink-50/50 scale-[0.99]'
                        : 'border-slate-200 hover:border-pink-400 bg-slate-50/40 hover:bg-pink-50/20'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv,.txt,.tsv,image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleProcessFile(e.target.files[0]);
                        }
                      }}
                    />

                    <div className="w-14 h-14 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center shadow-xs">
                      <UploadCloud className="w-7 h-7" />
                    </div>

                    <div>
                      <h3 className="text-sm font-black text-slate-800">
                        ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 font-medium">
                        รองรับ <span className="font-bold text-pink-600">Excel (.xlsx, .xls)</span>, <span className="font-bold text-pink-600">Google Sheets</span>, <span className="font-bold text-pink-600">.CSV</span>, หรือรูปถ่ายตาราง
                      </p>
                    </div>

                    <span className="text-[11px] font-semibold text-emerald-600 mt-2 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-200">
                      ✨ รองรับไฟล์ .xlsx จาก Google Sheets และ Excel ได้โดยตรง ไม่ต้องแปลงไฟล์
                    </span>
                  </div>
                )
              )}

              {/* TAB 2: AI CAMERA / PHOTO SCAN */}
              {activeTab === 'camera' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Option A: Take photo from camera */}
                    <div
                      onClick={() => cameraInputRef.current?.click()}
                      className="border-2 border-dashed border-pink-200 hover:border-pink-500 rounded-3xl p-6 bg-pink-50/20 hover:bg-pink-50/40 text-center flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handlePhotoUploadAndScan(e.target.files[0]);
                          }
                        }}
                      />
                      <div className="w-12 h-12 rounded-2xl bg-pink-500 text-white flex items-center justify-center shadow-sm">
                        <Camera className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-black text-slate-800">เปิดกล้องถ่ายรูปใบรายชื่อ</span>
                      <span className="text-[11px] text-slate-500">ถ่ายจากเอกสารกระดาษ / สมุด ปพ.</span>
                    </div>

                    {/* Option B: Upload existing photo image */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-200 hover:border-pink-400 rounded-3xl p-6 bg-slate-50/40 hover:bg-pink-50/20 text-center flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/heic"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handlePhotoUploadAndScan(e.target.files[0]);
                          }
                        }}
                      />
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center shadow-2xs">
                        <UploadCloud className="w-6 h-6 text-pink-600" />
                      </div>
                      <span className="text-xs font-black text-slate-800">อัปโหลดรูปภาพที่มีในเครื่อง</span>
                      <span className="text-[11px] text-slate-500">รองรับไฟล์ JPG, PNG, WEBP</span>
                    </div>
                  </div>

                  {scanningPhoto && (
                    <div className="p-8 bg-pink-50 border-2 border-pink-300 rounded-3xl text-center space-y-3 animate-in fade-in shadow-md shadow-pink-100">
                      <div className="w-14 h-14 rounded-2xl bg-pink-500 text-white flex items-center justify-center mx-auto shadow-md shadow-pink-200">
                        <RefreshCw className="w-7 h-7 animate-spin" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-pink-950">
                          กำลังส่งให้ AI (Gemini Vision) สแกนตรวจจับรายชื่อนักเรียนจริงจากภาพ...
                        </h4>
                        <p className="text-xs text-pink-700 font-medium">
                          ระบบกำลังวิเคราะห์ข้อความและตารางรายชื่อในภาพจริง กรุณารอสักครู่ (ประมาณ 3-6 วินาที)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: SMART COPY-PASTE */}
              {activeTab === 'paste' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">วางข้อความตาราง หรือวางลิงก์ Google Sheets (Ctrl+V):</span>
                    <button
                      type="button"
                      onClick={() => {
                        setPastedText(
                          '1\t10001\tนายกิตติศักดิ์ มีเจริญ\t0812345678\n' +
                          '2\t10002\tนายชานนท์ สุขเกษม\t0823456789\n' +
                          '3\t10003\tนางสาวณัฐธิดา วงศ์สวัสดิ์\t0834567890\n' +
                          '4\t10004\tนางสาวทิพวรรณ บุญส่ง\t0845678901\n' +
                          '5\t10005\tนายธนภัทร จันทร์เพ็ญ\t0856789012'
                        );
                      }}
                      className="text-pink-600 hover:underline font-semibold cursor-pointer"
                    >
                      กดใส่ข้อมูลตัวอย่าง
                    </button>
                  </div>

                  <textarea
                    rows={6}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder={`ก๊อปปี้คอลัมน์จาก Excel หรือ Google Sheets แล้วกดวางได้เลย หรือวางลิงก์ Google Sheets เช่น:\nhttps://docs.google.com/spreadsheets/d/...\n\nตัวอย่างข้อความตาราง:\n1\t10001\tนายกิตติศักดิ์ มีเจริญ\t0812345678\n2\t10002\tนางสาวณัฐธิดา วงศ์สวัสดิ์\t0823456789`}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-400 placeholder:text-slate-400"
                  />

                  <div className="flex justify-end">
                    <Button
                      onClick={handleParsePastedText}
                      variant="primary"
                      size="sm"
                      icon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      แปลงข้อมูลเป็นรายชื่อนักเรียน
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: LIVE EDITABLE PREVIEW TABLE */}
          {studentsList.length > 0 && (
            <div className="space-y-4 animate-in fade-in">
              {/* Summary Stats Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-pink-50/60 rounded-2xl border border-pink-100">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 rounded-xl bg-pink-600 text-white text-xs font-black shadow-xs">
                    พร้อมนำเข้า {studentsList.length} คน
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <span className="text-blue-600">ชาย {maleCount} คน</span>
                    <span>•</span>
                    <span className="text-pink-600">หญิง {femaleCount} คน</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-pink-300 text-slate-700 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-pink-600" />
                    <span>เพิ่มแถว</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStudentsList([]);
                      setPastedText('');
                      setSelectedPhoto(null);
                      setPhotoPreview(null);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>เริ่มใหม่</span>
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs bg-white">
                <div className="max-h-[380px] overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3 w-14 text-center">เลขที่</th>
                        <th className="py-2.5 px-3 w-28">รหัสนักเรียน</th>
                        <th className="py-2.5 px-3 w-24">คำนำหน้า</th>
                        <th className="py-2.5 px-3">ชื่อจริง</th>
                        <th className="py-2.5 px-3">นามสกุล</th>
                        <th className="py-2.5 px-3 w-24 text-center">เพศ</th>
                        <th className="py-2.5 px-3 w-32">เบอร์ผู้ปกครอง</th>
                        <th className="py-2.5 px-2 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {studentsList.map((st) => (
                        <tr key={st.id} className="hover:bg-pink-50/20 transition-colors">
                          {/* Number */}
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              value={st.student_number}
                              onChange={(e) => handleUpdateStudent(st.id, 'student_number', parseInt(e.target.value, 10) || 1)}
                              className="w-12 text-center p-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:bg-white focus:outline-pink-400"
                            />
                          </td>

                          {/* Code */}
                          <td className="p-2">
                            <input
                              type="text"
                              value={st.student_code}
                              onChange={(e) => handleUpdateStudent(st.id, 'student_code', e.target.value)}
                              className="w-full p-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:bg-white focus:outline-pink-400"
                            />
                          </td>

                          {/* Title */}
                          <td className="p-2">
                            <select
                              value={st.title}
                              onChange={(e) => {
                                const newTitle = e.target.value;
                                handleUpdateStudent(st.id, 'title', newTitle);
                                if (['นางสาว', 'ด.ญ.', 'เด็กหญิง', 'นาง'].includes(newTitle)) {
                                  handleUpdateStudent(st.id, 'gender', 'female');
                                } else {
                                  handleUpdateStudent(st.id, 'gender', 'male');
                                }
                              }}
                              className="w-full p-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:outline-pink-400"
                            >
                              <option value="นาย">นาย</option>
                              <option value="นางสาว">นางสาว</option>
                              <option value="ด.ช.">ด.ช.</option>
                              <option value="ด.ญ.">ด.ญ.</option>
                              <option value="เด็กชาย">เด็กชาย</option>
                              <option value="เด็กหญิง">เด็กหญิง</option>
                            </select>
                          </td>

                          {/* First name */}
                          <td className="p-2">
                            <input
                              type="text"
                              value={st.first_name}
                              onChange={(e) => handleUpdateStudent(st.id, 'first_name', e.target.value)}
                              placeholder="ชื่อจริง"
                              className="w-full p-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:bg-white focus:outline-pink-400"
                            />
                          </td>

                          {/* Last name */}
                          <td className="p-2">
                            <input
                              type="text"
                              value={st.last_name}
                              onChange={(e) => handleUpdateStudent(st.id, 'last_name', e.target.value)}
                              placeholder="นามสกุล"
                              className="w-full p-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:bg-white focus:outline-pink-400"
                            />
                          </td>

                          {/* Gender */}
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleUpdateStudent(st.id, 'gender', st.gender === 'male' ? 'female' : 'male')}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                                st.gender === 'female'
                                  ? 'bg-pink-100 text-pink-700 border-pink-200'
                                  : 'bg-blue-100 text-blue-700 border-blue-200'
                              }`}
                            >
                              {st.gender === 'female' ? 'หญิง' : 'ชาย'}
                            </button>
                          </td>

                          {/* Guardian phone */}
                          <td className="p-2">
                            <input
                              type="text"
                              value={st.guardian_phone || ''}
                              onChange={(e) => handleUpdateStudent(st.id, 'guardian_phone', e.target.value)}
                              placeholder="08X-XXX-XXXX"
                              className="w-full p-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:bg-white focus:outline-pink-400"
                            />
                          </td>

                          {/* Delete row */}
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveStudent(st.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="ลบแถวนี้"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <Button onClick={onClose} variant="secondary" size="md">
            ยกเลิก
          </Button>

          {studentsList.length > 0 && (
            <Button
              onClick={handleSaveBatch}
              variant="primary"
              size="md"
              loading={savingBatch}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              ยืนยันและนำเข้าสู่ห้อง {targetClassroom} ({studentsList.length} คน)
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
