'use client';

import React from 'react';
import Sidebar from './Sidebar';
import Footer from './Footer';
import BannerBar from './BannerBar';
import { useAuth } from '@/contexts/AuthContext';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { checkAuth, setUser, clearAuth } from '@/store/slices/authSlice';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const reduxUser = useAppSelector((state) => state.auth.user);
  const sidebarCollapsed = useAppSelector((state) => state.ui.sidebarCollapsed);
  
  // Sync Redux auth state with AuthContext
  useEffect(() => {
    if (user && (!reduxUser || reduxUser.id !== user.id)) {
      // Sync AuthContext user to Redux auth state
      const reduxUserData = {
        id: user.id,
        name: user.name,
        email: user.email,
        roles: [user.role.toUpperCase()], // Convert role to array format expected by Redux
        avatar: user.avatar,
        collegeMemberId: user.collegeMemberId,
        college: user.collegeId,
        department: user.department,
      };
      dispatch(setUser(reduxUserData));
      console.log('ClientLayout: Synced AuthContext user to Redux:', reduxUserData);
    } else if (!user && reduxUser) {
      // Clear Redux auth state when user logs out
      dispatch(clearAuth());
      console.log('ClientLayout: Cleared Redux auth state');
    }
  }, [dispatch, user, reduxUser]);
  
  return (
    <div className="min-h-screen flex">
      {/* Render sidebar only for authenticated users - Full height */}
      {user && <Sidebar />}
      
      {/* Main content area */}
      <div className={`flex-1 flex flex-col min-h-screen ${user ? (sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64') : ''}`}>
        <BannerBar />
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="min-h-full flex flex-col">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1">
              {children}
            </div>
            {user && <Footer />}
          </div>
        </main>
      </div>
      
      {/* Global toast container */}
      <Toaster position="top-right" toastOptions={{ duration: 2500 }} />
    </div>
  );
}
