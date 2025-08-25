'use client';

import React from 'react';
import RoleGuard from '@/components/common/RoleGuard';
import type { UserRole } from '@/contexts/AuthContext';
import { Settings, Users, Shield } from 'lucide-react';

export default function HeadAdminManagementPage() {
  const allowed: UserRole[] = ['head_admin'];
  return (
    <RoleGuard roles={allowed}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Management</h1>
            <p className="text-sm text-gray-600">Manage platform administrators and settings</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 bg-white border rounded-lg">
            <div className="flex items-center mb-3">
              <Users className="w-5 h-5 text-blue-600 mr-2" />
              <h2 className="text-sm font-semibold text-gray-900">Department Admins</h2>
            </div>
            <p className="text-sm text-gray-600">Add, remove, or update department administrators. (Coming soon)</p>
          </div>

          <div className="p-6 bg-white border rounded-lg">
            <div className="flex items-center mb-3">
              <Shield className="w-5 h-5 text-green-600 mr-2" />
              <h2 className="text-sm font-semibold text-gray-900">Access Control</h2>
            </div>
            <p className="text-sm text-gray-600">Configure roles and permissions. (Coming soon)</p>
          </div>

          <div className="p-6 bg-white border rounded-lg md:col-span-2">
            <div className="flex items-center mb-3">
              <Settings className="w-5 h-5 text-purple-600 mr-2" />
              <h2 className="text-sm font-semibold text-gray-900">System Settings</h2>
            </div>
            <p className="text-sm text-gray-600">Platform-wide configuration and preferences. (Coming soon)</p>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
