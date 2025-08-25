'use client';

import React from 'react';
import RoleGuard from '@/components/common/RoleGuard';
import { Briefcase } from 'lucide-react';
import type { UserRole } from '@/contexts/AuthContext';

export default function PlacementsPage() {
  const allowed: UserRole[] = ['student'];
  return (
    <RoleGuard roles={allowed}>
      <div className="space-y-4">
        <div className="bg-white border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-semibold text-gray-900">Placements</h1>
          </div>
          <p className="text-gray-600 text-sm">Students can explore placement opportunities. Migration in progress.</p>
        </div>
      </div>
    </RoleGuard>
  );
}
