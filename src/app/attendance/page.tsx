'use client';

import React from 'react';
import AppShell from '@/components/layout/AppShell';
import AttendanceCheckView from '@/components/views/AttendanceCheckView';
import { useApp } from '@/context/AppContext';

export default function AttendancePage() {
  const { selectedClassroom } = useApp();

  return (
    <AppShell activeTab="attendance">
      <AttendanceCheckView initialClassroom={selectedClassroom} />
    </AppShell>
  );
}
