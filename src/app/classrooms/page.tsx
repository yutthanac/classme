'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ClassroomSelectView from '@/components/views/ClassroomSelectView';
import { useApp } from '@/context/AppContext';

export default function ClassroomsPage() {
  const router = useRouter();
  const { currentUser, authChecking, setSelectedClassroom, selectedSubjectId, setSelectedSubjectId, logout } = useApp();

  useEffect(() => {
    if (!authChecking && !currentUser) {
      router.replace('/login');
    }
  }, [authChecking, currentUser, router]);

  if (authChecking) {
    return (
      <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500">
        <div className="w-8 h-8 border-3 border-pink-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-600">กำลังตรวจสอบสถานะการเข้าสู่ระบบ...</p>
      </div>
    );
  }

  if (!currentUser) return null;

  const handleSelectClassroom = (classroomName: string, subjectId?: string) => {
    setSelectedClassroom(classroomName);
    if (subjectId) {
      setSelectedSubjectId(subjectId);
    }
    router.push('/dashboard');
  };

  return (
    <ClassroomSelectView
      currentUser={currentUser}
      onSelectClassroom={handleSelectClassroom}
      onLogout={logout}
      initialSubjectId={selectedSubjectId}
    />
  );
}
