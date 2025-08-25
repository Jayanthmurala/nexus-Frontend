'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import FacultyDashboard from './Faculty/FacultyDashboard';
import StudentDashboard from './Student/StudentDashboard';
import DeptAdminDashboard from './Admin/DeptAdminDashboard';
import PlacementsAdminDashboard from './Placements/PlacementsAdminDashboard';
import HeadAdminDashboard from './Admin/HeadAdminDashboard';

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case 'faculty':
      return <FacultyDashboard />;
    case 'student':
      return <StudentDashboard />;
    case 'dept_admin':
      return <DeptAdminDashboard />;
    case 'placements_admin':
      return <PlacementsAdminDashboard />;
    case 'head_admin':
      return <HeadAdminDashboard />;
    default:
      return(
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Coming Soon</h1>
            <p className="text-gray-600 mt-2">This role's dashboard is being migrated. For now, faculty dashboard is available.</p>
          </div>
        </div>
      );
  }
}
