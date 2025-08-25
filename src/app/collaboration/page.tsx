'use client';

import React from 'react';
import RoleGuard from '@/components/common/RoleGuard';
import CollaborationHub from '@/components/Dashboard/Faculty/CollaborationHub';

export default function CollaborationPage() {
  return (
    <RoleGuard roles={['faculty']}>
      <div className="max-w-6xl mx-auto space-y-6">
        <CollaborationHub />
      </div>
    </RoleGuard>
  );
}
