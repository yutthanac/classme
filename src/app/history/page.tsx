'use client';

import React from 'react';
import AppShell from '@/components/layout/AppShell';
import HistoryView from '@/components/views/HistoryView';
import { useApp } from '@/context/AppContext';

export default function HistoryPage() {
  const { selectedClassroom } = useApp();

  return (
    <AppShell activeTab="history">
      <HistoryView initialClassroom={selectedClassroom} />
    </AppShell>
  );
}
