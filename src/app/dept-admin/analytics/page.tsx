'use client';

import React, { useMemo } from 'react';
import RoleGuard from '@/components/common/RoleGuard';
import type { UserRole } from '@/contexts/AuthContext';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { BarChart3, Users, FileText, Calendar } from 'lucide-react';

export default function DeptAdminAnalyticsPage() {
  const allowed: UserRole[] = ['dept_admin'];
  const { user } = useAuth();
  const { projects, applications, events } = useData();

  const data = useMemo(() => {
    const dept = user?.department;
    const deptProjects = projects.filter((p) => p.department === dept);
    const open = deptProjects.filter((p) => p.status === 'open').length;
    const inProgress = deptProjects.filter((p) => p.status === 'in_progress').length;
    const completed = deptProjects.filter((p) => p.status === 'completed').length;

    const projectIds = new Set(deptProjects.map((p) => p.id));
    const deptApps = applications.filter((a) => projectIds.has(a.projectId));
    const pendingApps = deptApps.filter((a) => a.status === 'pending').length;
    const acceptedApps = deptApps.filter((a) => a.status === 'accepted').length;
    const rejectedApps = deptApps.filter((a) => a.status === 'rejected').length;

    const now = new Date();
    const deptEvents = events.filter((e) => e.department === dept || e.department === 'All Departments');
    const upcomingEvents = deptEvents.filter((e) => e.date >= now).length;
    const pastEvents = deptEvents.filter((e) => e.date < now).length;

    // Top projects by number of applications
    const appsCountMap = new Map<string, number>();
    for (const app of deptApps) {
      appsCountMap.set(app.projectId, (appsCountMap.get(app.projectId) || 0) + 1);
    }
    const topProjects = [...appsCountMap.entries()]
      .map(([projectId, count]) => ({ projectId, count, title: deptProjects.find((p) => p.id === projectId)?.title || 'Project' }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      projectStats: { total: deptProjects.length, open, inProgress, completed },
      appStats: { total: deptApps.length, pending: pendingApps, accepted: acceptedApps, rejected: rejectedApps },
      eventStats: { total: deptEvents.length, upcoming: upcomingEvents, past: pastEvents },
      topProjects,
    };
  }, [user?.department, projects, applications, events]);

  return (
    <RoleGuard roles={allowed}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-sm text-gray-600">Department-wide KPIs and insights</p>
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

        {/* Top Projects by Applications */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Projects by Applications</h2>
          {data.topProjects.length ? (
            <ul className="divide-y divide-gray-100">
              {data.topProjects.map((item) => (
                <li key={item.projectId} className="py-3 flex items-center justify-between">
                  <span className="text-sm text-gray-800">{item.title}</span>
                  <span className="text-xs text-gray-500">{item.count} applications</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No applications yet.</p>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
