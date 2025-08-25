'use client';

import React from 'react';
import RoleGuard from '@/components/common/RoleGuard';
import type { UserRole } from '@/contexts/AuthContext';
import StudentCollaborationHub from '@/components/Dashboard/Student/StudentCollaborationHub';

export default function StudentCollaborationPage() {
  const allowed: UserRole[] = ['student'];
  return (
    <RoleGuard roles={allowed}>
      <StudentCollaborationHub />
    </RoleGuard>
  );
}
