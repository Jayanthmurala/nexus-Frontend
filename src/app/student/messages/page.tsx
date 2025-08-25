'use client';

import React from 'react';
import RoleGuard from '@/components/common/RoleGuard';
import type { UserRole } from '@/contexts/AuthContext';
import Messages from '@/components/Dashboard/Student/Messages';

export default function StudentMessagesPage() {
  const allowed: UserRole[] = ['student'];
  return (
    <RoleGuard roles={allowed}>
      <Messages />
    </RoleGuard>
  );
}
