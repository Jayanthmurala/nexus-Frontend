'use client';

import React from 'react';
import AuthPage from '@/components/Auth/AuthPage';
import { useAuth } from '@/contexts/AuthContext';
import LinkedInHomePage from '@/components/Home/LinkedInHomePage';

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <AuthPage />;

  return <LinkedInHomePage />;
}

