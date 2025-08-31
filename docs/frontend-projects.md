# Nexus Frontend Projects Guide

Fast reference for integrating the Projects service.

- Base URL: `NEXT_PUBLIC_PROJECTS_API_BASE_URL`
- Client: `src/lib/httpProjects.ts` (Axios with auth + refresh)
- API wrapper: `src/lib/projectsApi.ts`
- Redux integration: `src/store/slices/projectsSlice.ts`, `applicationsSlice.ts`, `tasksSlice.ts`, `attachmentsSlice.ts`
- Real-time updates via WebSocket integration
- File upload support with progress tracking and cancellation
- Comprehensive collaboration hub for project management

## TL;DR Quick Start
1) Set `NEXT_PUBLIC_PROJECTS_API_BASE_URL` in `.env.local`.
2) Import `projectsApi` and call typed methods.

```ts
import projectsApi from '@/lib/projectsApi';
import { useAppDispatch } from '@/store/hooks';
import { createProject, fetchMyApplications } from '@/store/slices/projectsSlice';

// Redux-integrated project creation
const dispatch = useAppDispatch();
const result = await dispatch(createProject({
  title: 'LLM Research',
  description: 'Exploring prompt techniques',
  projectType: 'RESEARCH',
  maxStudents: 3,
  requirements: ['Python', 'Machine Learning'],
  outcomes: ['Research paper', 'Working prototype']
}));

// Apply to a project with real-time updates
const { application } = await projectsApi.applyToProject(project.id, { message: 'Interested!' });

// File upload with progress
const formData = new FormData();
formData.append('file', file);
const response = await uploadFile(formData, (progress) => {
  console.log(`Upload progress: ${progress}%`);
});
```

## Concepts and data model
- __Project__: see `Project` in `src/lib/projectsApi.ts`. Key fields: `projectType`, `progressStatus`, `moderationStatus`, `skills`, `departments`, `visibleToAllDepts`, `maxStudents`, `requirements[]`, `outcomes[]`. Student-specific annotations: `hasApplied`, `myApplicationStatus`, `currentStudents`.
- __Application__: a student's request to join a project (`Application.status` is `PENDING | ACCEPTED | REJECTED`). Includes application message and timestamps.
- __Comment__: discussion on a project (optionally linked to a `taskId`). Supports threaded conversations.
- __Task__: lightweight work item with `status` (`TODO | IN_PROGRESS | DONE`), assignee, and due dates.
- __Attachment__: metadata for a file linked to a project (stores `fileName`, `fileUrl`, `fileType`, `fileSize`). Supports image thumbnails.
- __Collaboration Hub__: integrated workspace for project teams with tasks, files, comments, and team management.
- __Real-time Updates__: WebSocket integration for live project and application notifications.

## Roles and authorization
- Creation/update/deletion permissions are enforced by the backend. UI should feature-gate actions and handle `403` by hiding/disabled states.
- Students can apply to projects; `hasApplied` and `myApplicationStatus` help decide whether to show the Apply button.
- Project owners/faculty can review and update application status, manage team members.
- Comments/Tasks/Attachments require project membership; only team members can access collaboration features.
- File uploads are restricted by file type and size limits (configurable per deployment).
- Department admins can moderate and approve projects before they become visible to students.

## Request semantics
- `listProjects(params)` returns an envelope `{ projects, page, total }` for pagination.
- Creating is `POST`, updating is `PUT`, deleting is `DELETE`. Avoid duplicate submissions; disable the submit button while pending.
- File uploads use FormData to `/api/uploadmedia` endpoint, then create attachment records via `createAttachment`.
- Requirements and outcomes are stored as arrays but displayed as newline-separated text in forms.
- Real-time updates are delivered via WebSocket events for project changes and application status updates.

## Pagination and filters
- Supported filters: `q`, `projectType`, `progressStatus`, `department`, plus `page` and `limit` for pagination.
- Project marketplace includes advanced filtering by skills, department, and project type.
- Application tracker supports filtering by status (`PENDING`, `ACCEPTED`, `REJECTED`).
- Debounce text search (`q`) and always render from the backend's returned `projects` and `total`.
- Faculty can filter projects by current student count and collaboration status.

## Error handling
- `401` will auto-refresh once via Axios interceptors; a second `401` implies logout.
- `403` means insufficient privileges; hide the action and show a friendly message.
- `404` can occur for non-existent/hidden resources.
- `422/400` indicate validation errors; surface field-level messages.

## CSR vs SSR
- CSR calls via Axios benefit from automatic token refresh and retry-once semantics.
- For SSR, read the session with `getServerSession(authOptions)` and attach `Authorization`; server fetches won't auto-refresh.

## Quick recipes

### Project Management (Redux integrated)
```ts
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createProject, fetchMyProjects, updateProject } from '@/store/slices/projectsSlice';

const dispatch = useAppDispatch();
const projects = useAppSelector(state => state.projects.myProjects);

// Create project
await dispatch(createProject({
  title: 'AI Research Project',
  description: 'Exploring neural networks for healthcare',
  projectType: 'RESEARCH',
  maxStudents: 5,
  departments: ['Computer Science', 'Biomedical Engineering'],
  skills: ['Python', 'TensorFlow', 'Data Analysis'],
  requirements: ['Strong programming skills', 'ML background'],
  outcomes: ['Research paper', 'Working prototype'],
  deadline: '2024-06-30T23:59:59Z',
  visibleToAllDepts: false
}));

// Fetch projects
await dispatch(fetchMyProjects());

// Update project
await dispatch(updateProject({
  id: 'project_id',
  updates: { progressStatus: 'IN_PROGRESS' }
}));
```

### Student Applications (Redux integrated)
```ts
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchMyApplications, applyToProject } from '@/store/slices/applicationsSlice';

const dispatch = useAppDispatch();
const applications = useAppSelector(state => state.applications.myApplications);

// Fetch my applications
await dispatch(fetchMyApplications());

// Apply to project
await dispatch(applyToProject({
  projectId: 'project_id',
  message: 'I am very interested in this research opportunity and have relevant experience in ML.'
}));
```

### Collaboration Features
```ts
import projectsApi from '@/lib/projectsApi';

// Comments with real-time updates
await projectsApi.createComment(project.id, 'Great progress on the literature review!');
const { comments } = await projectsApi.getProjectComments(project.id);

// Task management
const { tasks } = await projectsApi.getProjectTasks(project.id);
await projectsApi.createTask(project.id, { 
  title: 'Data collection phase',
  description: 'Collect and preprocess training data',
  assignedToId: 'student_user_id',
  dueDate: '2024-02-15T00:00:00Z'
});
await projectsApi.updateTask(taskId, { status: 'IN_PROGRESS' });

// Application management (Faculty)
const { applications } = await projectsApi.getProjectApplications(project.id);
await projectsApi.updateApplicationStatus(applications[0].id, { 
  status: 'ACCEPTED',
  feedback: 'Welcome to the team! Please join our next meeting.'
});
```

### File Upload with Progress
```ts
import { useState } from 'react';
import projectsApi from '@/lib/projectsApi';

const [uploadProgress, setUploadProgress] = useState(0);
const [uploading, setUploading] = useState(false);

const handleFileUpload = async (file: File, projectId: string) => {
  setUploading(true);
  setUploadProgress(0);
  
  try {
    // Upload file with progress tracking
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await uploadWithProgress(formData, (progress) => {
      setUploadProgress(progress);
    });
    
    // Create attachment record
    await projectsApi.createAttachment(projectId, {
      fileName: file.name,
      fileUrl: response.data.url,
      fileType: file.type,
      fileSize: file.size
    });
    
    toast.success('File uploaded successfully!');
  } catch (error) {
    toast.error('Upload failed. Please try again.');
  } finally {
    setUploading(false);
    setUploadProgress(0);
  }
};
```

### WebSocket Integration
```ts
import { useEffect } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';

const ProjectComponent = ({ projectId }: { projectId: string }) => {
  const { socket } = useWebSocket();
  
  useEffect(() => {
    if (!socket) return;
    
    // Join project room for real-time updates
    socket.emit('join-project', projectId);
    
    // Listen for project updates
    socket.on('project-updated', (data) => {
      console.log('Project updated:', data);
      // Refresh project data or update UI
    });
    
    // Listen for application updates
    socket.on('application-updated', (data) => {
      console.log('Application status changed:', data);
      // Update application status in UI
    });
    
    return () => {
      socket.off('project-updated');
      socket.off('application-updated');
      socket.emit('leave-project', projectId);
    };
  }, [socket, projectId]);
  
  // Component JSX...
};
```

## Collaboration Hub Features

### Student Collaboration Hub
- View accepted projects and active collaborations
- Access project tasks, files, and team discussions
- Real-time notifications for project updates
- File sharing with team members
- Task assignment and progress tracking

### Faculty Collaboration Hub
- Manage all owned projects and team members
- Review and approve/reject student applications
- Create and assign tasks to team members
- Monitor project progress and milestones
- Export project data and reports

### File Upload System
- Support for multiple file types (documents, images, code files)
- Progress tracking with cancel functionality
- Image thumbnail generation
- File size and type validation
- Secure file storage with access control

### Real-time Features
- WebSocket integration for live updates
- Project change notifications
- Application status updates
- Team member activity feeds
- Typing indicators in discussions

## SSR usage
- Read session via `getServerSession(authOptions)` and set `Authorization` header.
- Prefer client-side fetch with Axios interceptors to benefit from refresh behavior.
- File uploads are client-side only due to FormData and progress tracking requirements.

## Troubleshooting
- 401 on create/apply: ensure the user has the correct role/permissions.
- CORS/downloads: backend must allow `Authorization` and credentials.
- File upload failures: check file size limits and supported file types.
- WebSocket connection issues: verify network configuration and authentication tokens.
- Application status not updating: ensure real-time WebSocket connection is established.
