'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar, { TabType } from '@/components/Sidebar';
import Header from '@/components/Header';
import { useApp } from '@/context/AppContext';

interface AppShellProps {
  activeTab: TabType;
  children: React.ReactNode;
}

export default function AppShell({ activeTab, children }: AppShellProps) {
  const router = useRouter();
  const {
    currentUser,
    authChecking,
    selectedClassroom,
    alertCount,
    setAlertCount,
    logout,
    switchClassroom,
    setCurrentUser,
  } = useApp();

  // If not authenticated, redirect to login
  useEffect(() => {
    if (!authChecking && !currentUser) {
      router.replace('/login');
    }
  }, [authChecking, currentUser, router]);

  // If authenticated but no classroom selected, redirect to classrooms portal
  useEffect(() => {
    if (!authChecking && currentUser && !selectedClassroom) {
      router.replace('/classrooms');
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

  if (!currentUser || !selectedClassroom) {
    return null; // Will redirect via useEffect
  }

  const handleTabChange = (tab: TabType) => {
    router.push('/' + tab);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white selection:bg-pink-500 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        selectedClassroom={selectedClassroom}
        onSwitchClassroom={switchClassroom}
        currentUser={currentUser}
        onLogout={logout}
      />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden bg-slate-50/40">
        <Header
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          selectedClassroom={selectedClassroom}
          onSwitchClassroom={switchClassroom}
          alertCount={alertCount}
          setAlertCount={setAlertCount}
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          onLogout={logout}
        />

        {/* View Content */}
        <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
