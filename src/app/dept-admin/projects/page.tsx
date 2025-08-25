'use client';

import React from 'react';
import RoleGuard from '@/components/common/RoleGuard';
import type { UserRole } from '@/contexts/AuthContext';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import toast from 'react-hot-toast';

export default function DeptAdminProjectsPage() {
  const allowed: UserRole[] = ['dept_admin'];
  const { user } = useAuth();
  const { projects, updateProject, deleteProject } = useData();

  const departmentProjects = projects.filter((p) => p.department === user?.department);
  const pending = departmentProjects.filter((p) => p.status === 'open');

  return (
    <RoleGuard roles={allowed}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Department Projects</h1>
            <p className="text-sm text-gray-600">{departmentProjects.length} total projects • {pending.length} pending approval</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Pending Approvals</h2>
          </div>
          {pending.length ? (
            <div className="space-y-3">
              {pending.map((project) => (
                <div key={project.id} className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 text-sm mb-1">{project.title}</h3>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">{project.description}</p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => {
                          deleteProject(project.id);
                          toast.success('Project rejected');
                        }}
                        className="text-red-600 hover:text-red-700 text-xs font-medium"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => {
                          updateProject(project.id, { status: 'in_progress' });
                          toast.success('Project approved');
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1 rounded"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No pending projects.</p>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">All Department Projects</h2>
          <div className="space-y-3">
            {departmentProjects.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 border rounded-md">
                <div>
                  <div className="text-sm font-medium text-gray-900">{p.title}</div>
                  <div className="text-xs text-gray-500">Status: {p.status.replace('_', ' ')}</div>
                </div>
                <div className="text-xs text-gray-500">by {p.facultyName}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
