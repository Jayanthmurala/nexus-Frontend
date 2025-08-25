'use client';

import React from 'react';
import RoleGuard from '@/components/common/RoleGuard';
import type { UserRole } from '@/contexts/AuthContext';
import HeadAdminDashboard from '@/components/Dashboard/Admin/HeadAdminDashboard';

export default function HeadAdminPage() {
  const allowed: UserRole[] = ['head_admin'];
  return (
    <RoleGuard roles={allowed}>
      <HeadAdminDashboard />
    </RoleGuard>
  );
}
