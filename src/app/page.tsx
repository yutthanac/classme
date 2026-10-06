'use client';

import React, { useState, useEffect } from 'react';
import Sidebar, { TabType } from '@/components/Sidebar';
import Header from '@/components/Header';
import LoginView from '@/components/LoginView';
import DashboardView from '@/components/views/DashboardView';
import AttendanceCheckView from '@/components/views/AttendanceCheckView';
import AiScanView from '@/components/views/AiScanView';
import StudentsView from '@/components/views/StudentsView';
import SubjectsView from '@/components/views/SubjectsView';
import HistoryView from '@/components/views/HistoryView';
import ExportExcelView from '@/components/views/ExportExcelView';
import AlertsView from '@/components/views/AlertsView';
import RolesView from '@/components/views/RolesView';
import { api, getStoredUser, setStoredUser, removeAuthToken } from '@/lib/api';

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [alertCount, setAlertCount] = useState<number>(0);

  // Initialize auth
  useEffect(() => {
    async function checkAuth() {
      try {
        const stored = getStoredUser();
        if (stored) {
          setCurrentUser(stored);
        }
        // Verify with backend
        const res = await api.getMe();
        if (res.data) {
          setCurrentUser(res.data);
          setStoredUser(res.data);
        }
      } catch {
        // If not authenticated or token expired, clear user
        setCurrentUser(null);
        removeAuthToken();
      } finally {
        setAuthChecking(false);
      }
    }
    checkAuth();
  }, []);

  // Poll alerts only if logged in
  useEffect(() => {
    if (!currentUser) return;

    async function checkAlerts() {
      try {
        const res = await api.getAlerts();
        if (res.data) {
          const unread = res.data.filter((a: any) => !a.is_read).length;
          setAlertCount(unread);
        }
      } catch (e) {
        // ignore background poll error
      }
    }
    checkAlerts();
    const timer = setInterval(checkAlerts, 30000);
    return () => clearInterval(timer);
  }, [currentUser]);

  const handleLoginSuccess = (user: any) => {
    setCurrentUser(user);
    setActiveTab('dashboard');
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    } finally {
      setCurrentUser(null);
      removeAuthToken();
    }
  };

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
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  // Logged in -> Show App
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white selection:bg-pink-500 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        alertCount={alertCount}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/40">
        {/* Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          alertCount={alertCount}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        {/* View Content */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && <DashboardView setActiveTab={setActiveTab} />}
          {activeTab === 'attendance' && <AttendanceCheckView />}
          {activeTab === 'ai-scan' && <AiScanView />}
          {activeTab === 'students' && <StudentsView />}
          {activeTab === 'subjects' && <SubjectsView />}
          {activeTab === 'history' && <HistoryView />}
          {activeTab === 'export' && <ExportExcelView />}
          {activeTab === 'alerts' && <AlertsView />}
          {activeTab === 'roles' && <RolesView currentUser={currentUser} />}
        </main>
      </div>
    </div>
  );
}
