'use client';

import React, { useEffect, useState } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  Eye,
  X,
  Phone,
  User,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  UploadCloud,
  Download,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useApp } from '@/context/AppContext';
import { Button, PageContainer, Select, LiquidWaveSpinner, TableRowSkeleton } from '@/components/ui';
import StudentImportModal from './StudentImportModal';
import ImportSpeedDial, { ImportOptionType } from '@/components/ui/import-speed-dial';

interface StudentsViewProps {
  initialClassroom?: string | null;
}

export default function StudentsView({ initialClassroom }: StudentsViewProps = {}) {
  const { selectedClassroom: appContextClassroom, selectedSubjectId: appContextSubjId } = useApp();
  const [students, setStudents] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<string>(initialClassroom || 'all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Import Modal state
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

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [viewingStudent, setViewingStudent] = useState<any | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  // Form states
  const [prefixMode, setPrefixMode] = useState<string>('นาย');
  const [customPrefix, setCustomPrefix] = useState<string>('');
  const [formData, setFormData] = useState({
    student_code: '',
    student_number: 1,
    title: 'นาย',
    first_name: '',
    last_name: '',
    classroom: initialClassroom || 'ม.4/1',
    gender: 'male',
    guardian_name: '',
    guardian_phone: '',
    status: 'active',
  });

  const [availablePrefixes, setAvailablePrefixes] = useState<string[]>([
    'นาย',
    'นางสาว',
    'ด.ช.',
    'ด.ญ.',
    'เด็กชาย',
    'เด็กหญิง',
  ]);

  useEffect(() => {
    if (initialClassroom) {
      setSelectedClassroom(initialClassroom);
      setFormData((prev) => ({ ...prev, classroom: initialClassroom }));
    }
  }, [initialClassroom]);

  useEffect(() => {
    loadClassrooms();
    loadPrefixes();
  }, []);

  const loadPrefixes = async () => {
    try {
      const res = await api.getPrefixes('student');
      if (res.data && res.data.length > 0) {
        setAvailablePrefixes(res.data.map((p: any) => p.name));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadClassrooms = async () => {
    try {
      const res = await api.getClassrooms();
      if (res.data) setClassrooms(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadStudents = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedClassroom !== 'all') params.classroom = selectedClassroom;
      if (searchTerm) params.search = searchTerm;
      const res = await api.getStudents(params);
      if (res.data) setStudents(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [selectedClassroom, searchTerm]);

  const handleOpenModal = (student?: any) => {
    if (student) {
      setEditingStudent(student);
      const isStd = availablePrefixes.includes(student.title);
      setPrefixMode(isStd ? student.title : 'other');
      setCustomPrefix(isStd ? '' : student.title);
      setFormData({
        student_code: student.student_code,
        student_number: student.student_number,
        title: student.title,
        first_name: student.first_name,
        last_name: student.last_name,
        classroom: student.classroom,
        gender: student.gender,
        guardian_name: student.guardian_name || '',
        guardian_phone: student.guardian_phone || '',
        status: student.status,
      });
    } else {
      setEditingStudent(null);
      setPrefixMode('นาย');
      setCustomPrefix('');
      setFormData({
        student_code: '',
        student_number: students.length + 1,
        title: 'นาย',
        first_name: '',
        last_name: '',
        classroom: selectedClassroom !== 'all' ? selectedClassroom : 'ม.4/1',
        gender: 'male',
        guardian_name: '',
        guardian_phone: '',
        status: 'active',
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const finalTitle = prefixMode === 'other' ? customPrefix : prefixMode;
      const payload = {
        ...formData,
        title: finalTitle,
      };

      if (editingStudent) {
        await api.updateStudent(editingStudent.id, payload);
      } else {
        await api.createStudent(payload);
      }
      setIsModalOpen(false);
      loadStudents();
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('ยืนยันที่จะลบข้อมูลนักเรียนรายนี้?')) return;
    try {
      await api.deleteStudent(id);
      loadStudents();
    } catch (err: any) {
      alert('ไม่สามารถลบได้: ' + err.message);
    }
  };

  const handleViewProfile = async (id: number) => {
    try {
      setViewLoading(true);
      setViewingStudent(null);
      const res = await api.getStudent(id);
      if (res.data) setViewingStudent(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setViewLoading(false);
    }
  };

  const handleExportExcel = () => {
    try {
      setExporting(true);
      const targetRoom =
        selectedClassroom !== 'all'
          ? selectedClassroom
          : appContextClassroom || (classrooms[0]?.name ?? '1/1');
      const downloadUrl = api.getExportExcelUrl(targetRoom, appContextSubjId || undefined);
      window.open(downloadUrl, '_blank');
    } catch (e: any) {
      alert('ส่งออกไฟล์ Excel ไม่สำเร็จ: ' + e.message);
    } finally {
      setTimeout(() => setExporting(false), 800);
    }
  };

  return (
    <PageContainer>
      {/* Search & Filter Header (White 60 - Pink 30 - Sky Blue 10) */}
      <div className="bg-white p-5 rounded-2xl border border-pink-100/80 flex flex-wrap items-center justify-between gap-4 shadow-xs relative z-30">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, สกุล หรือรหัสนักเรียน..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-400 font-medium"
            />
          </div>

          {/* Classroom filter (Sky Blue tag style) */}
          <Select
            value={selectedClassroom}
            onChange={(e) => setSelectedClassroom(e.target.value)}
          >
            <option value="all">ทุกห้องเรียน ({students.length} คน)</option>
            {classrooms.map((c) => (
              <option key={c.id} value={c.name}>
                ห้อง {c.name}
              </option>
            ))}
          </Select>
        </div>

        {/* Action Buttons: Export Excel + Import Speed Dial + Add single student */}
        <div className="flex items-center gap-2.5">
          <Button
            onClick={handleExportExcel}
            variant="accent"
            loading={exporting}
            icon={<Download className="w-4 h-4" />}
          >
            <span>ส่งออก Excel</span>
          </Button>

          {/* Animated Speed Dial with curved spring arc transition */}
          <ImportSpeedDial onSelectOption={handleSelectImportOption} />

          <Button
            onClick={() => handleOpenModal()}
            variant="primary"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มนักเรียนใหม่</span>
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-pink-100/70 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-10 flex flex-col items-center justify-center">
            <LiquidWaveSpinner
              size="sm"
              words={[
                'กำลังโหลดรายชื่อนักเรียน...',
                'กำลังดึงข้อมูลชั้นเรียนและเลขที่...',
                'กำลังประมวลผลข้อมูลการติดต่อ...',
              ]}
            />
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">ไม่พบรายชื่อนักเรียน</div>
        ) : (
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
                    <td className="py-3 px-4 text-center font-medium text-slate-600">{st.student_number}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{st.student_code}</td>
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
                    <td className="py-3 px-4 text-slate-600">{st.guardian_name || '-'}</td>
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
                          onClick={() => handleViewProfile(st.id)}
                          variant="ghost"
                          size="icon"
                          className="hover:text-sky-600"
                          title="ดูประวัติการเข้าเรียน"
                          aria-label="ดูประวัติการเข้าเรียน"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          onClick={() => handleOpenModal(st)}
                          variant="ghost"
                          size="icon"
                          className="hover:text-pink-600"
                          title="แก้ไขข้อมูล"
                          aria-label="แก้ไขข้อมูล"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(st.id)}
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
        )}
      </div>

      {/* Add / Edit Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-pink-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-pink-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingStudent ? 'แก้ไขข้อมูลนักเรียน' : 'เพิ่มนักเรียนใหม่'}
              </h3>
              <Button
                onClick={() => setIsModalOpen(false)}
                variant="ghost"
                size="icon"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">รหัสนักเรียน</label>
                  <input
                    type="text"
                    required
                    value={formData.student_code}
                    onChange={(e) => setFormData({ ...formData, student_code: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-pink-400"
                    placeholder="เช่น 6701021"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">เลขที่</label>
                  <input
                    type="number"
                    required
                    value={formData.student_number}
                    onChange={(e) => setFormData({ ...formData, student_number: Number(e.target.value) })}
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
                    onChange={(e) => setPrefixMode(e.target.value)}
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
                      onChange={(e) => setCustomPrefix(e.target.value)}
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
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-pink-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">นามสกุล</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-pink-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ห้องเรียน</label>
                  <Select
                    value={formData.classroom}
                    onChange={(e) => setFormData({ ...formData, classroom: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-pink-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">เบอร์ติดต่อผู้ปกครอง</label>
                  <input
                    type="text"
                    value={formData.guardian_phone}
                    onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-pink-400"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  variant="secondary"
                  size="sm"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                >
                  บันทึกข้อมูล
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Profile & Attendance Detail Modal */}
      {viewingStudent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-pink-100 w-full max-w-xl max-h-[85vh] overflow-y-auto">
            <div className="p-5 border-b border-pink-50 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  <span className="text-pink-600 mr-1">{viewingStudent.student?.title}</span>
                  {viewingStudent.student?.first_name} {viewingStudent.student?.last_name}
                </h3>
                <p className="text-xs text-slate-500">
                  ชั้น {viewingStudent.student?.classroom} เลขที่ {viewingStudent.student?.student_number} (รหัส {viewingStudent.student?.student_code})
                </p>
              </div>
              <Button
                onClick={() => setViewingStudent(null)}
                variant="ghost"
                size="icon"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-5 space-y-5">
              {/* Stats overview */}
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-pink-50 text-center border border-pink-100">
                  <div className="text-xs text-pink-700 font-semibold">มาเรียน</div>
                  <div className="text-lg font-bold text-pink-800">
                    {viewingStudent.stats?.present || 0}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 text-center border border-amber-100">
                  <div className="text-xs text-amber-700 font-semibold">มาสาย</div>
                  <div className="text-lg font-bold text-amber-800">
                    {viewingStudent.stats?.late || 0}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-sky-50 text-center border border-sky-100">
                  <div className="text-xs text-sky-700 font-semibold">ลา</div>
                  <div className="text-lg font-bold text-sky-800">
                    {viewingStudent.stats?.leave || 0}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-rose-50 text-center border border-rose-100">
                  <div className="text-xs text-rose-700 font-semibold">ขาด</div>
                  <div className="text-lg font-bold text-rose-800">
                    {viewingStudent.stats?.absent || 0}
                  </div>
                </div>
              </div>

              {/* Rate - Sky Blue 10% */}
              <div className="p-3.5 bg-sky-50/60 border border-sky-200/70 rounded-xl flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">ร้อยละการเข้าเรียนสะสม:</span>
                <span className="text-sm font-bold text-sky-700">
                  {viewingStudent.stats?.attendance_rate || 100}%
                </span>
              </div>

              {/* History list */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-2">ประวัติการบันทึกแต่ละคาบ</h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                  {viewingStudent.history?.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">ยังไม่มีประวัติการเช็คชื่อ</div>
                  ) : (
                    viewingStudent.history?.map((att: any) => (
                      <div key={att.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
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
                          {att.status === 'present' ? 'มา' : att.status === 'late' ? 'สาย' : att.status === 'leave' ? 'ลา' : 'ขาด'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Modal Student Import Modal (File, Camera AI, Copy-Paste) */}
      <StudentImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          loadStudents();
          loadClassrooms();
        }}
        defaultClassroom={selectedClassroom !== 'all' ? selectedClassroom : null}
        classrooms={classrooms}
        initialTab={importInitialTab}
        autoTrigger={importAutoTrigger}
      />
    </PageContainer>
  );
}
