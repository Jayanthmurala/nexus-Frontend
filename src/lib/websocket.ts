import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';

export interface ProjectUpdateEvent {
  type: 'new-project' | 'project-updated' | 'project-deleted';
  project: any;
  collegeId: string;
  departments: string[];
  visibleToAllDepts: boolean;
}

export interface ApplicationUpdateEvent {
  type: 'new-application' | 'application-status-changed';
  application: any;
  projectId: string;
  collegeId: string;
}

class WebSocketManager {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(token: string, collegeId: string, department: string, roles: string[]) {
    if (this.socket?.connected) {
      return this.socket;
    }

    const projectsServiceUrl = process.env.NEXT_PUBLIC_PROJECTS_API_BASE_URL || 'http://localhost:4003';
    
    this.socket = io(projectsServiceUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      console.log('Connected to projects WebSocket');
      this.reconnectAttempts = 0;
      
      // Join college-specific rooms
      if (collegeId) {
        console.log(`Joined room: projects:${collegeId}`);
      }
      if (collegeId && department) {
        console.log(`Joined room: projects:${collegeId}:${department}`);
      }
      if (roles.includes('FACULTY')) {
        console.log('Joined faculty application updates room');
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from projects WebSocket:', reason);
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.handleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.handleReconnect();
    });

    return this.socket;
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.socket?.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  onProjectUpdate(callback: (event: ProjectUpdateEvent) => void) {
    this.socket?.on('project-update', callback);
  }

  onApplicationUpdate(callback: (event: ApplicationUpdateEvent) => void) {
    this.socket?.on('application-update', callback);
  }

  offProjectUpdate(callback: (event: ProjectUpdateEvent) => void) {
    this.socket?.off('project-update', callback);
  }

  offApplicationUpdate(callback: (event: ApplicationUpdateEvent) => void) {
    this.socket?.off('application-update', callback);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }
}

// Singleton instance
export const websocketManager = new WebSocketManager();

// Hook for using WebSocket in React components
export function useWebSocket() {
  const { user, session } = useAuth();

  const connect = () => {
    if (!user || !session?.accessToken) {
      console.warn('Cannot connect to WebSocket: user or token not available');
      return null;
    }

    return websocketManager.connect(
      session.accessToken,
      user.collegeId || '',
      user.department || '',
      user.role ? [user.role] : []
    );
  };

  const disconnect = () => {
    websocketManager.disconnect();
  };

  const onProjectUpdate = (callback: (event: ProjectUpdateEvent) => void) => {
    websocketManager.onProjectUpdate(callback);
  };

  const onApplicationUpdate = (callback: (event: ApplicationUpdateEvent) => void) => {
    websocketManager.onApplicationUpdate(callback);
  };

  const offProjectUpdate = (callback: (event: ProjectUpdateEvent) => void) => {
    websocketManager.offProjectUpdate(callback);
  };

  const offApplicationUpdate = (callback: (event: ApplicationUpdateEvent) => void) => {
    websocketManager.offApplicationUpdate(callback);
  };

  return {
    connect,
    disconnect,
    onProjectUpdate,
    onApplicationUpdate,
    offProjectUpdate,
    offApplicationUpdate,
    socket: websocketManager.getSocket(),
  };
}
