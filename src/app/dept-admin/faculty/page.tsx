'use client';

import React from 'react';
import RoleGuard from '@/components/common/RoleGuard';
import type { UserRole } from '@/contexts/AuthContext';

export default function DeptAdminFacultyPage() {
  const allowed: UserRole[] = ['dept_admin'];
  return (
    <RoleGuard roles={allowed}>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Faculty Management</h1>
        <p className="text-sm text-gray-600">Coming soon: manage faculty profiles, roles, and assignments.</p>
      </div>
    </RoleGuard>
  );
}
