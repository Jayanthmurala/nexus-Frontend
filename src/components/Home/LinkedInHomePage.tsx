'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProfileSidebar from '@/components/Home/ProfileSidebar';
import MainFeed from '@/components/Home/MainFeed';
import RightSidebar from '@/components/Home/RightSidebar';

export default function LinkedInHomePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Sidebar - Profile Summary */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            <div className="lg:sticky lg:top-8">
              <ProfileSidebar user={user} />
            </div>
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-6 order-1 lg:order-2">
            <MainFeed />
          </div>

          {/* Right Sidebar - Suggestions & Trending */}
          <div className="lg:col-span-3 order-3 hidden lg:block">
            <div className="sticky top-8 space-y-6">
              <RightSidebar />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
