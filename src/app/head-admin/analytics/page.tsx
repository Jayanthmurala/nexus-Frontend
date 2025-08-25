'use client';

import React, { useMemo } from 'react';
import RoleGuard from '@/components/common/RoleGuard';
import type { UserRole } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { BarChart3, Users, FileText, Calendar } from 'lucide-react';

export default function HeadAdminAnalyticsPage() {
  const allowed: UserRole[] = ['head_admin'];
  const { projects, applications, events } = useData();

  const data = useMemo(() => {
    const open = projects.filter((p) => p.status === 'open').length;
    const inProgress = projects.filter((p) => p.status === 'in_progress').length;
    const completed = projects.filter((p) => p.status === 'completed').length;

    const pendingApps = applications.filter((a) => a.status === 'pending').length;
    const acceptedApps = applications.filter((a) => a.status === 'accepted').length;
    const rejectedApps = applications.filter((a) => a.status === 'rejected').length;

    const now = new Date();
    const upcomingEvents = events.filter((e) => e.date >= now).length;
    const pastEvents = events.filter((e) => e.date < now).length;

    return {
      projectStats: { total: projects.length, open, inProgress, completed },
      appStats: { total: applications.length, pending: pendingApps, accepted: acceptedApps, rejected: rejectedApps },
      eventStats: { total: events.length, upcoming: upcomingEvents, past: pastEvents },
    };
  }, [projects, applications, events]);

  return (
    <RoleGuard roles={allowed}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Institution Analytics</h1>
            <p className="text-sm text-gray-600">Platform-wide KPIs and insights</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-white border rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-500">Projects</span>
              <BarChart3 className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{data.projectStats.total}</div>
            <div className="text-xs text-gray-500">{data.projectStats.open} open • {data.projectStats.inProgress} in progress • {data.projectStats.completed} completed</div>
          </div>

          <div className="p-4 bg-white border rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-500">Applications</span>
              <FileText className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{data.appStats.total}</div>
            <div className="text-xs text-gray-500">{data.appStats.pending} pending • {data.appStats.accepted} accepted • {data.appStats.rejected} rejected</div>
          </div>

          <div className="p-4 bg-white border rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-500">Events</span>
              <Calendar className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{data.eventStats.total}</div>
            <div className="text-xs text-gray-500">{data.eventStats.upcoming} upcoming • {data.eventStats.past} past</div>
          </div>

          <div className="p-4 bg-white border rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-500">Students Engaged</span>
              <Users className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{data.appStats.accepted}</div>
            <div className="text-xs text-gray-500">Accepted applications</div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
