'use client';

import React from 'react';
import RoleGuard from '@/components/common/RoleGuard';
import type { UserRole } from '@/contexts/AuthContext';
import DeptAdminDashboard from '@/components/Dashboard/Admin/DeptAdminDashboard';

export default function DeptAdminPage() {
  const allowed: UserRole[] = ['dept_admin'];
  return (
    <RoleGuard roles={allowed}>
      <DeptAdminDashboard />
    </RoleGuard>
  );
}
