'use client';

import React from 'react';
import RoleGuard from '@/components/common/RoleGuard';
import type { UserRole } from '@/contexts/AuthContext';
import Network from '@/components/Dashboard/Student/Network';

export default function FacultyNetworkPage() {
  const allowed: UserRole[] = ['faculty'];
  return (
    <RoleGuard roles={allowed}>
      <Network />
    </RoleGuard>
  );
}
