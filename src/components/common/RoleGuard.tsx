'use client';

import React, { useEffect } from 'react';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/constants/routes';

export default function RoleGuard({
  roles,
  children,
}: {
  roles: UserRole[];
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && !roles.includes(user.role)) {
      router.replace(ROUTES.UNAUTHORIZED);
    }
  }, [loading, user, roles, router]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border rounded-xl p-6 text-center">
          <h2 className="text-lg font-semibold text-gray-900">Please sign in</h2>
          <p className="text-sm text-gray-600 mt-1">You need to be authenticated to view this page.</p>
        </div>
      </div>
    );
  }

  if (!roles.includes(user.role)) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return <>{children}</>;
}
