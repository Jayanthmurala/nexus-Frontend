'use client';

import React from 'react';
import RoleGuard from '@/components/common/RoleGuard';
import ApplicationReview from '@/components/Dashboard/Faculty/ApplicationReview';

export default function ApplicationsPage() {
  return (
    <RoleGuard roles={['faculty']}>
      <div className="max-w-6xl mx-auto space-y-6">
        <ApplicationReview />
      </div>
    </RoleGuard>
  );
}
