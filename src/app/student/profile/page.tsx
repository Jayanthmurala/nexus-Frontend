'use client';

import React from 'react';
import RoleGuard from '../../../components/common/RoleGuard';
import StudentProfile from '../../../components/Profile/StudentProfile';

export default function StudentProfilePage() {
  return (
    <RoleGuard roles={['student']}>
      <StudentProfile />
    </RoleGuard>
  );
}
