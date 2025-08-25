'use client';

import React from 'react';
import RoleGuard from '@/components/common/RoleGuard';
import type { UserRole } from '@/contexts/AuthContext';
import { Building } from 'lucide-react';

export default function PlacementsAdminCompaniesPage() {
  const allowed: UserRole[] = ['placements_admin'];
  return (
    <RoleGuard roles={allowed}>
      <div className="space-y-4">
        <div className="bg-white border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <Building className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-semibold text-gray-900">Companies</h1>
          </div>
          <p className="text-gray-600 text-sm">Manage partner companies and contact records. Migration in progress.</p>
        </div>
      </div>
    </RoleGuard>
  );
}
