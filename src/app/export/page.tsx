'use client';

import React from 'react';
import AppShell from '@/components/layout/AppShell';
import ExportExcelView from '@/components/views/ExportExcelView';
import { useApp } from '@/context/AppContext';

export default function ExportPage() {
  const { selectedClassroom } = useApp();

  return (
    <AppShell activeTab="export">
      <ExportExcelView initialClassroom={selectedClassroom} />
    </AppShell>
  );
}
