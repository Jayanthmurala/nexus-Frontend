'use client';

import React from 'react';
import RoleGuard from '@/components/common/RoleGuard';
import type { UserRole } from '@/contexts/AuthContext';
import { Users } from 'lucide-react';
import StudentsFilter from '@/components/Dashboard/Placements/StudentsFilter';

export default function PlacementsAdminStudentsPage() {
  const allowed: UserRole[] = ['placements_admin'];
  return (
    <RoleGuard roles={allowed}>
      <div className="space-y-4">
        <div className="bg-white border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-semibold text-gray-900">Students</h1>
          </div>
          <p className="text-gray-600 text-sm">Filter, sort, paginate, and export student data (CSV). Ready for API integration.</p>
        </div>
        <StudentsFilter />
      </div>
    </RoleGuard>
  );
}
