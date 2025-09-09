'use client';

import React from 'react';
import RoleGuard from '@/components/common/RoleGuard';
import type { UserRole } from '@/contexts/AuthContext';
import ProjectsManagement from '@/components/Dashboard/Admin/ProjectsManagement';

export default function HeadAdminProjectsPage() {
  const allowed: UserRole[] = ['head_admin'];

  return (
    <RoleGuard roles={allowed}>
      <ProjectsManagement />
    </RoleGuard>
  );
}
