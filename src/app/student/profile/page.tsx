'use client';

import React from 'react';
import RoleGuard from '@/components/common/RoleGuard';
import type { UserRole } from '@/contexts/AuthContext';
import StudentProfile from '@/components/Dashboard/Student/StudentProfile';

export default function StudentProfilePage() {
  const allowed: UserRole[] = ['student'];
  return (
    <RoleGuard roles={allowed}>
      <StudentProfile />
    </RoleGuard>
  );
}
