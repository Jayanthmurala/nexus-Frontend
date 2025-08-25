# Nexus Frontend Profile Guide

Fast reference for integrating the Profile service in the Nexus frontend.

- Base URL: `NEXT_PUBLIC_PROFILE_API_BASE_URL`
- Client: `src/lib/httpProfile.ts` (Axios with auth + refresh)
- API wrapper: `src/lib/profileApi.ts`
- Auth/token handling is identical to auth-service docs (bearer from NextAuth, auto-refresh on 401).

## TL;DR Quick Start
1) Set `NEXT_PUBLIC_PROFILE_API_BASE_URL` in `.env.local`.
2) Import from `profileApi.ts` and call functions directly.
3) Requests attach `Authorization` and refresh automatically via `httpProfile`.

```ts
import { getMyProfile, upsertMyProfile, getColleges } from '@/lib/profileApi';

const me = await getMyProfile();
await upsertMyProfile({ collegeId: 'ABC', department: 'CSE', year: 3 });
const colleges = await getColleges();
```
## Concepts and data model
- __Profile__: canonical user attributes for UI and discovery. See `Profile` type in `src/lib/profileApi.ts`.
- __Personal projects__: lightweight portfolio entries owned by the user. See `PersonalProject`.
- __Publications__: faculty-focused records for academic output. See `PublicationRecord`.
- __Badges__: gamified recognitions. Two parts:
  - Definitions: metadata of a badge (`BadgeDefinition`).
  - Awards: who received what and why (`StudentBadgeAward`).

## Roles and authorization
- __Me endpoints__ (`/v1/profile/me`): authenticated users read/update their own profile. The backend enforces ownership.
- __Public profile by userId__: visibility is controlled by backend policy; sensitive fields may be omitted.
- __Publications__: typically restricted to faculty/admin to create/update; regular users can read if exposed.
- __Badges__: creating definitions and awarding badges are privileged operations (admin/staff); reading awards may be scoped to self unless elevated.

Always rely on server responses for the final truth; UI should degrade gracefully on 403/404.

## Request semantics
- __Upsert profile__ uses PUT and is idempotent: repeat requests with same payload yield the same state.
- __Create operations__ (personal projects, publications, badge definitions/awards) use POST and are not idempotent; avoid duplicate submissions by disabling buttons while pending.
- Timestamps are ISO strings; treat as UTC in UI.

## Pagination and filters
- Colleges and most "me" collections are small and often unpaginated in UI.
- If the backend adds pagination later, prefer passing `page`/`limit` via `params` when available and render from the returned envelope.

## Error handling
- 401 triggers automatic refresh via Axios interceptors; a second 401 should log the user out.
- 403 indicates lack of privileges; hide privileged UI affordances for non-eligible users.
- 422/400 reflect validation errors; surface field-level messages where possible.

## SSR vs CSR
- For SSR, get the session via `getServerSession(authOptions)` and attach `Authorization` manually.
- Auto-refresh depends on browser cookies; prefer client-side data fetching when you want refresh-on-401 behavior.

## Files to know
- `src/lib/httpProfile.ts` (Axios base + interceptors)
- `src/lib/profileApi.ts` (typed wrapper)

## Endpoints used
- Profile: `/v1/profile/me`, `/v1/profile/:userId`
- Colleges: `/v1/colleges`
- Personal projects: `/v1/profile/me/projects` and `.../:id`
- Publications: `/v1/profile/me/publications` and `.../:id`
- Badges: `/v1/badges/definitions`, `/v1/badges/awards`, `/v1/badges/awards/recent`, `/v1/badges/stats/award-counts`

## Quick recipes

- Read/update my profile
```ts
import { getMyProfile, upsertMyProfile } from '@/lib/profileApi';
const profile = await getMyProfile();
await upsertMyProfile({ collegeId: 'XYZ', department: 'ECE' });
```

- Personal projects
```ts
import { getMyProjects, createProject, updateProject, deleteProject } from '@/lib/profileApi';
const list = await getMyProjects();
const created = await createProject({ title: 'Portfolio', description: 'My site' });
await updateProject(created.id, { description: 'My cool site' });
await deleteProject(created.id);
```

- Publications (faculty)
```ts
import { getMyPublications, createPublication, updatePublication, deletePublication } from '@/lib/profileApi';
const pubs = await getMyPublications();
const pub = await createPublication({ title: 'Paper', year: 2025 });
await updatePublication(pub.id, { link: 'https://doi.org/...' });
await deletePublication(pub.id);
```

- Badges
```ts
import { getBadgeDefinitions, awardBadge, getRecentAwards, getAwards } from '@/lib/profileApi';
const defs = await getBadgeDefinitions();
const award = await awardBadge({ studentId: 'u1', badgeId: defs[0].id, reason: 'Great talk' });
const recent = await getRecentAwards(10);
const mine = await getAwards();
```

## SSR usage
- Use `getServerSession(authOptions)` then attach `Authorization: Bearer <session.accessToken>`.
- Server fetches do not auto-refresh by default; prefer client-side or Next.js Route Handlers if you need refresh semantics.

## Troubleshooting
- 401 loops: confirm both `NEXT_PUBLIC_PROFILE_API_BASE_URL` and `NEXT_PUBLIC_API_BASE_URL` (for refresh) are correct and CORS allows credentials.
- Missing data: check role-based access; ensure the authenticated user has permission for the resource.
