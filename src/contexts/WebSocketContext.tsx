"use client";

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useAuth } from '@/contexts/AuthContext';
import { websocketManager } from '@/lib/websocket';

interface WebSocketContextType {
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
});

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { data: session } = useSession();
  const isConnectedRef = useRef(false);

  useEffect(() => {
    if (!user || !session?.accessToken) {
      return;
    }

    // Connect to WebSocket
    const socket = websocketManager.connect(
      session.accessToken,
      user.collegeId || '',
      user.department || '',
      user.role ? [user.role] : []
    );

    if (socket) {
      socket.on('connect', () => {
        isConnectedRef.current = true;
        console.log('WebSocket connected globally');
      });

      socket.on('disconnect', () => {
        isConnectedRef.current = false;
        console.log('WebSocket disconnected globally');
      });
    }

    return () => {
      websocketManager.disconnect();
      isConnectedRef.current = false;
    };
  }, [user, session?.accessToken]);

  return (
    <WebSocketContext.Provider value={{ isConnected: isConnectedRef.current }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export const useWebSocketContext = () => useContext(WebSocketContext);
