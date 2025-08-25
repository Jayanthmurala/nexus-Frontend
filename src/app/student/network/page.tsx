'use client';

import React from 'react';
import RoleGuard from '@/components/common/RoleGuard';
import type { UserRole } from '@/contexts/AuthContext';
import Network from '@/components/Dashboard/Student/Network';

export default function StudentNetworkPage() {
  const allowed: UserRole[] = ['student'];
  return (
    <RoleGuard roles={allowed}>
      <Network />
    </RoleGuard>
  );
}
