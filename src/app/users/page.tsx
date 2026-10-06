'use client';

import React from 'react';
import AppShell from '@/components/layout/AppShell';
import UsersView from '@/components/views/UsersView';
import { useApp } from '@/context/AppContext';

export default function UsersPage() {
  const { currentUser, setCurrentUser } = useApp();

  return (
    <AppShell activeTab="users">
      <UsersView currentUser={currentUser} onUserUpdated={setCurrentUser} />
    </AppShell>
  );
}
