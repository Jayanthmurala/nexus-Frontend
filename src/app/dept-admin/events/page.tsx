'use client';

import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import EventModerationInterface from "@/components/Dashboard/DeptAdmin/EventModerationInterface";

export default function DeptAdminEventsPage() {
  const { user } = useAuth();

  // Role guard - only department admins can access
  if (user?.role !== 'dept_admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <EventModerationInterface />;
}
