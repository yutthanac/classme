'use client';

import React from 'react';
import AppShell from '@/components/layout/AppShell';
import RolesView from '@/components/views/RolesView';
import { useApp } from '@/context/AppContext';

export default function RolesPage() {
  const { currentUser } = useApp();

  return (
    <AppShell activeTab="roles">
      <RolesView currentUser={currentUser} />
    </AppShell>
  );
}
