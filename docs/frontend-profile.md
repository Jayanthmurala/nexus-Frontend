# Nexus Frontend Profile Guide

Fast reference for integrating the Profile service in the Nexus frontend.

- Base URL: `NEXT_PUBLIC_PROFILE_API_BASE_URL`
- Client: `src/lib/httpProfile.ts` (Axios with auth + refresh)
- API wrapper: `src/lib/profileApi.ts`
- Redux integration: `src/store/slices/profileSlice.ts`
- Auth/token handling is identical to auth-service docs (bearer from NextAuth, auto-refresh on 401).
- Supports role-based profile features for students, faculty, and administrators.
- Integrates with badge system for gamification and achievements.
- College member ID as primary identifier for reliable student identification.

## TL;DR Quick Start
1) Set `NEXT_PUBLIC_PROFILE_API_BASE_URL` in `.env.local`.
2) Import from `profileApi.ts` and call functions directly.
3) Requests attach `Authorization` and refresh automatically via `httpProfile`.

```ts
import { profileApi } from '@/lib/profileApi';

const me = await profileApi.getMyProfile();
await profileApi.updateProfile({ 
  bio: 'Updated bio',
  skills: ['React', 'Node.js'],
  expertise: ['Machine Learning'],
  year: 3,
  department: 'Computer Science',
  collegeMemberId: 'CS2021001'
});
const colleges = await profileApi.getColleges();

// Badge management
const badges = await profileApi.getBadgeDefinitions();
await profileApi.awardBadge({ studentId: 'user123', badgeId: 'badge456', reason: 'Excellent project' });
const recentAwards = await profileApi.getRecentAwards(10);
```
## Concepts and data model
- __Profile__: canonical user attributes for UI and discovery. See `Profile` type in `src/lib/profileApi.ts`. Includes role-specific fields (skills for students, expertise for faculty).
- __Personal projects__: lightweight portfolio entries owned by the user. See `PersonalProject`. Supports GitHub/demo links and project images.
- __Publications__: faculty-focused records for academic output. See `PublicationRecord`. Includes title, year, link, and citation tracking.
- __Badges__: gamified recognitions with rarity-based styling. Two parts:
  - Definitions: metadata of a badge (`BadgeDefinition`) with category, rarity (common, rare, epic, legendary), and icon.
  - Awards: who received what and why (`StudentBadgeAward`) with display names and college member IDs.
- __College Member ID__: primary identifier for students, more reliable than names for identification and search.
- __Role-based UI__: Different profile sections and capabilities based on user role (student vs faculty vs admin).

## Roles and authorization
- __Me endpoints__ (`/v1/profile/me`): authenticated users read/update their own profile. The backend enforces ownership.
- __Public profile by userId__: visibility is controlled by backend policy; sensitive fields may be omitted.
- __Publications__: restricted to faculty to create/update their own; admins can manage all publications.
- __Personal Projects__: students can CRUD their own projects; visible to others for networking.
- __Badges__: 
  - Creating definitions: faculty/admin only
  - Awarding badges: faculty/admin only
  - Viewing awards: public for recognition, with student names and college member IDs
  - Badge eligibility: students need to unlock default badges for event creation
- __College Member ID__: used as primary indexing method for student identification in search and filtering.

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
- `src/store/slices/profileSlice.ts` (Redux state management)
- `src/store/slices/publicationsSlice.ts` (Publications Redux state)
- `src/components/Dashboard/Student/StudentProfile.tsx` (Student profile UI)
- `src/components/Dashboard/Faculty/FacultyProfile.tsx` (Faculty profile UI)
- `src/components/Dashboard/Admin/AdminProfile.tsx` (Admin profile UI)
- `src/app/student/profile/page.tsx` (Protected student profile route)
- `src/app/faculty/profile/page.tsx` (Protected faculty profile route)
- `src/app/student/profile/[id]/page.tsx` (Dynamic profile viewing)

## Endpoints used
- Profile: `/v1/profile/me`, `/v1/profile/:userId`, `/v1/profile/user/:userId` (enhanced with auth service integration)
- Colleges: `/v1/colleges`
- Personal projects: `/v1/profile/me/projects` and `.../:id`
- Publications: `/v1/profile/me/publications` and `.../:id`
- Badges: 
  - `/v1/badges/definitions` (list/create badge definitions)
  - `/v1/badges/awards` (award badges)
  - `/v1/badges/awards/recent` (recent awards with student details)
  - `/v1/badges/export` (CSV export with college member IDs)
  - `/v1/badges/stats/award-counts` (badge statistics)
  - `/v1/profile/badges/:userId` (user's earned badges)

## Quick recipes

### Profile Management (Redux integrated)
```ts
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchMyProfile, saveMyProfile } from '@/store/slices/profileSlice';

// In component
const dispatch = useAppDispatch();
const profile = useAppSelector(state => state.profile.data);

// Fetch profile
await dispatch(fetchMyProfile());

// Update profile
await dispatch(saveMyProfile({ 
  bio: 'Updated bio',
  year: 3,
  department: 'Computer Science',
  skills: ['React', 'Node.js'],
  collegeMemberId: 'CS2021001'
}));
```

### Personal Projects (Students)
```ts
import { getMyProjects, createProject, updateProject, deleteProject } from '@/lib/profileApi';

const list = await getMyProjects();
const created = await createProject({ 
  title: 'Portfolio Website', 
  description: 'Personal portfolio built with Next.js',
  github: 'https://github.com/user/portfolio',
  demoLink: 'https://myportfolio.com',
  image: 'https://example.com/screenshot.jpg'
});
await updateProject(created.id, { description: 'Updated description' });
await deleteProject(created.id);
```

### Publications (Faculty)
```ts
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createPublicationThunk, updatePublicationThunk, deletePublicationThunk } from '@/store/slices/publicationsSlice';

// Redux-integrated publications management
const dispatch = useAppDispatch();
const publications = useAppSelector(state => state.publications.items);

// Create publication
await dispatch(createPublicationThunk({ 
  title: 'Machine Learning in Healthcare', 
  year: 2024,
  link: 'https://doi.org/10.1000/journal.2024.001'
}));

// Update publication
await dispatch(updatePublicationThunk({ 
  id: 'pub_id', 
  updates: { title: 'Updated Title' }
}));

// Delete publication
await dispatch(deletePublicationThunk('pub_id'));
```

### Badge System (Faculty/Admin)
```ts
import { getBadgeDefinitions, awardBadge, getRecentAwards, exportBadges } from '@/lib/profileApi';

// Get badge definitions
const defs = await getBadgeDefinitions();

// Award badge with student identification
const award = await awardBadge({ 
  badgeDefinitionId: defs[0].id,
  userId: 'student_user_id', 
  reason: 'Excellent project presentation and leadership skills' 
});

// Recent awards with student names and college member IDs
const recent = await getRecentAwards(20);
// Returns: [{ studentName: 'John Doe', collegeMemberId: 'CS2021001', badgeName: 'Leadership', ... }]

// Export badges to CSV for reporting
const { blob, filename } = await exportBadges();
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = filename;
document.body.appendChild(a);
a.click();
a.remove();
URL.revokeObjectURL(url);
```

### College and User Discovery
```ts
import { getColleges, getUserProfile } from '@/lib/profileApi';

// Get colleges for registration/filtering
const colleges = await getColleges();

// Get enhanced user profile (includes auth service data)
const userProfile = await getUserProfile('user_id');
// Returns: { displayName, email, roles, collegeName, department, year, collegeMemberId, ... }
```

## Role-based Profile Components

### Student Profile Features
- Personal projects showcase with GitHub/demo links and images
- Skills management with add/remove functionality
- Earned badges display with rarity-based styling
- Profile strength indicator
- Social links (LinkedIn, GitHub, Google Scholar, ORCID)
- Resume upload and management

### Faculty Profile Features
- Publications management with CRUD operations
- Expertise tags instead of skills
- Academic experience and bio
- Social links for professional networking
- Badge awarding capabilities

### Admin Profile Features
- All faculty features plus administrative controls
- Badge definition creation and management
- Student badge awarding with search by name/college member ID
- CSV export of badge awards for reporting

## SSR usage
- Use `getServerSession(authOptions)` then attach `Authorization: Bearer <session.accessToken>`.
- Server fetches do not auto-refresh by default; prefer client-side or Next.js Route Handlers if you need refresh semantics.

## Troubleshooting
- 401 loops: confirm both `NEXT_PUBLIC_PROFILE_API_BASE_URL` and `NEXT_PUBLIC_API_BASE_URL` (for refresh) are correct and CORS allows credentials.
- Missing data: check role-based access; ensure the authenticated user has permission for the resource.
- Badge eligibility: students need default badges unlocked for event creation privileges.
- College Member ID: ensure this field is populated for proper student identification and search functionality.
