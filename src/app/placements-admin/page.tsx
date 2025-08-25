'use client';

import React from 'react';
import RoleGuard from '@/components/common/RoleGuard';
import type { UserRole } from '@/contexts/AuthContext';
import PlacementsAdminDashboard from '@/components/Dashboard/Placements/PlacementsAdminDashboard';

export default function PlacementsAdminPage() {
  const allowed: UserRole[] = ['placements_admin'];
  return (
    <RoleGuard roles={allowed}>
      <PlacementsAdminDashboard />
    </RoleGuard>
  );
}
