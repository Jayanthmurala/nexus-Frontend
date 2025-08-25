import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import eventsApi, {
  eventsApi as eventsApiNamed,
  type Event,
  type CreateEventRequest,
  type UpdateEventRequest,
  type EventsListParams,
  type EventsListResponse,
  type EventRegistration,
  type ModerateEventRequest,
} from '@/lib/eventsApi';

interface EventsState {
  items: Event[];
  mine: Event[];
  current: Event | null;
  eligibility: { canCreate: boolean; missingBadges: string[] } | null;
  loading: boolean;
  error?: string;
  pagination: {
    page: number;
    total: number;
  };
}

const initialState: EventsState = {
  items: [],
  mine: [],
  current: null,
  eligibility: null,
  loading: false,
  pagination: { page: 1, total: 0 },
};

// List events with filters/pagination
export const fetchEvents = createAsyncThunk<EventsListResponse, EventsListParams | undefined>(
  'events/fetchEvents',
  async (params) => {
    return await eventsApiNamed.listEvents(params);
  }
);

// Get my events (authored and/or registered)
export const fetchMyEvents = createAsyncThunk<Event[]>(
  'events/fetchMyEvents',
  async () => {
    const res = await eventsApiNamed.getMyEvents();
    return res.events;
  }
);

// Get single event
export const fetchEventById = createAsyncThunk<Event, string>(
  'events/fetchEventById',
  async (id) => {
    const res = await eventsApiNamed.getEvent(id);
    return res.event;
  }
);

// Create event
export const createEvent = createAsyncThunk<Event, CreateEventRequest>(
  'events/create',
  async (payload) => {
    const res = await eventsApiNamed.createEvent(payload);
    return res.event;
  }
);

// Update event
export const updateEvent = createAsyncThunk<Event, { id: string; changes: UpdateEventRequest }>(
  'events/update',
  async ({ id, changes }) => {
    const res = await eventsApiNamed.updateEvent(id, changes);
    return res.event;
  }
);

// Moderate event (admins)
export const moderateEvent = createAsyncThunk<Event, { id: string; data: ModerateEventRequest }>(
  'events/moderate',
  async ({ id, data }) => {
    const res = await eventsApiNamed.moderateEvent(id, data);
    return res.event;
  }
);

// Register
export const registerForEvent = createAsyncThunk<EventRegistration, string>(
  'events/register',
  async (id) => {
    const res = await eventsApiNamed.registerForEvent(id);
    return res.registration;
  }
);

// Unregister
export const unregisterFromEvent = createAsyncThunk<string, string>(
  'events/unregister',
  async (id) => {
    await eventsApiNamed.unregisterFromEvent(id);
    return id;
  }
);

// Delete event (authorized roles per backend)
export const deleteEventById = createAsyncThunk<string, string>(
  'events/delete',
  async (id) => {
    await eventsApiNamed.deleteEvent(id);
    return id;
  }
);

// Export registrations CSV (FACULTY only). Returns blob+filename; caller should handle download
export const exportEventRegistrations = createAsyncThunk<{ blob: Blob; filename: string }, string>(
  'events/exportRegistrations',
  async (id) => {
    return await eventsApiNamed.exportRegistrations(id);
  }
);

// Eligibility for student event creation
export const fetchEventEligibility = createAsyncThunk<{ canCreate: boolean; missingBadges: string[] }>(
  'events/fetchEligibility',
  async () => {
    return await eventsApiNamed.getEligibility();
  }
);

const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    clearError: (state) => { state.error = undefined; },
    resetPagination: (state) => { state.pagination = { page: 1, total: 0 }; },
    clearCurrent: (state) => { state.current = null; },
  },
  extraReducers: (builder) => {
    builder
      // list
      .addCase(fetchEvents.pending, (state) => {
        state.loading = true; state.error = undefined;
      })
      .addCase(fetchEvents.fulfilled, (state, action: PayloadAction<EventsListResponse>) => {
        state.loading = false;
        state.items = action.payload.events;
        state.pagination = { page: action.payload.page, total: action.payload.total };
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false; state.error = action.error.message || 'Failed to load events';
      })

      // mine
      .addCase(fetchMyEvents.pending, (state) => { state.loading = true; state.error = undefined; })
      .addCase(fetchMyEvents.fulfilled, (state, action: PayloadAction<Event[]>) => {
        state.loading = false; state.mine = action.payload;
      })
      .addCase(fetchMyEvents.rejected, (state, action) => {
        state.loading = false; state.error = action.error.message || 'Failed to load my events';
      })

      // get by id
      .addCase(fetchEventById.pending, (state) => { state.loading = true; state.error = undefined; })
      .addCase(fetchEventById.fulfilled, (state, action: PayloadAction<Event>) => {
        state.loading = false; state.current = action.payload;
      })
      .addCase(fetchEventById.rejected, (state, action) => {
        state.loading = false; state.error = action.error.message || 'Failed to load event';
      })

      // create
      .addCase(createEvent.pending, (state) => { state.loading = true; state.error = undefined; })
      .addCase(createEvent.fulfilled, (state, action: PayloadAction<Event>) => {
        state.loading = false; state.items = [action.payload, ...state.items];
        // If current user authored, reflect in mine list optimistically
        state.mine = [action.payload, ...state.mine];
      })
      .addCase(createEvent.rejected, (state, action) => {
        state.loading = false; state.error = action.error.message || 'Failed to create event';
      })

      // update
      .addCase(updateEvent.pending, (state) => { state.loading = true; state.error = undefined; })
      .addCase(updateEvent.fulfilled, (state, action: PayloadAction<Event>) => {
        state.loading = false;
        state.items = state.items.map((e) => e.id === action.payload.id ? action.payload : e);
        state.mine = state.mine.map((e) => e.id === action.payload.id ? action.payload : e);
        if (state.current?.id === action.payload.id) state.current = action.payload;
      })
      .addCase(updateEvent.rejected, (state, action) => {
        state.loading = false; state.error = action.error.message || 'Failed to update event';
      })

      // moderate
      .addCase(moderateEvent.pending, (state) => { state.loading = true; state.error = undefined; })
      .addCase(moderateEvent.fulfilled, (state, action: PayloadAction<Event>) => {
        state.loading = false;
        state.items = state.items.map((e) => e.id === action.payload.id ? action.payload : e);
        state.mine = state.mine.map((e) => e.id === action.payload.id ? action.payload : e);
        if (state.current?.id === action.payload.id) state.current = action.payload;
      })
      .addCase(moderateEvent.rejected, (state, action) => {
        state.loading = false; state.error = action.error.message || 'Failed to moderate event';
      })

      // register
      .addCase(registerForEvent.pending, (state) => { state.loading = true; state.error = undefined; })
      .addCase(registerForEvent.fulfilled, (state, action: PayloadAction<EventRegistration>) => {
        state.loading = false;
        const eventId = action.payload.eventId;
        const applyUpdate = (e: Event) =>
          e.id === eventId
            ? {
                ...e,
                isRegistered: true,
                registrationCount: (e.registrationCount ?? 0) + 1,
              }
            : e;
        state.items = state.items.map(applyUpdate);
        state.mine = state.mine.map(applyUpdate);
        if (state.current?.id === eventId) {
          state.current = {
            ...state.current,
            isRegistered: true,
            registrationCount: (state.current.registrationCount ?? 0) + 1,
          };
        }
      })
      .addCase(registerForEvent.rejected, (state, action) => {
        state.loading = false; state.error = action.error.message || 'Failed to register for event';
      })

      // unregister
      .addCase(unregisterFromEvent.pending, (state) => { state.loading = true; state.error = undefined; })
      .addCase(unregisterFromEvent.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        const eventId = action.payload;
        const applyUpdate = (e: Event) =>
          e.id === eventId
            ? {
                ...e,
                isRegistered: false,
                registrationCount: Math.max(0, (e.registrationCount ?? 0) - 1),
              }
            : e;
        state.items = state.items.map(applyUpdate);
        state.mine = state.mine.map(applyUpdate);
        if (state.current?.id === eventId) {
          state.current = {
            ...state.current,
            isRegistered: false,
            registrationCount: Math.max(0, (state.current.registrationCount ?? 0) - 1),
          };
        }
      })
      .addCase(unregisterFromEvent.rejected, (state, action) => {
        state.loading = false; state.error = action.error.message || 'Failed to unregister from event';
      })

      // delete
      .addCase(deleteEventById.pending, (state) => { state.loading = true; state.error = undefined; })
      .addCase(deleteEventById.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        const id = action.payload;
        state.items = state.items.filter((e) => e.id !== id);
        state.mine = state.mine.filter((e) => e.id !== id);
        if (state.current?.id === id) state.current = null;
      })
      .addCase(deleteEventById.rejected, (state, action) => {
        state.loading = false; state.error = action.error.message || 'Failed to delete event';
      })

      // export (toggle loading only; do not store blob in state)
      .addCase(exportEventRegistrations.pending, (state) => { state.loading = true; state.error = undefined; })
      .addCase(exportEventRegistrations.fulfilled, (state) => { state.loading = false; })
      .addCase(exportEventRegistrations.rejected, (state, action) => {
        state.loading = false; state.error = action.error.message || 'Failed to export registrations';
      })

      // eligibility
      .addCase(fetchEventEligibility.fulfilled, (state, action: PayloadAction<{ canCreate: boolean; missingBadges: string[] }>) => {
        state.eligibility = action.payload;
      });
  },
});

// Selectors
export const selectEvents = (state: RootState) => state.events.items;
export const selectMyEvents = (state: RootState) => state.events.mine;
export const selectCurrentEvent = (state: RootState) => state.events.current;
export const selectEventsLoading = (state: RootState) => state.events.loading;
export const selectEventsError = (state: RootState) => state.events.error;
export const selectEventsPagination = (state: RootState) => state.events.pagination;
export const selectEventEligibility = (state: RootState) => state.events.eligibility;

// Actions
export const { clearError, resetPagination, clearCurrent } = eventsSlice.actions;

export default eventsSlice.reducer;
