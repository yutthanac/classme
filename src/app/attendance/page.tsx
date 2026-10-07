'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import AttendanceCheckView from '@/components/views/AttendanceCheckView';
import { useApp } from '@/context/AppContext';

function AttendanceContent() {
  const { selectedClassroom, selectedSubjectId } = useApp();
  const searchParams = useSearchParams();

  const classroomParam = searchParams.get('classroom') || selectedClassroom;
  const subjectIdParam = searchParams.get('subject_id') || selectedSubjectId;
  const dateParam = searchParams.get('date');
  const periodParam = searchParams.get('period');

  return (
    <AttendanceCheckView
      initialClassroom={classroomParam}
      initialSubjectId={subjectIdParam}
      initialDate={dateParam}
      initialPeriod={periodParam}
    />
  );
}

export default function AttendancePage() {
  return (
    <AppShell activeTab="attendance">
      <Suspense fallback={null}>
        <AttendanceContent />
      </Suspense>
    </AppShell>
  );
}
