'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppDispatch } from '@/store/hooks';
import { toggleSidebar } from '@/store/slices/uiSlice';
import { LogOut, Menu } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();
  const dispatch = useAppDispatch();

  return (
    <header className="w-full border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            aria-label="Toggle sidebar"
            onClick={() => dispatch(toggleSidebar())}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="font-bold text-gray-900">Nexus</div>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover border"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 border" />
              )}
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900 leading-none">{user.name}</p>
                <p className="text-xs text-gray-500">{user.role}</p>
              </div>
              <button
                onClick={logout}
                className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          ) : (
            <div className="text-sm text-gray-600">Welcome</div>
          )}
        </div>
      </div>
    </header>
  );
}
