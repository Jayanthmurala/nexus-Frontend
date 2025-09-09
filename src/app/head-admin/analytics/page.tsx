'use client';

import React from 'react';
import RoleGuard from '@/components/common/RoleGuard';
import type { UserRole } from '@/contexts/AuthContext';
import HeadAdminAnalytics from '@/components/Dashboard/Admin/HeadAdminAnalytics';

export default function HeadAdminAnalyticsPage() {
  const allowed: UserRole[] = ['HEAD_ADMIN'];

  return (
    <RoleGuard roles={allowed}>
      <HeadAdminAnalytics />
    </RoleGuard>
  );
}
