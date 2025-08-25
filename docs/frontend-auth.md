# Nexus Frontend Auth Guide

This document explains how the Next.js frontend integrates with the Nexus auth-service for login, OAuth, token refresh, and logout. It is aligned with the current implementation using NextAuth, Axios, and Redux.

- Uses NextAuth for session handling with a Credentials provider to store backend-issued access tokens in the NextAuth JWT.
- Uses Axios clients with interceptors to attach the bearer token and auto-refresh on 401 via the backend HttpOnly refresh cookie.
- No localStorage is used for tokens (security-first).

## TL;DR Quick Start
1) Create `nexus/.env.local` with NextAuth + service URLs (see Env Vars below).
2) Ensure `src/app/layout.tsx` wraps children with `src/app/providers.tsx`'s `<Providers />`.
3) Protect routes via `src/middleware.ts` matcher. Add new paths as needed.
4) Use `useAuth()` for login/register/logout. Use `http` (Axios) for API calls.
5) For SSR, use `getServerSession(authOptions)` and attach `Authorization` header.

Copy-paste minimal API call:
```ts
import http from '@/lib/http';
const { data } = await http.get('/v1/auth/me');
```

Copy-paste minimal login (client):
```tsx
'use client';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginForm() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await login(email, password);
    if (ok) window.location.href = '/';
  };
  return (
    <form onSubmit={onSubmit}>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />
      <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" type="password" />
      <button disabled={loading}>Sign in</button>
    </form>
  );
}

```

## Files to know
- NextAuth options: `src/lib/authOptions.ts`
- NextAuth route: `src/app/api/auth/[...nextauth]/route.ts`
- App providers: `src/app/providers.tsx` (wraps `SessionProvider`, `AuthProvider`, Redux store)
- Axios client to auth-service: `src/lib/http.ts`
- Axios client to profile-service: `src/lib/httpProfile.ts`
- Axios client to projects-service: `src/lib/httpProjects.ts`
- Axios client to event-service: `src/lib/httpEvents.ts`
- Profile API wrapper: `src/lib/profileApi.ts`
- Projects API wrapper: `src/lib/projectsApi.ts`
- Events API wrapper: `src/lib/eventsApi.ts`
- Refresh helper: `src/lib/authRefresh.ts`
- Me helper: `src/lib/me.ts`
- Auth context: `src/contexts/AuthContext.tsx`
- UI flows:
  - Login: `src/app/login/page.tsx`
  - OAuth exchange bridge: `src/app/oauth/bridge/page.tsx`
  - Verify email: `src/app/verify-email/page.tsx`
  - Reset password: `src/app/reset-password/page.tsx`
  - Forgot password: `src/app/forgot-password/page.tsx`
  - Resend verification: `src/app/resend-verification/page.tsx`

### See also
- Frontend Profile Guide: `docs/frontend-profile.md`
- Frontend Projects Guide: `docs/frontend-projects.md`
- Frontend Events Guide: `docs/frontend-events.md`

## Environment variables (.env.local)
Set the following in `nexus/.env.local` (do not prefix secrets with NEXT_PUBLIC):

```bash
# NextAuth core
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-strong-random-secret

# OAuth providers (optional; enable if you need Google/GitHub sign-in)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_ID=...
GITHUB_SECRET=...

# Service base URLs
NEXT_PUBLIC_API_BASE_URL=http://localhost:4001          # auth-service
NEXT_PUBLIC_PROFILE_API_BASE_URL=http://localhost:4002  # profile-service
NEXT_PUBLIC_PROJECTS_API_BASE_URL=http://localhost:4003 # projects-service
NEXT_PUBLIC_EVENTS_API_BASE_URL=http://localhost:4004   # event-service
```

Notes:
- Make sure ports and origins match the backend config and CORS settings.
- Only NEXT_PUBLIC_* variables are exposed to the browser; provider secrets and NEXTAUTH_SECRET must not be exposed.


## NextAuth configuration
- `src/lib/authOptions.ts` defines providers and callbacks:
  - Providers: Google, GitHub, and Credentials (for storing backend tokens).
  - `session: { strategy: 'jwt' }` keeps session data in a signed JWT (no DB required).
  - `jwt` callback:
    - Credentials flow: copies `accessToken` and user fields into the token.
    - OAuth flow: stashes `{ provider, accessToken, idToken }` under `token.oauth` for client-side exchange with the backend.
  - `session` callback mirrors `token.accessToken`, `token.user`, and `token.oauth` onto the NextAuth session object.
- `src/app/api/auth/[...nextauth]/route.ts` exports the GET/POST handler created with `NextAuth(authOptions)`.

### Route protection
- `src/middleware.ts` re-exports `next-auth/middleware` and defines a `matcher` array of protected routes (e.g. `/`, `/dashboard`, `/projects`, `/events`, etc.).
- Any path in the matcher requires an authenticated NextAuth session; otherwise, users are redirected to the sign-in page defined in `authOptions.pages.signIn` (currently `/login`).


### Protecting additional routes
- To guard new pages, add their paths to `src/middleware.ts` `config.matcher`.
- Supports wildcards like `/admin/:path*`.

Example (`src/middleware.ts`):
```ts
export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/", "/dashboard", "/projects", 
    "/admin", "/reports/:path*" // add your routes here
  ],
};
```

## Server Components and SSR
- Use `getServerSession(authOptions)` to read the NextAuth session (including `session.accessToken`) in server components, layouts, or route handlers.
- Server-side requests should attach `Authorization: Bearer <session.accessToken>`.
- Refresh flow relies on the user's HttpOnly cookie and is handled on the client by Axios interceptors. Do not expect server-side fetches to auto-refresh unless you proxy the user's cookies through a Route Handler.
- If a server-side call returns 401, prefer redirecting to `/login` or render a fallback and let the client re-fetch after hydration.

Server Component example:
```tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/auth/me`, {
    headers: { Authorization: `Bearer ${(session as any).accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    // Handle 401/403 gracefully
    redirect("/login");
  }
  const me = await res.json();
  return <pre>{JSON.stringify(me, null, 2)}</pre>;
}
```

## Axios clients and refresh behavior
Each client shares the same design:
- Attach `Authorization: Bearer <accessToken>` using either the in-memory refreshed token or the NextAuth session token.
- `withCredentials: true` so the backend refresh cookie is sent.
- On 401, call `/v1/auth/refresh` on auth-service and update the NextAuth session, then retry once.

Key files:
- `src/lib/http.ts` (auth-service base: `NEXT_PUBLIC_API_BASE_URL`)
- `src/lib/httpProfile.ts` (profile-service base: `NEXT_PUBLIC_PROFILE_API_BASE_URL`, refreshes against auth-service)
- `src/lib/httpProjects.ts` (projects-service base: `NEXT_PUBLIC_PROJECTS_API_BASE_URL`, refreshes against auth-service)
- `src/lib/httpEvents.ts` (event-service base: `NEXT_PUBLIC_EVENTS_API_BASE_URL`, refreshes against auth-service; includes extra logging)
- `src/lib/authRefresh.ts` implements:
  - `refreshToken(authBase?)`: POSTs to `/v1/auth/refresh` with credentials, updates NextAuth via `signIn('credentials')`, and caches in-flight refresh to avoid thundering herds.
  - `getLatestAccessToken()`: returns the most recent in-memory access token so new requests can immediately attach it.
- `src/lib/api.ts`: a small fetch-based wrapper with the same semantics (optional alternative to Axios).

Example usage for any protected API (Axios):
```ts
import http from '@/lib/http';

const res = await http.get('/v1/auth/me');
```

## Quick recipes by service

### Profile-service
```ts
import { getMyProfile, upsertMyProfile } from '@/lib/profileApi';
const profile = await getMyProfile();
await upsertMyProfile({ collegeId: 'ABC', department: 'CSE', year: 3 });
```

### Projects-service
```ts
import projectsApi from '@/lib/projectsApi';
const { projects } = await projectsApi.listProjects({ q: 'ai', page: 1, limit: 10 });
const { project } = await projectsApi.createProject({ title: 'LLM Research', description: '...', projectType: 'RESEARCH', maxStudents: 3 });
const { application } = await projectsApi.applyToProject(project.id, { message: 'Interested!' });
```

### Events-service
```ts
import eventsApi from '@/lib/eventsApi';
const { events } = await eventsApi.listEvents({ upcomingOnly: true });
await eventsApi.registerForEvent(events[0].id);
// CSV export
const { blob, filename } = await eventsApi.exportRegistrations(events[0].id);
const url = URL.createObjectURL(blob); const a = document.createElement('a');
a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
```

## AuthContext API (recommended for UI)
`src/contexts/AuthContext.tsx` wraps NextAuth and exposes a simple API:
- `user: { id, name, email, role, ... } | null`
- `login(email, password): Promise<boolean>`
- `register({ email, password, name, ... }): Promise<boolean>`
- `logout(): Promise<void>`
- `updateProfile(updates: Partial<User>): void` (persists supported fields via Redux thunks to profile-service)

Role/user resolution:
- On session changes, the context resolves roles from `session.user.roles` if present.
- If roles are missing but an access token exists (e.g., right after OAuth), it calls `GET /v1/auth/me` via `getMe()` to hydrate roles and user fields.
- Me sync is debounced to avoid redundant requests.

Example UI usage:
```tsx
'use client';
import { useAuth } from '@/contexts/AuthContext';

export default function Example() {
  const { user, login, logout } = useAuth();
  // ... call login(email, password) on submit, render user.role, etc.
}
```


### Role-based UI guards
Use `useAuth()` to gate client-side UI by role.

Example admin-only section:
```tsx
'use client';
import { useAuth } from '@/contexts/AuthContext';

export function AdminOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-4 text-sm text-slate-500">Loading…</div>;
  if (!user || !['head_admin', 'dept_admin', 'placements_admin'].includes(user.role)) {
    return <div className="p-4 text-sm text-red-600">You do not have access.</div>;
  }
  return <>{children}</>;
}
```

## UI flows
- Login (`src/app/login/page.tsx`)
  - Calls `POST /v1/auth/login` via `http`, then `signIn('credentials', { accessToken, user })` to populate NextAuth.
  - Includes OAuth entry points: `signIn('google')` and `signIn('github')` redirecting to `/oauth/bridge?redirect=/`.

- OAuth exchange (`src/app/oauth/bridge/page.tsx`)
  - Reads `session.oauth` (set by the OAuth provider callback in NextAuth).
  - Calls `POST /v1/auth/oauth/exchange` with `{ provider, accessToken }` to obtain backend tokens.
  - On success, updates NextAuth via `signIn('credentials', ...)`, then redirects.

- Verify email (`src/app/verify-email/page.tsx`)
  - Reads `?token=...` and calls `POST /v1/auth/verify-email`.
  - On success, signs in with credentials to store the returned access token.

- Reset password (`src/app/reset-password/page.tsx`)
  - Reads `?token=...`, calls `POST /v1/auth/reset-password`, then signs in with credentials.

- Logout (`AuthContext.logout()`)
  - Calls `POST /v1/auth/logout` then `signOut({ redirect: false })` and navigates to `/login`.

- Forgot password (`src/app/forgot-password/page.tsx`)
  - Submits email to `POST /v1/auth/forgot-password`.
  - In dev, may show `debugUrl` and `debugPreviewUrl` returned by backend mailer for convenience.

- Resend verification (`src/app/resend-verification/page.tsx`)
  - Submits email to `POST /v1/auth/resend-verification`.
  - In dev, may show `debugUrl` and `debugPreviewUrl` for email preview/testing.


## Backend endpoints used (auth-service)
These endpoints are consumed by the frontend as implemented:
- `POST /v1/auth/register`
- `POST /v1/auth/login`
- `POST /v1/auth/refresh` (HttpOnly cookie)
- `POST /v1/auth/logout`
- `GET  /v1/auth/me`
- `POST /v1/auth/oauth/exchange`
- `POST /v1/auth/verify-email`
- `POST /v1/auth/reset-password`


## Security & CORS
- Access tokens are kept in NextAuth JWT and in-memory for immediate reuse; refresh tokens remain HttpOnly cookies set by the backend.
- All Axios clients use `withCredentials: true` to send the refresh cookie.
- Ensure backend CORS allows credentials and the `Authorization` header. The event-service is configured to expose `Content-Disposition` and allow `Authorization` in preflight (important for downloads and authorized requests).
- Never store tokens in localStorage/sessionStorage.


## Troubleshooting
- 401 loops:
  - Confirm `NEXT_PUBLIC_API_BASE_URL` matches the running auth-service base URL.
  - Check that the refresh cookie is present and the backend sets `Access-Control-Allow-Credentials: true`.
  - Verify `NEXTAUTH_SECRET` is set and `/api/auth/session` is reachable.
- OAuth exchange doesn’t complete:
  - Confirm provider env vars are set and valid.
  - Check that `session.oauth` contains `provider` and `accessToken` and that `/v1/auth/oauth/exchange` responds with `accessToken` and `user`.
- Roles not appearing:
  - Ensure `/v1/auth/me` returns `roles` and that interceptors attach `Authorization`.


## Minimal integration checklist
- [ ] Set `.env.local` with NextAuth values and service base URLs.
- [ ] Start backend services (auth-service and others) on the configured ports.
- [ ] Start the frontend (`npm run dev` or `pnpm dev`).
- [ ] Log in with email/password or OAuth; confirm `/oauth/bridge` completes.
- [ ] Hit a protected route and verify automatic refresh on expiry.
