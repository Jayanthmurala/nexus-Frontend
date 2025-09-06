'use client';

import React, { useEffect } from 'react';
import { useParams, redirect } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Profile from '@/components/Profile/Profile';
import { Loader2 } from 'lucide-react';

export default function UserProfilePage() {
  const params = useParams();
  const userId = params?.userId as string;
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    // If viewing own profile, redirect to /profile
    if (user && userId === user.id) {
      redirect('/profile');
      return;
    }
  }, [userId, user]);

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

  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile not found</h2>
          <p className="text-gray-600">Invalid user ID provided.</p>
        </div>
      </div>
    );
  }

  return <Profile userId={userId} isPublicView={true} />;
}
