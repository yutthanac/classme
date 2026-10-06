'use client';

import React from 'react';
import AppShell from '@/components/layout/AppShell';
import SubjectsView from '@/components/views/SubjectsView';
import { useApp } from '@/context/AppContext';

export default function SubjectsPage() {
  const { selectedClassroom, currentUser } = useApp();

  return (
    <AppShell activeTab="subjects">
      <SubjectsView initialClassroom={selectedClassroom} currentUser={currentUser} />
    </AppShell>
  );
}
