'use client';

import React from 'react';
import RoleGuard from '@/components/common/RoleGuard';
import FacultyEventsInterface from '@/components/Dashboard/Faculty/FacultyEventsInterface';

export default function FacultyEventsPage() {
  return (
    <RoleGuard roles={['faculty']}>
      <div className="max-w-6xl mx-auto space-y-6">
        <FacultyEventsInterface />
      </div>
    </RoleGuard>
  );
}
