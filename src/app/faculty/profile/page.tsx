'use client';

import React from 'react';
import RoleGuard from '../../../components/common/RoleGuard';
import FacultyProfile from '../../../components/Profile/FacultyProfile';

export default function FacultyProfilePage() {
  return (
    <RoleGuard roles={['faculty']}>
      <FacultyProfile />
    </RoleGuard>
  );
}
