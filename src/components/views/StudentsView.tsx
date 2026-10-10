'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Download } from 'lucide-react';
import { api } from '@/lib/api';
import { useApp } from '@/context/AppContext';
import { Button, PageContainer, Select } from '@/components/ui';
import StudentImportModal from './StudentImportModal';
import ImportSpeedDial, { ImportOptionType } from '@/components/ui/import-speed-dial';
import { useStudents } from '@/hooks/useStudents';
import { useStudentForm } from '@/hooks/useStudentForm';
import { StudentTable } from './students/StudentTable';
import { StudentFormModal } from './students/StudentFormModal';
import { StudentProfileModal } from './students/StudentProfileModal';
import { Student, StudentProfileData, ClassroomOption } from '@/types/student';

interface StudentsViewProps {
  initialClassroom?: string | null;
}

export default function StudentsView({ initialClassroom }: StudentsViewProps = {}) {
  const { selectedClassroom: appContextClassroom, selectedSubjectId: appContextSubjId } = useApp();

  // Classroom list for dropdown filter
  const [classrooms, setClassrooms] = useState<ClassroomOption[]>([]);
  const [exporting, setExporting] = useState(false);

  // Student listing custom hook
  const {
    students,
    loading,
    selectedClassroom,
    setSelectedClassroom,
    searchTerm,
    setSearchTerm,
    loadStudents,
    deleteStudent,
  } = useStudents({ initialClassroom });

  // Student form modal custom hook
  const {
    isModalOpen,
    editingStudent,
    submitting,
    formData,
    prefixMode,
    customPrefix,
    availablePrefixes,
    setPrefixMode,
    setCustomPrefix,
    openCreateModal,
    openEditModal,
    closeModal,
    updateField,
    submitForm,
  } = useStudentForm();

  // Student profile & stats modal state
  const [viewingStudent, setViewingStudent] = useState<StudentProfileData | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  // Import Speed Dial & Multi-Modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importInitialTab, setImportInitialTab] = useState<'file' | 'camera' | 'paste'>('file');
  const [importAutoTrigger, setImportAutoTrigger] = useState<'file' | 'camera' | 'image' | null>(null);

  const loadClassrooms = useCallback(async () => {
    try {
      const res = await api.getClassrooms();
      if (res.data) setClassrooms(res.data);
    } catch (e) {
      console.error('Failed to load classrooms:', e);
    }
  }, []);

  useEffect(() => {
    loadClassrooms();
  }, [loadClassrooms]);

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

  const handleViewProfile = async (id: number) => {
    try {
      setViewLoading(true);
      setViewingStudent(null);
      const res = await api.getStudent(id);
      if (res.data) {
        setViewingStudent(res.data);
      }
    } catch (err) {
      console.error('Failed to load student profile:', err);
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

          {/* Classroom filter */}
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

          {/* Animated Speed Dial */}
          <ImportSpeedDial onSelectOption={handleSelectImportOption} />

          <Button
            onClick={() => openCreateModal(selectedClassroom, students.length + 1)}
            variant="primary"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มนักเรียนใหม่</span>
          </Button>
        </div>
      </div>

      {/* Main Student Table */}
      <StudentTable
        students={students}
        loading={loading}
        onViewProfile={handleViewProfile}
        onEditStudent={(st: Student) => openEditModal(st)}
        onDeleteStudent={deleteStudent}
      />

      {/* Add / Edit Student Modal */}
      <StudentFormModal
        isOpen={isModalOpen}
        isEditing={Boolean(editingStudent)}
        formData={formData}
        prefixMode={prefixMode}
        customPrefix={customPrefix}
        availablePrefixes={availablePrefixes}
        classrooms={classrooms}
        submitting={submitting}
        onClose={closeModal}
        onSubmit={(e) => submitForm(e, loadStudents)}
        onFieldChange={updateField}
        onPrefixModeChange={setPrefixMode}
        onCustomPrefixChange={setCustomPrefix}
      />

      {/* Student Profile & Attendance Detail Modal */}
      <StudentProfileModal
        isOpen={Boolean(viewingStudent || viewLoading)}
        isLoading={viewLoading}
        studentData={viewingStudent}
        onClose={() => setViewingStudent(null)}
      />

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
