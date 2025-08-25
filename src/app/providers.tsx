'use client';

import React from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from '@/store/store';
import { AuthProvider } from '@/contexts/AuthContext';
import { DataProvider } from '@/contexts/DataContext';
import { Toaster } from 'react-hot-toast';
import { SessionProvider } from 'next-auth/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider store={store}>
      <SessionProvider>
        <AuthProvider>
          <DataProvider>
            {children}
            <Toaster position="top-right" />
          </DataProvider>
        </AuthProvider>
      </SessionProvider>
    </ReduxProvider>
  );
}
