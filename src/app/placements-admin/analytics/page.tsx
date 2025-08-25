'use client';

import React from 'react';
import RoleGuard from '@/components/common/RoleGuard';
import type { UserRole } from '@/contexts/AuthContext';
import { BarChart3 } from 'lucide-react';

export default function PlacementsAdminAnalyticsPage() {
  const allowed: UserRole[] = ['placements_admin'];
  return (
    <RoleGuard roles={allowed}>
      <div className="space-y-4">
        <div className="bg-white border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-semibold text-gray-900">Analytics</h1>
          </div>
          <p className="text-gray-600 text-sm">View placement KPIs and reports. Migration in progress.</p>
        </div>
      </div>
    </RoleGuard>
  );
}
