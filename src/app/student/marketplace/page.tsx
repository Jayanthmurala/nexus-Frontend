'use client';

import React from 'react';
import RoleGuard from '@/components/common/RoleGuard';
import type { UserRole } from '@/contexts/AuthContext';
import ProjectMarketplace from '@/components/Dashboard/Student/ProjectMarketplace';

export default function StudentMarketplacePage() {
  const allowed: UserRole[] = ['student'];
  return (
    <RoleGuard roles={allowed}>
      <ProjectMarketplace />
    </RoleGuard>
  );
}
