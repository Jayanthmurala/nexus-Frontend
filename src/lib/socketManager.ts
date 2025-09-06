'use client';

import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';

export interface SocketEvents {
  // Connection events
  'connect': () => void;
  'disconnect': () => void;
  'user-online': (data: { userId: string }) => void;
  'user-offline': (data: { userId: string }) => void;
  
  // Messaging events
  'new-message': (message: any) => void;
  'user-typing': (data: { userId: string; displayName: string; conversationId: string }) => void;
  'user-stopped-typing': (data: { userId: string; conversationId: string }) => void;
  
  // Post events
  'new-post': (post: any) => void;
  'post-reaction-update': (data: { postId: string; type: string; action: 'add' | 'remove'; userId: string }) => void;
  
  // Badge events
  'badge-awarded': (badgePost: any) => void;
  
  // Project events
  'project-update': (data: { projectId: string; update: any }) => void;
  
  // Event events
  'event-update': (data: { eventId: string; update: any }) => void;
  
  // General notifications
  'notification': (notification: any) => void;
}

class NetworkSocketManager {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.emit = this.emit.bind(this);
    this.on = this.on.bind(this);
    this.off = this.off.bind(this);
  }

  connect(accessToken: string) {
    if (this.socket?.connected) {
      return;
    }

    const NETWORK_API_BASE_URL = process.env.NEXT_PUBLIC_NETWORK_API_BASE_URL || 'http://localhost:4005';

    this.socket = io(NETWORK_API_BASE_URL, {
      auth: {
        token: accessToken,
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('🔌 Connected to network service');
      this.reconnectAttempts = 0;
      this.triggerEvent('connect');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from network service:', reason);
      this.triggerEvent('disconnect');
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't reconnect automatically
        return;
      }
      
      this.handleReconnect();
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 Connection error:', error);
      this.handleReconnect();
    });

    // Message events
    this.socket.on('new-message', (message) => {
      this.triggerEvent('new-message', message);
    });

    this.socket.on('user-typing', (data) => {
      this.triggerEvent('user-typing', data);
    });

    this.socket.on('user-stopped-typing', (data) => {
      this.triggerEvent('user-stopped-typing', data);
    });

    // Post events
    this.socket.on('new-post', (post) => {
      this.triggerEvent('new-post', post);
    });

    this.socket.on('post-reaction-update', (data) => {
      this.triggerEvent('post-reaction-update', data);
    });

    // Badge events
    this.socket.on('badge-awarded', (badgePost) => {
      this.triggerEvent('badge-awarded', badgePost);
    });

    // Project events
    this.socket.on('project-update', (data) => {
      this.triggerEvent('project-update', data);
    });

    // Event events
    this.socket.on('event-update', (data) => {
      this.triggerEvent('event-update', data);
    });

    // Online status
    this.socket.on('user-online', (data) => {
      this.triggerEvent('user-online', data);
    });

    this.socket.on('user-offline', (data) => {
      this.triggerEvent('user-offline', data);
    });

    // General notifications
    this.socket.on('notification', (notification) => {
      this.triggerEvent('notification', notification);
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('🔌 Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔌 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.socket?.connect();
    }, delay);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.eventListeners.clear();
  }

  emit(event: string, data?: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('🔌 Socket not connected, cannot emit:', event);
    }
  }

  on<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private triggerEvent(event: string, data?: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in socket event handler for ${event}:`, error);
        }
      });
    }
  }

  // Messaging specific methods
  joinConversation(conversationId: string) {
    this.emit('join-conversation', conversationId);
  }

  leaveConversation(conversationId: string) {
    this.emit('leave-conversation', conversationId);
  }

  startTyping(conversationId: string) {
    this.emit('typing-start', conversationId);
  }

  stopTyping(conversationId: string) {
    this.emit('typing-stop', conversationId);
  }

  // Post specific methods
  reactToPost(postId: string, type: string, action: 'add' | 'remove') {
    this.emit('post-reaction', { postId, type, action });
  }

  get isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Create singleton instance
export const networkSocketManager = new NetworkSocketManager();

// React hook for using the socket manager
export function useNetworkSocket() {
  const { user } = useAuth();
  
  const connect = (accessToken: string) => {
    if (accessToken && user) {
      networkSocketManager.connect(accessToken);
    }
  };

  const disconnect = () => {
    networkSocketManager.disconnect();
  };

  return {
    connect,
    disconnect,
    emit: networkSocketManager.emit,
    on: networkSocketManager.on,
    off: networkSocketManager.off,
    joinConversation: networkSocketManager.joinConversation,
    leaveConversation: networkSocketManager.leaveConversation,
    startTyping: networkSocketManager.startTyping,
    stopTyping: networkSocketManager.stopTyping,
    reactToPost: networkSocketManager.reactToPost,
    isConnected: networkSocketManager.isConnected,
  };
}

export default networkSocketManager;
