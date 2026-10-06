'use client';

import React from 'react';
import AppShell from '@/components/layout/AppShell';
import AiScanView from '@/components/views/AiScanView';
import { useApp } from '@/context/AppContext';

export default function AiScanPage() {
  const { selectedClassroom } = useApp();

  return (
    <AppShell activeTab="ai-scan">
      <AiScanView initialClassroom={selectedClassroom} />
    </AppShell>
  );
}
