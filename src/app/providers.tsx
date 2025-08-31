'use client';

import React from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { SessionProvider } from 'next-auth/react';
import { store } from '@/store/store';
import { AuthProvider } from '@/contexts/AuthContext';
import { DataProvider } from '@/contexts/DataContext';
import { WebSocketProvider } from '@/contexts/WebSocketContext';
import { ToastProvider } from '@/components/ui/toast';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider store={store}>
      <SessionProvider>
        <AuthProvider>
          <DataProvider>
            <WebSocketProvider>
              <ToastProvider>
                {children}
              </ToastProvider>
            </WebSocketProvider>
          </DataProvider>
        </AuthProvider>
      </SessionProvider>
    </ReduxProvider>
  );
}
