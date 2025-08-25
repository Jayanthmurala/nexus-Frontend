'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import RoleGuard from '@/components/common/RoleGuard';
import type { UserRole } from '@/contexts/AuthContext';
import StudentProfile from '@/components/Dashboard/Student/StudentProfile';

export default function StudentProfileByIdPage() {
  const params = useParams();
  const idParam = (params as Record<string, string | string[] | undefined>)?.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;

  const allowed: UserRole[] = ['student', 'faculty'];
  return (
    <RoleGuard roles={allowed}>
      <StudentProfile userId={id} />
    </RoleGuard>
  );
}
