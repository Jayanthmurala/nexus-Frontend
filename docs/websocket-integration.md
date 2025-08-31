# WebSocket Integration for Real-Time Project Updates

## Overview

This document describes the WebSocket integration implemented for real-time project and application updates in the Nexus platform. The integration provides instant notifications to users when projects are created, updated, or when applications are submitted.

## Architecture

### Backend (Project Service)

**WebSocket Server Setup (`src/utils/websocket.ts`):**
- Socket.IO server integrated with Fastify
- JWT-based authentication middleware
- Room-based subscriptions for targeted updates
- Event emitters for project and application updates

**Room Structure:**
- `projects:{collegeId}` - All users in a college
- `projects:{collegeId}:{department}` - Department-specific updates
- `faculty:{userId}:applications` - Faculty-specific application updates

**Event Types:**
- `project-update`: New projects, project updates, project deletions
- `application-update`: New applications, status changes

### Frontend (Next.js)

**WebSocket Manager (`src/lib/websocket.ts`):**
- Singleton WebSocket connection manager
- Automatic reconnection with exponential backoff
- React hook for easy component integration

**Global Provider (`src/contexts/WebSocketContext.tsx`):**
- Automatic connection management based on auth state
- Integrated with Next.js app providers

**Component Integration:**
- `ProjectMarketplace.tsx` - Real-time project updates for students
- `ProjectsList.tsx` - Real-time application notifications for faculty

## Implementation Details

### Backend WebSocket Events

```typescript
// Project update event
interface ProjectUpdateEvent {
  type: 'new-project' | 'project-updated' | 'project-deleted';
  project: any;
  collegeId: string;
  departments: string[];
  visibleToAllDepts: boolean;
}

// Application update event
interface ApplicationUpdateEvent {
  type: 'new-application' | 'application-status-changed';
  application: any;
  projectId: string;
  collegeId: string;
}
```

### Frontend Usage

```typescript
// In React components
const { connect, onProjectUpdate, offProjectUpdate } = useWebSocket();

useEffect(() => {
  connect();
  
  const handleProjectUpdate = (event: ProjectUpdateEvent) => {
    // Handle real-time updates
  };
  
  onProjectUpdate(handleProjectUpdate);
  
  return () => {
    offProjectUpdate(handleProjectUpdate);
  };
}, []);
```

## Features

### Real-Time Project Updates
- **Students**: Instant notifications when new projects are posted
- **Department Filtering**: Only receive updates for relevant departments
- **College-Wide Updates**: Projects visible to all departments reach everyone
- **Toast Notifications**: User-friendly notifications with project titles

### Real-Time Application Updates
- **Faculty**: Instant notifications when students apply to their projects
- **Status Changes**: Updates when application statuses change
- **Auto-Refresh**: Project lists automatically refresh to show updated counts

### Connection Management
- **Automatic Connection**: Connects when user logs in
- **Reconnection**: Automatic reconnection with exponential backoff
- **Authentication**: JWT-based authentication for secure connections
- **Room Management**: Automatic joining of relevant rooms based on user profile

## Security

- **JWT Authentication**: All WebSocket connections authenticated with JWT tokens
- **Room-Based Access**: Users only receive updates for their college/department
- **Role-Based Events**: Faculty receive different events than students
- **CORS Configuration**: Proper CORS setup for frontend domains

## Performance Considerations

- **Targeted Updates**: Room-based subscriptions minimize unnecessary traffic
- **Connection Pooling**: Singleton manager prevents multiple connections
- **Efficient Reconnection**: Exponential backoff prevents connection spam
- **Event Filtering**: Client-side filtering for relevant updates only

## Environment Variables

```bash
# Project Service
FRONTEND_URL=http://localhost:3000  # For CORS configuration

# Frontend
NEXT_PUBLIC_PROJECTS_API_BASE_URL=http://localhost:4003  # WebSocket server URL
```

## Testing

### Manual Testing
1. **Project Creation**: Create a project and verify students receive notifications
2. **Application Submission**: Submit an application and verify faculty notifications
3. **Connection Recovery**: Disconnect/reconnect and verify automatic recovery
4. **Cross-Department**: Test department filtering works correctly

### Integration Points
- Auth service JWT payload includes profile data
- Project service emits events on CRUD operations
- Frontend components handle events gracefully
- Toast notifications provide user feedback

## Troubleshooting

### Common Issues
1. **Connection Failures**: Check JWT token validity and CORS configuration
2. **Missing Notifications**: Verify room subscriptions and event filtering
3. **Multiple Connections**: Ensure singleton WebSocket manager is used
4. **Reconnection Issues**: Check exponential backoff implementation

### Debug Logging
- Backend: Console logs for connection events and room joins
- Frontend: Console logs for connection status and event handling
- Network: Browser dev tools for WebSocket traffic inspection

## Future Enhancements

1. **Message History**: Store and replay missed messages
2. **Typing Indicators**: Real-time typing status for messaging
3. **Presence Indicators**: Online/offline status for users
4. **Push Notifications**: Browser push notifications for offline users
5. **Analytics**: Connection metrics and event tracking
