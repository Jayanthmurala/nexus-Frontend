'use client';

import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import BannerBar from './BannerBar';
import { useAuth } from '@/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return (
    <div className="min-h-screen flex flex-col">
      <BannerBar />
      <Header />
      <div className="flex-1 flex overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Render sidebar only for authenticated users */}
        {user && <Sidebar />}
        <main className="flex-1 min-w-0 h-full overflow-y-auto">
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
