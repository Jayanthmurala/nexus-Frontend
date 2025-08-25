# Nexus Frontend Projects Guide

Fast reference for integrating the Projects service.

- Base URL: `NEXT_PUBLIC_PROJECTS_API_BASE_URL`
- Client: `src/lib/httpProjects.ts` (Axios with auth + refresh)
- API wrapper: `src/lib/projectsApi.ts`

## TL;DR Quick Start
1) Set `NEXT_PUBLIC_PROJECTS_API_BASE_URL` in `.env.local`.
2) Import `projectsApi` and call typed methods.

```ts
import projectsApi from '@/lib/projectsApi';

// List with filters and pagination
const { projects } = await projectsApi.listProjects({ q: 'ai', page: 1, limit: 10 });

// Create a project
const { project } = await projectsApi.createProject({
  title: 'LLM Research',
  description: 'Exploring prompt techniques',
  projectType: 'RESEARCH',
  maxStudents: 3,
});

// Apply to a project
const { application } = await projectsApi.applyToProject(project.id, { message: 'Interested!' });
```

## Concepts and data model
- __Project__: see `Project` in `src/lib/projectsApi.ts`. Key fields: `projectType`, `progressStatus`, `moderationStatus`, `skills`, `departments`, `visibleToAllDepts`, `maxStudents`. Student-specific annotations: `hasApplied`, `myApplicationStatus`.
- __Application__: a student's request to join a project (`Application.status` is `PENDING | ACCEPTED | REJECTED`).
- __Comment__: discussion on a project (optionally linked to a `taskId`).
- __Task__: lightweight work item with `status` (`TODO | IN_PROGRESS | DONE`).
- __Attachment__: metadata for a file linked to a project (stores `fileName`, `fileUrl`, `fileType`).

## Roles and authorization
- Creation/update/deletion permissions are enforced by the backend. UI should feature-gate actions and handle `403` by hiding/disabled states.
- Students can apply to projects; `hasApplied` and `myApplicationStatus` help decide whether to show the Apply button.
- Project owners/admins can review and update application status.
- Comments/Tasks/Attachments typically require project membership/ownership; backend is the source of truth.

## Request semantics
- `listProjects(params)` returns an envelope `{ projects, page, total }` for pagination.
- Creating is `POST`, updating is `PUT`, deleting is `DELETE`. Avoid duplicate submissions; disable the submit button while pending.
- Attachments expect a `fileUrl` (pre-upload to storage) and `fileType`; binary upload is handled outside this API.

## Pagination and filters
- Supported filters: `q`, `projectType`, `progressStatus`, plus `page` and `limit` for pagination.
- Debounce text search (`q`) and always render from the backend's returned `projects` and `total`.

## Error handling
- `401` will auto-refresh once via Axios interceptors; a second `401` implies logout.
- `403` means insufficient privileges; hide the action and show a friendly message.
- `404` can occur for non-existent/hidden resources.
- `422/400` indicate validation errors; surface field-level messages.

## CSR vs SSR
- CSR calls via Axios benefit from automatic token refresh and retry-once semantics.
- For SSR, read the session with `getServerSession(authOptions)` and attach `Authorization`; server fetches won't auto-refresh.

## Common actions
```ts
// My projects
const mine = await projectsApi.getMyProjects();

// Comments
await projectsApi.createComment(project.id, 'Nice idea!');
const { comments } = await projectsApi.getProjectComments(project.id);

// Tasks
const { tasks } = await projectsApi.getProjectTasks(project.id);
await projectsApi.createTask(project.id, { title: 'Draft outline' });

// Applications
const { applications } = await projectsApi.getMyApplications('PENDING');
// Admin: update application status
await projectsApi.updateApplicationStatus(applications[0].id, { status: 'ACCEPTED' });

// Attachments
await projectsApi.createAttachment(project.id, { fileName: 'spec.pdf', fileUrl: 'https://...', fileType: 'application/pdf' });
```

## SSR usage
- Read session via `getServerSession(authOptions)` and set `Authorization` header.
- Prefer client-side fetch with Axios interceptors to benefit from refresh behavior.

## Troubleshooting
- 401 on create/apply: ensure the user has the correct role/permissions.
- CORS/downloads: backend must allow `Authorization` and credentials.
