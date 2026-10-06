'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginView from '@/components/LoginView';
import ClassroomSelectView from '@/components/views/ClassroomSelectView';
import { useApp } from '@/context/AppContext';

export default function HomePage() {
  const router = useRouter();
  const {
    currentUser,
    authChecking,
    selectedClassroom,
    setSelectedClassroom,
    login,
    logout,
  } = useApp();

  // If already logged in and a classroom is selected, go straight to dashboard
  useEffect(() => {
    if (!authChecking && currentUser && selectedClassroom) {
      router.replace('/dashboard');
    }
  }, [authChecking, currentUser, selectedClassroom, router]);

  if (authChecking) {
    return (
      <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500">
        <div className="w-8 h-8 border-3 border-pink-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-600">กำลังตรวจสอบสถานะการเข้าสู่ระบบ...</p>
      </div>
    );
  }

  // Not logged in -> Show Login View
  if (!currentUser) {
    return <LoginView onLoginSuccess={login} />;
  }

  // Logged in but no classroom selected -> Show Classroom Selection Portal (Full screen, no sidebar)
  return (
    <ClassroomSelectView
      currentUser={currentUser}
      onSelectClassroom={(name: string) => {
        setSelectedClassroom(name);
        router.push('/dashboard');
      }}
      onLogout={logout}
    />
  );
}
