'use client';

import React from 'react';
import RoleGuard from '@/components/common/RoleGuard';
import type { UserRole } from '@/contexts/AuthContext';
import ApplicationTracker from '@/components/Dashboard/Student/ApplicationTracker';

export default function MyApplicationsPage() {
  const allowed: UserRole[] = ['student'];
  return (
    <RoleGuard roles={allowed}>
      <ApplicationTracker />
    </RoleGuard>
  );
}
