# Nexus Frontend Events Guide

Fast reference for integrating the Events service.

- Base URL: `NEXT_PUBLIC_EVENTS_API_BASE_URL`
- Client: `src/lib/httpEvents.ts` (Axios with auth + refresh, extra 500 handling)
- API wrapper: `src/lib/eventsApi.ts`

## TL;DR Quick Start
1) Set `NEXT_PUBLIC_EVENTS_API_BASE_URL` in `.env.local`.
2) Import `eventsApi` and call typed methods.

```ts
import eventsApi from '@/lib/eventsApi';

// List upcoming events
const { events } = await eventsApi.listEvents({ upcomingOnly: true });

// Register / Unregister
await eventsApi.registerForEvent(events[0].id);
await eventsApi.unregisterFromEvent(events[0].id);
```

## Concepts and data model
- __Event__: see `Event` in `src/lib/eventsApi.ts`. Important fields: `type`, `mode`, `departments`, `visibleToAllDepts`, `capacity`, `moderationStatus`. Derived flags: `registrationCount`, `isRegistered`.
- __Moderation__: events can be `PENDING_REVIEW`, `APPROVED`, or `REJECTED`. Moderation can also assign a `monitor`.
- __Registration__: a user joining an event; backend enforces capacity and uniqueness.

## Roles and authorization
- Creation/update usually requires faculty/admin privileges; moderation requires admin/monitor.
- Students can register/unregister for approved events if eligible and capacity allows.
- Exporting registrations (CSV) is restricted to event owners/monitors/admins; UI should hide export if `403` occurs.

## Request semantics
- Create via `POST /v1/events`, update via `PUT /v1/events/:id`.
- Moderate via `PATCH /v1/events/:id/moderate` with `{ action: 'APPROVE' | 'REJECT' | 'ASSIGN' }`.
- Export returns a Blob with `Content-Disposition` header; client must create a download link.
- Date fields (`startAt`, `endAt`) are ISO strings; treat as UTC in calculations.

## Pagination and filters
- `listEvents(params)` returns `{ events, total, page, limit }`.
- Useful filters: `q`, `department`, `type`, `mode`, `status`, `from`, `to`, `upcomingOnly`.
- Prefer server-side filtering; debounce text filters and always render from response envelope.

## Error handling
- `401` auto-refreshes once via Axios interceptors in `httpEvents.ts`.
- `403` indicates insufficient privileges (e.g., export without rights, moderation without role).
- `404` for missing/archived/non-visible events.
- `409` may indicate capacity or time-window conflicts; surface a clear message to the user.

## CSR vs SSR
- CSR via Axios gets refresh-on-401 and consistent credentials handling.
- SSR must attach `Authorization` from `getServerSession(authOptions)`; downloads (CSV) are browser-only.

## Create/Update/Moderate
```ts
// Create
const { event } = await eventsApi.createEvent({
  title: 'Hackathon', description: '24h build', startAt: new Date().toISOString(), endAt: new Date().toISOString(),
  type: 'HACKATHON', mode: 'ONSITE', visibleToAllDepts: true,
});

// Update
await eventsApi.updateEvent(event.id, { description: '36h build' });

// Moderate (admin/monitor)
await eventsApi.moderateEvent(event.id, { action: 'APPROVE' });
```

## Export registrations (CSV download)
```ts
const { blob, filename } = await eventsApi.exportRegistrations(event.id);
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url; a.download = filename; document.body.appendChild(a);
a.click(); a.remove(); URL.revokeObjectURL(url);
```

## Eligibility and My Events
```ts
const { canCreate, missingBadges } = await eventsApi.getEligibility();
const mine = await eventsApi.getMyEvents();
```

## SSR usage
- Use `getServerSession(authOptions)` and attach `Authorization`.
- Event CSV exports are browser-only (Blob + download).

## Troubleshooting
- Ensure backend CORS exposes `Content-Disposition` and allows `Authorization` with credentials for downloads.
- 401/500 handling is already in `httpEvents.ts`.
