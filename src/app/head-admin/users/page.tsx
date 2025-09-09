'use client';

import React from 'react';
import RoleGuard from '@/components/common/RoleGuard';
import type { UserRole } from '@/contexts/AuthContext';
import HeadAdminUserManagement from '@/components/Dashboard/Admin/HeadAdminUserManagement';

export default function HeadAdminUsersPage() {
  const allowed: UserRole[] = ['HEAD_ADMIN'];
  return (
    <RoleGuard roles={allowed}>
      <HeadAdminUserManagement />
    </RoleGuard>
  );
}
