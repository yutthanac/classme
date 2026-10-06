'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  api,
  getStoredUser,
  setStoredUser,
  removeAuthToken,
  getStoredClassroom,
  setStoredClassroom,
  getStoredSubjectId,
  setStoredSubjectId,
} from '@/lib/api';

interface AppContextType {
  currentUser: any | null;
  setCurrentUser: (user: any) => void;
  authChecking: boolean;
  selectedClassroom: string | null;
  setSelectedClassroom: (classroomName: string | null) => void;
  selectedSubjectId: string | null;
  setSelectedSubjectId: (subjectId: string | null) => void;
  alertCount: number;
  setAlertCount: (count: number) => void;
  login: (user: any) => void;
  logout: () => Promise<void>;
  switchClassroom: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

const ALERT_POLL_MS = 30_000;

export function AppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [selectedClassroom, setSelectedClassroomState] = useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectIdState] = useState<string | null>(null);
  const [alertCount, setAlertCount] = useState(0);

  // Initialize auth & stored classroom & stored subject
  useEffect(() => {
    async function init() {
      try {
        const stored = getStoredUser();
        if (stored) setCurrentUser(stored);

        const storedCr = getStoredClassroom();
        if (storedCr) setSelectedClassroomState(storedCr);

        const storedSubj = getStoredSubjectId();
        if (storedSubj) setSelectedSubjectIdState(storedSubj);

        // Verify with backend
        const res = await api.getMe();
        if (res.data) {
          setCurrentUser(res.data);
          setStoredUser(res.data);
        }
      } catch {
        // If not authenticated, clear
        setCurrentUser(null);
        setSelectedClassroomState(null);
        setSelectedSubjectIdState(null);
        removeAuthToken();
      } finally {
        setAuthChecking(false);
      }
    }
    init();
  }, []);

  const setSelectedClassroom = useCallback((name: string | null) => {
    setSelectedClassroomState(name);
    setStoredClassroom(name);
  }, []);

  const setSelectedSubjectId = useCallback((id: string | null) => {
    setSelectedSubjectIdState(id);
    setStoredSubjectId(id);
  }, []);

  // Poll alerts
  useEffect(() => {
    if (!currentUser) return;

    async function checkAlerts() {
      try {
        const res = await api.getAlerts();
        if (res.data) {
          setAlertCount(res.data.filter((a: any) => !a.is_read).length);
        }
      } catch {
        // ignore
      }
    }
    checkAlerts();
    const timer = setInterval(checkAlerts, ALERT_POLL_MS);
    return () => clearInterval(timer);
  }, [currentUser]);

  const login = useCallback((user: any) => {
    setCurrentUser(user);
    setStoredUser(user);
    setSelectedClassroom(null);
    setSelectedSubjectId(null);
  }, [setSelectedClassroom, setSelectedSubjectId]);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    } finally {
      setCurrentUser(null);
      setSelectedClassroom(null);
      setSelectedSubjectId(null);
      removeAuthToken();
      router.push('/login');
    }
  }, [router, setSelectedClassroom, setSelectedSubjectId]);

  const switchClassroom = useCallback(() => {
    setSelectedClassroom(null);
    setSelectedSubjectId(null);
    router.push('/classrooms');
  }, [router, setSelectedClassroom, setSelectedSubjectId]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        authChecking,
        selectedClassroom,
        setSelectedClassroom,
        selectedSubjectId,
        setSelectedSubjectId,
        alertCount,
        setAlertCount,
        login,
        logout,
        switchClassroom,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return ctx;
}
