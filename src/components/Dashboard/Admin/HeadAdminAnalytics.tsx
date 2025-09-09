'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  FileText, 
  Calendar, 
  TrendingUp, 
  Activity,
  GraduationCap,
  Building2,
  UserCheck,
  Clock
} from 'lucide-react';

interface CollegeStats {
  totalUsers: number;
  activeUsers: number;
  totalProjects: number;
  activeProjects: number;
  totalApplications: number;
  pendingApplications: number;
  totalEvents: number;
  upcomingEvents: number;
  departmentBreakdown: {
    [department: string]: {
      users: number;
      projects: number;
      applications: number;
    };
  };
  roleBreakdown: {
    student: number;
    faculty: number;
    dept_admin: number;
    placements_admin: number;
  };
  monthlyGrowth: {
    users: number;
    projects: number;
    applications: number;
  };
}

export default function HeadAdminAnalytics() {
  const [stats, setStats] = useState<CollegeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCollegeStats();
  }, []);

  const fetchCollegeStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/auth/head-admin/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error: {error}</p>
        <button 
          onClick={fetchCollegeStats}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">College Analytics</h2>
        <p className="text-gray-600">Comprehensive overview of your college's platform activity</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="w-4 h-4 mr-1" />
                +{stats.monthlyGrowth.users} this month
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Projects</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeProjects}</p>
              <p className="text-sm text-gray-500">{stats.totalProjects} total</p>
            </div>
            <FileText className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Applications</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingApplications}</p>
              <p className="text-sm text-gray-500">{stats.totalApplications} total</p>
            </div>
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Upcoming Events</p>
              <p className="text-2xl font-bold text-gray-900">{stats.upcomingEvents}</p>
              <p className="text-sm text-gray-500">{stats.totalEvents} total</p>
            </div>
            <Calendar className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Role Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <UserCheck className="w-5 h-5 mr-2" />
            User Role Distribution
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <GraduationCap className="w-4 h-4 text-blue-600 mr-2" />
                <span className="text-sm text-gray-600">Students</span>
              </div>
              <span className="font-semibold">{stats.roleBreakdown.student}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="w-4 h-4 text-green-600 mr-2" />
                <span className="text-sm text-gray-600">Faculty</span>
              </div>
              <span className="font-semibold">{stats.roleBreakdown.faculty}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Building2 className="w-4 h-4 text-purple-600 mr-2" />
                <span className="text-sm text-gray-600">Dept Admins</span>
              </div>
              <span className="font-semibold">{stats.roleBreakdown.dept_admin}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Activity className="w-4 h-4 text-orange-600 mr-2" />
                <span className="text-sm text-gray-600">Placement Admins</span>
              </div>
              <span className="font-semibold">{stats.roleBreakdown.placements_admin}</span>
            </div>
          </div>
        </div>

        {/* Department Breakdown */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Building2 className="w-5 h-5 mr-2" />
            Department Activity
          </h3>
          <div className="space-y-4">
            {Object.entries(stats.departmentBreakdown).map(([dept, data]) => (
              <div key={dept} className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-medium text-gray-900 capitalize">{dept}</h4>
                <div className="grid grid-cols-3 gap-4 mt-2 text-sm text-gray-600">
                  <div>
                    <span className="block font-medium">{data.users}</span>
                    <span>Users</span>
                  </div>
                  <div>
                    <span className="block font-medium">{data.projects}</span>
                    <span>Projects</span>
                  </div>
                  <div>
                    <span className="block font-medium">{data.applications}</span>
                    <span>Applications</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Growth Metrics */}
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          Monthly Growth
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">+{stats.monthlyGrowth.users}</p>
            <p className="text-sm text-gray-600">New Users</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">+{stats.monthlyGrowth.projects}</p>
            <p className="text-sm text-gray-600">New Projects</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">+{stats.monthlyGrowth.applications}</p>
            <p className="text-sm text-gray-600">New Applications</p>
          </div>
        </div>
      </div>
    </div>
  );
}
