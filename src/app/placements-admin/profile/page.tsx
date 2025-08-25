'use client';

import React from 'react';
import RoleGuard from '@/components/common/RoleGuard';
import type { UserRole } from '@/contexts/AuthContext';
import AdminProfile from '@/components/Dashboard/Admin/AdminProfile';

export default function PlacementsAdminProfilePage() {
  const allowed: UserRole[] = ['placements_admin'];
  return (
    <RoleGuard roles={allowed}>
      <AdminProfile />
    </RoleGuard>
  );
}
