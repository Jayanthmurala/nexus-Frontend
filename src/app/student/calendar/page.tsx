'use client';

import React from 'react';
import RoleGuard from '@/components/common/RoleGuard';
import type { UserRole } from '@/contexts/AuthContext';
import EventCalendar from '@/components/Dashboard/Student/EventCalendar';

export default function StudentCalendarPage() {
  const allowed: UserRole[] = ['student'];
  return (
    <RoleGuard roles={allowed}>
      <EventCalendar />
    </RoleGuard>
  );
}
