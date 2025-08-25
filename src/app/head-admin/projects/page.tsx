'use client';

import React, { useMemo } from 'react';
import RoleGuard from '@/components/common/RoleGuard';
import type { UserRole } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';

export default function HeadAdminProjectsPage() {
  const allowed: UserRole[] = ['head_admin'];
  const { projects } = useData();

  const stats = useMemo(() => {
    const byStatus = projects.reduce(
      (acc, p) => {
        acc[p.status] = (acc[p.status] || 0) as number;
        acc[p.status]! += 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const byDept = projects.reduce((acc, p) => {
      acc[p.department] = (acc[p.department] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topDepts = Object.entries(byDept)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return { byStatus, topDepts };
  }, [projects]);

  return (
    <RoleGuard roles={allowed}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All Projects</h1>
            <p className="text-sm text-gray-600">{projects.length} projects across departments</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white border rounded-lg">
            <div className="text-xs text-gray-500">Open</div>
            <div className="text-2xl font-bold text-gray-900">{stats.byStatus['open'] || 0}</div>
          </div>
          <div className="p-4 bg-white border rounded-lg">
            <div className="text-xs text-gray-500">In Progress</div>
            <div className="text-2xl font-bold text-gray-900">{stats.byStatus['in_progress'] || 0}</div>
          </div>
          <div className="p-4 bg-white border rounded-lg">
            <div className="text-xs text-gray-500">Completed</div>
            <div className="text-2xl font-bold text-gray-900">{stats.byStatus['completed'] || 0}</div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Departments by Projects</h2>
          {stats.topDepts.length ? (
            <ul className="divide-y divide-gray-100">
              {stats.topDepts.map(([dept, count]) => (
                <li key={dept} className="py-2 flex items-center justify-between">
                  <span className="text-sm text-gray-800">{dept}</span>
                  <span className="text-xs text-gray-500">{count} projects</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No data available.</p>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Projects</h2>
          <div className="space-y-3">
            {projects.slice(0, 10).map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 border rounded-md">
                <div>
                  <div className="text-sm font-medium text-gray-900">{p.title}</div>
                  <div className="text-xs text-gray-500">{p.department} • {p.status.replace('_', ' ')}</div>
                </div>
                <div className="text-xs text-gray-500">by {p.facultyName}</div>
              </div>
            ))}
            {!projects.length && <p className="text-sm text-gray-500">No projects yet.</p>}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
