# Nexus Frontend Events Guide

Fast reference for integrating the Events service.

- Base URL: `NEXT_PUBLIC_EVENTS_API_BASE_URL`
- Client: `src/lib/httpEvents.ts` (Axios with auth + refresh, extra 500 handling)
- API wrapper: `src/lib/eventsApi.ts`
- Redux integration: `src/store/slices/eventsSlice.ts`
- Badge-gated event creation for students (requires unlocking 8 default badges)
- Comprehensive moderation system for admins and department heads
- Event calendar with registration management and CSV export capabilities

## TL;DR Quick Start
1) Set `NEXT_PUBLIC_EVENTS_API_BASE_URL` in `.env.local`.
2) Import `eventsApi` and call typed methods.

```ts
import eventsApi from '@/lib/eventsApi';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchEvents, registerForEvent } from '@/store/slices/eventsSlice';

// Redux-integrated event fetching
const dispatch = useAppDispatch();
const events = useAppSelector(state => state.events.items);

// List upcoming events with filters
const { events } = await eventsApi.listEvents({ 
  upcomingOnly: true, 
  type: 'HACKATHON',
  department: 'Computer Science'
});

// Register / Unregister with real-time updates
await dispatch(registerForEvent(events[0].id));
await eventsApi.unregisterFromEvent(events[0].id);

// Check eligibility for event creation (students)
const { canCreate, missingBadges } = await eventsApi.getEligibility();
if (!canCreate) {
  console.log('Missing badges:', missingBadges);
}
```

## Concepts and data model
- __Event__: see `Event` in `src/lib/eventsApi.ts`. Important fields: `type` (HACKATHON, WORKSHOP, SEMINAR, CONFERENCE, COMPETITION, NETWORKING, OTHER), `mode` (ONSITE, ONLINE, HYBRID), `departments`, `visibleToAllDepts`, `capacity`, `moderationStatus`. Derived flags: `registrationCount`, `isRegistered`.
- __Moderation__: events can be `PENDING_REVIEW`, `APPROVED`, or `REJECTED`. Moderation can also assign a `monitor`. HEAD_ADMIN and DEPT_ADMIN can moderate events.
- __Registration__: a user joining an event; backend enforces capacity and uniqueness. Includes registration timestamp and user details.
- __Badge Eligibility__: students must unlock 8 default badges (Team Player, Leadership, Innovation, Problem Solver, Research Excellence, Community Impact, Outstanding Presentation, Top Contributor) to create events.
- __Event Calendar__: integrated calendar view with registration management, filtering, and "My Registrations" tab for students.

## Roles and authorization
- __Event Creation__: 
  - Faculty: unrestricted event creation
  - Students: requires unlocking 8 default badges first
  - Admins: full creation privileges
- __Moderation__: HEAD_ADMIN and DEPT_ADMIN can approve/reject/assign monitors to events
- __Registration__: all users can register for approved events if capacity allows
- __CSV Export__: restricted to event owners, monitors, and admins
- __Event Updates__: only event owners and admins can modify events
- __Department Visibility__: events can be restricted to specific departments or made college-wide

## Request semantics
- Create via `POST /v1/events`, update via `PUT /v1/events/:id`.
- Moderate via `PATCH /v1/events/:id/moderate` with `{ action: 'APPROVE' | 'REJECT' | 'ASSIGN', monitorId?: string }`.
- Export returns a Blob with `Content-Disposition` header; client must create a download link.
- Date fields (`startAt`, `endAt`) are ISO strings; treat as UTC in calculations.
- Badge eligibility check via `GET /v1/events/eligibility` returns `{ canCreate, missingBadges }`.
- Registration endpoints include capacity validation and duplicate prevention.

## Pagination and filters
- `listEvents(params)` returns `{ events, total, page, limit }`.
- Useful filters: `q`, `department`, `type`, `mode`, `status`, `from`, `to`, `upcomingOnly`, `moderationStatus`.
- Event calendar supports date range filtering and department-specific views.
- "My Registrations" filtering for students to view their registered events.
- Admin moderation queue with pending/approved/rejected status filters.
- Prefer server-side filtering; debounce text filters and always render from response envelope.

## Error handling
- `401` auto-refreshes once via Axios interceptors in `httpEvents.ts`.
- `403` indicates insufficient privileges (e.g., export without rights, moderation without role).
- `404` for missing/archived/non-visible events.
- `409` may indicate capacity or time-window conflicts; surface a clear message to the user.

## CSR vs SSR
- CSR via Axios gets refresh-on-401 and consistent credentials handling.
- SSR must attach `Authorization` from `getServerSession(authOptions)`; downloads (CSV) are browser-only.

## Quick recipes

### Event Management (Redux integrated)
```ts
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchEvents, createEvent, registerForEvent } from '@/store/slices/eventsSlice';

const dispatch = useAppDispatch();
const events = useAppSelector(state => state.events.items);

// Fetch events with filters
await dispatch(fetchEvents({ 
  upcomingOnly: true, 
  type: 'HACKATHON',
  department: 'Computer Science'
}));

// Create event (with eligibility check for students)
const { canCreate, missingBadges } = await eventsApi.getEligibility();
if (!canCreate) {
  toast.error(`Missing badges: ${missingBadges.join(', ')}`);
  return;
}

await dispatch(createEvent({
  title: 'AI/ML Hackathon 2024',
  description: '48-hour intensive coding competition with industry mentors',
  startAt: '2024-03-15T09:00:00Z',
  endAt: '2024-03-17T18:00:00Z',
  type: 'HACKATHON',
  mode: 'HYBRID',
  capacity: 150,
  visibleToAllDepts: true,
  departments: ['Computer Science', 'Data Science'],
  venue: 'Tech Hub, Building A'
}));

// Register for event
await dispatch(registerForEvent(eventId));
```

### Event Registration & Management
```ts
import eventsApi from '@/lib/eventsApi';

// Register/Unregister with capacity check
try {
  await eventsApi.registerForEvent(eventId);
  toast.success('Successfully registered for event!');
} catch (error) {
  if (error.response?.status === 409) {
    toast.error('Event is at full capacity');
  }
}

await eventsApi.unregisterFromEvent(eventId);

// Get my events and registrations
const myEvents = await eventsApi.getMyEvents();
const myRegistrations = await eventsApi.getMyRegistrations();
```

### Event Moderation (Admin/Dept Admin)
```ts
import eventsApi from '@/lib/eventsApi';

// Approve event with monitor assignment
await eventsApi.moderateEvent(eventId, { 
  action: 'APPROVE',
  monitorId: 'faculty-user-id',
  feedback: 'Great event proposal! Approved for college-wide participation.'
});

// Reject event with feedback
await eventsApi.moderateEvent(eventId, { 
  action: 'REJECT',
  feedback: 'Please provide more details about the learning outcomes.'
});

// Get pending events for moderation
const pendingEvents = await eventsApi.listEvents({ 
  moderationStatus: 'PENDING_REVIEW' 
});
```

### CSV Export & Analytics
```ts
import eventsApi from '@/lib/eventsApi';

// Export registrations to CSV
const handleExportRegistrations = async (eventId: string) => {
  try {
    const { blob, filename } = await eventsApi.exportRegistrations(eventId);
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `event-registrations-${eventId}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    
    toast.success('Registration data exported successfully!');
  } catch (error) {
    toast.error('Failed to export registration data');
  }
};
```

### Event Calendar Integration
```ts
import { useMemo } from 'react';
import { useAppSelector } from '@/store/hooks';

const EventCalendar = () => {
  const events = useAppSelector(state => state.events.items);
  
  // Transform events for calendar display
  const calendarEvents = useMemo(() => 
    events.map(event => ({
      id: event.id,
      title: event.title,
      start: event.startAt,
      end: event.endAt,
      color: getEventTypeColor(event.type),
      backgroundColor: event.isRegistered ? '#10b981' : '#6366f1',
      borderColor: event.isRegistered ? '#059669' : '#4f46e5',
      extendedProps: {
        type: event.type,
        mode: event.mode,
        isRegistered: event.isRegistered,
        capacity: event.capacity,
        registrationCount: event.registrationCount,
        moderationStatus: event.moderationStatus
      }
    })), [events]
  );
  
  const getEventTypeColor = (type: string) => {
    const colors = {
      HACKATHON: '#f59e0b',
      WORKSHOP: '#10b981',
      SEMINAR: '#6366f1',
      CONFERENCE: '#8b5cf6',
      COMPETITION: '#ef4444',
      NETWORKING: '#06b6d4',
      OTHER: '#6b7280'
    };
    return colors[type] || colors.OTHER;
  };
  
  // Calendar component JSX...
};
```

### Badge Eligibility Check (Students)
```ts
import { useEffect, useState } from 'react';
import eventsApi from '@/lib/eventsApi';

const EventCreationButton = () => {
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const checkEligibility = async () => {
      try {
        const result = await eventsApi.getEligibility();
        setEligibility(result);
      } catch (error) {
        console.error('Failed to check eligibility:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkEligibility();
  }, []);
  
  if (loading) return <div>Checking eligibility...</div>;
  
  if (!eligibility?.canCreate) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800">Badge Requirements</h3>
        <p className="text-yellow-700 mb-2">
          You need to unlock these badges to create events:
        </p>
        <ul className="list-disc list-inside text-yellow-700">
          {eligibility?.missingBadges?.map(badge => (
            <li key={badge}>{badge}</li>
          ))}
        </ul>
      </div>
    );
  }
  
  return (
    <button 
      onClick={() => router.push('/events/create')}
      className="btn btn-primary"
    >
      Create Event
    </button>
  );
};
```

## Event Calendar Features

### Student Event Calendar
- View all approved events in calendar format
- Filter by event type, department, and date range
- "My Registrations" tab showing registered events
- One-click registration/unregistration
- Real-time capacity updates
- Event details modal with registration status

### Faculty/Admin Event Management
- Create events with department visibility controls
- Moderate pending events (approve/reject/assign monitors)
- Export registration lists to CSV
- Monitor event capacity and attendance
- Bulk event operations for administrators

### Badge-Gated Creation (Students)
- Students must unlock 8 default badges before creating events:
  - Team Player
  - Leadership 
  - Innovation
  - Problem Solver
  - Research Excellence
  - Community Impact
  - Outstanding Presentation
  - Top Contributor
- Badge progress indicator in event creation UI
- Clear messaging about missing badge requirements

## SSR usage
- Use `getServerSession(authOptions)` and attach `Authorization`.
- Event CSV exports are browser-only (Blob + download).
- Calendar data fetching can be done server-side for initial page load.

## Troubleshooting
- Ensure backend CORS exposes `Content-Disposition` and allows `Authorization` with credentials for downloads.
- 401/500 handling is already in `httpEvents.ts`.
- Badge eligibility: verify student has required badges before showing event creation UI.
- Registration failures: check event capacity and approval status.
- Moderation issues: ensure user has HEAD_ADMIN or DEPT_ADMIN role.
