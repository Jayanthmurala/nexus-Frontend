'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Profile from '@/components/Profile/Profile';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MyProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if we're certain the user is not authenticated
    // Don't redirect during initial loading or session resolution
    if (!authLoading && !user) {
      const timer = setTimeout(() => {
        router.replace('/login');
      }, 100); // Small delay to prevent race conditions
      return () => clearTimeout(timer);
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <Profile userId={user.id} />;
}
