'use client';

import React from 'react';
import RoleGuard from '@/components/common/RoleGuard';
import type { UserRole } from '@/contexts/AuthContext';
import AdminManagement from '@/components/Dashboard/Admin/AdminManagement';

export default function HeadAdminManagementPage() {
  const allowed: UserRole[] = ['head_admin'];
  return (
    <RoleGuard roles={allowed}>
      <AdminManagement />
    </RoleGuard>
  );
}
