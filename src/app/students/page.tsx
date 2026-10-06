'use client';

import React from 'react';
import AppShell from '@/components/layout/AppShell';
import StudentsView from '@/components/views/StudentsView';
import { useApp } from '@/context/AppContext';

export default function StudentsPage() {
  const { selectedClassroom } = useApp();

  return (
    <AppShell activeTab="students">
      <StudentsView initialClassroom={selectedClassroom} />
    </AppShell>
  );
}
