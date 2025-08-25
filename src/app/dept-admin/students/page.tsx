'use client';

import React from 'react';
import RoleGuard from '@/components/common/RoleGuard';
import type { UserRole } from '@/contexts/AuthContext';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import toast from 'react-hot-toast';

export default function DeptAdminStudentsPage() {
  const allowed: UserRole[] = ['dept_admin'];
  const { user } = useAuth();
  const { projects, applications, updateApplication } = useData();

  const deptProjects = projects.filter((p) => p.department === user?.department);
  const deptProjectIds = new Set(deptProjects.map((p) => p.id));
  const deptApplications = applications.filter((app) => deptProjectIds.has(app.projectId));
  const pending = deptApplications.filter((a) => a.status === 'pending');
  const accepted = deptApplications.filter((a) => a.status === 'accepted');
  const rejected = deptApplications.filter((a) => a.status === 'rejected');

  const getProjectTitle = (id: string) => deptProjects.find((p) => p.id === id)?.title || 'Project';

  return (
    <RoleGuard roles={allowed}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Students Management</h1>
            <p className="text-sm text-gray-600">{deptApplications.length} applications • {pending.length} pending</p>
          </div>
        </div>

        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Applications</h2>
          {pending.length ? (
            <div className="space-y-3">
              {pending.map((app) => (
                <div key={app.id} className="p-4 border rounded-lg flex items-start justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{app.studentName}</div>
                    <div className="text-xs text-gray-600">Applied for: {getProjectTitle(app.projectId)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { updateApplication(app.id, 'rejected'); toast.success('Application rejected'); }}
                      className="text-xs font-medium text-red-600 hover:text-red-700"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => { updateApplication(app.id, 'accepted'); toast.success('Application accepted'); }}
                      className="text-xs font-medium text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No pending applications.</p>
          )}
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Accepted</h3>
            {accepted.length ? (
              <ul className="space-y-2">
                {accepted.map((app) => (
                  <li key={app.id} className="text-sm text-gray-700 flex items-center justify-between">
                    <span>{app.studentName}</span>
                    <span className="text-xs text-gray-500">for {getProjectTitle(app.projectId)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No accepted applications yet.</p>
            )}
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Rejected</h3>
            {rejected.length ? (
              <ul className="space-y-2">
                {rejected.map((app) => (
                  <li key={app.id} className="text-sm text-gray-700 flex items-center justify-between">
                    <span>{app.studentName}</span>
                    <span className="text-xs text-gray-500">for {getProjectTitle(app.projectId)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No rejected applications.</p>
            )}
          </div>
        </section>
      </div>
    </RoleGuard>
  );
}
