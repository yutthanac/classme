'use client';

import React from 'react';
import AppShell from '@/components/layout/AppShell';
import ClassroomHubView from '@/components/views/ClassroomHubView';
import { useApp } from '@/context/AppContext';

export default function DashboardPage() {
  const { selectedClassroom, currentUser, switchClassroom } = useApp();

  return (
    <AppShell activeTab="dashboard">
      {selectedClassroom && (
        <ClassroomHubView
          classroomName={selectedClassroom}
          onBack={switchClassroom}
          currentUser={currentUser}
        />
      )}
    </AppShell>
  );
}
