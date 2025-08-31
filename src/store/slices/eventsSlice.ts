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
  type EventEligibility,
  type EventApprovalFlow,
} from '@/lib/eventsApi';

interface EventsState {
  items: Event[];
  mine: Event[];
  myRegisteredEventIds: string[];
  myRegistrations: EventRegistration[];
  current: Event | null;
  eligibility: EventEligibility | null;
  approvalFlows: Record<string, EventApprovalFlow>; // eventId -> flow
  loading: boolean;
  // Per-thunk in-flight flags to guard duplicate requests
  isFetchingList: boolean;
  isFetchingMine: boolean;
  isFetchingRegistrations: boolean;
  isFetchingEligibility: boolean;
  error?: string;
  pagination: {
    page: number;
    total: number;
    limit: number;
  };
  filters: {
    department?: string;
    type?: string;
    mode?: string;
    status?: string;
    upcomingOnly?: boolean;
  };
}

const initialState: EventsState = {
  items: [],
  mine: [],
  myRegisteredEventIds: [],
  myRegistrations: [],
  current: null,
  eligibility: null,
  approvalFlows: {},
  loading: false,
  isFetchingList: false,
  isFetchingMine: false,
  isFetchingRegistrations: false,
  isFetchingEligibility: false,
  pagination: { page: 1, total: 0, limit: 20 },
  filters: {},
};

// List events with filters/pagination
export const fetchEvents = createAsyncThunk<
  EventsListResponse,
  EventsListParams | undefined,
  { state: RootState }
>(
  'events/fetchEvents',
  async (params) => {
    return await eventsApiNamed.listEvents(params);
  },
  {
    condition: (_arg, { getState }) => {
      const { isFetchingList } = (getState() as RootState).events;
      // Prevent duplicate in-flight list requests
      return !isFetchingList;
    },
  }
);

// Get my events (authored and/or registered)
export const fetchMyEvents = createAsyncThunk<Event[], void, { state: RootState }>(
  'events/fetchMyEvents',
  async () => {
    const res = await eventsApiNamed.getMyEvents();
    return res.events;
  },
  {
    condition: (_arg, { getState }) => {
      const { isFetchingMine } = (getState() as RootState).events;
      // Prevent duplicate in-flight "mine" requests
      return !isFetchingMine;
    },
  }
);

// Fetch my registrations to get registered event IDs
export const fetchMyRegistrations = createAsyncThunk<EventRegistration[], void, { state: RootState }>(
  'events/fetchMyRegistrations',
  async () => {
    // This would call a backend endpoint like GET /v1/events/registrations/mine
    // For now, we'll extract from myEvents
    const res = await eventsApiNamed.getMyEvents();
    // Filter events where user is registered (not authored)
    const registrations: EventRegistration[] = res.events
      .filter(event => event.isRegistered)
      .map(event => ({
        id: `reg-${event.id}`,
        eventId: event.id,
        userId: 'current-user', // This would come from auth context
        joinedAt: new Date().toISOString()
      }));
    return registrations;
  },
  {
    condition: (_arg, { getState }) => {
      const { isFetchingRegistrations } = (getState() as RootState).events;
      return !isFetchingRegistrations;
    },
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
export const fetchEventEligibility = createAsyncThunk<EventEligibility, void, { state: RootState }>(
  'events/fetchEligibility',
  async () => {
    return await eventsApiNamed.getEligibility();
  },
  {
    condition: (_arg, { getState }) => {
      const { isFetchingEligibility } = (getState() as RootState).events;
      return !isFetchingEligibility;
    },
  }
);

// Fetch approval flows for events (admin only)
export const fetchApprovalFlows = createAsyncThunk<EventApprovalFlow[], string | undefined>(
  'events/fetchApprovalFlows',
  async (eventId) => {
    const res = await eventsApiNamed.getApprovalFlows(eventId);
    return res.flows;
  }
);

const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    clearError: (state) => { state.error = undefined; },
    resetPagination: (state) => { state.pagination = { page: 1, total: 0, limit: 20 }; },
    clearCurrent: (state) => { state.current = null; },
    setFilters: (state, action: PayloadAction<Partial<EventsState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    updateApprovalFlow: (state, action: PayloadAction<EventApprovalFlow>) => {
      state.approvalFlows[action.payload.eventId] = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // list
      .addCase(fetchEvents.pending, (state) => {
        state.loading = true; state.error = undefined;
        state.isFetchingList = true;
      })
      .addCase(fetchEvents.fulfilled, (state, action: PayloadAction<EventsListResponse>) => {
        state.loading = false;
        state.isFetchingList = false;
        state.items = action.payload.events;
        state.pagination = { page: action.payload.page, total: action.payload.total, limit: action.payload.limit };
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false; state.error = action.error.message || 'Failed to load events';
        state.isFetchingList = false;
      })

      // mine
      .addCase(fetchMyEvents.pending, (state) => {
        state.loading = true; state.error = undefined;
        state.isFetchingMine = true;
      })
      .addCase(fetchMyEvents.fulfilled, (state, action: PayloadAction<Event[]>) => {
        state.loading = false; state.mine = action.payload;
        state.isFetchingMine = false;
        // Update registered event IDs from the events
        state.myRegisteredEventIds = action.payload
          .filter(event => event.isRegistered)
          .map(event => event.id);
      })
      .addCase(fetchMyEvents.rejected, (state, action) => {
        state.loading = false; state.error = action.error.message || 'Failed to load my events';
        state.isFetchingMine = false;
      })

      // my registrations
      .addCase(fetchMyRegistrations.pending, (state) => {
        state.isFetchingRegistrations = true;
        state.error = undefined;
      })
      .addCase(fetchMyRegistrations.fulfilled, (state, action: PayloadAction<EventRegistration[]>) => {
        state.myRegistrations = action.payload;
        state.myRegisteredEventIds = action.payload.map(reg => reg.eventId);
        state.isFetchingRegistrations = false;
      })
      .addCase(fetchMyRegistrations.rejected, (state, action) => {
        state.isFetchingRegistrations = false;
        state.error = action.error.message || 'Failed to load registrations';
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

      // update (optimistic updates without loading state)
      .addCase(updateEvent.pending, (state) => { state.error = undefined; })
      .addCase(updateEvent.fulfilled, (state, action: PayloadAction<Event>) => {
        state.items = state.items.map((e) => e.id === action.payload.id ? action.payload : e);
        state.mine = state.mine.map((e) => e.id === action.payload.id ? action.payload : e);
        if (state.current?.id === action.payload.id) state.current = action.payload;
      })
      .addCase(updateEvent.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to update event';
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
      .addCase(registerForEvent.pending, (state) => { state.error = undefined; })
      .addCase(registerForEvent.fulfilled, (state, action: PayloadAction<EventRegistration>) => {
        const eventId = action.payload.eventId;
        
        // Add to registered events
        if (!state.myRegisteredEventIds.includes(eventId)) {
          state.myRegisteredEventIds.push(eventId);
        }
        
        const applyUpdate = (e: Event) =>
          e.id === eventId
            ? {
                ...e,
                registrationCount: (e.registrationCount || 0) + 1,
                isRegistered: true,
              }
            : e;

        state.items = state.items.map(applyUpdate);
        if (state.current?.id === eventId) {
          state.current = {
            ...state.current,
            registrationCount: (state.current.registrationCount || 0) + 1,
            isRegistered: true,
          };
        }
      })
      .addCase(registerForEvent.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to register for event';
      })

      // unregister
      .addCase(unregisterFromEvent.pending, (state) => { state.error = undefined; })
      .addCase(unregisterFromEvent.fulfilled, (state, action: PayloadAction<string>) => {
        const eventId = action.payload;
        
        // Remove from registered events
        state.myRegisteredEventIds = state.myRegisteredEventIds.filter(id => id !== eventId);
        
        const applyUpdate = (e: Event) =>
          e.id === eventId
            ? {
                ...e,
                registrationCount: Math.max(0, (e.registrationCount || 0) - 1),
                isRegistered: false,
              }
            : e;

        state.items = state.items.map(applyUpdate);
        if (state.current?.id === eventId) {
          state.current = {
            ...state.current,
            registrationCount: Math.max(0, (state.current.registrationCount || 0) - 1),
            isRegistered: false,
          };
        }
      })
      .addCase(unregisterFromEvent.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to unregister from event';
      })

      // delete (optimistic updates without loading state)
      .addCase(deleteEventById.pending, (state) => { state.error = undefined; })
      .addCase(deleteEventById.fulfilled, (state, action: PayloadAction<string>) => {
        const id = action.payload;
        state.items = state.items.filter((e) => e.id !== id);
        state.mine = state.mine.filter((e) => e.id !== id);
        if (state.current?.id === id) state.current = null;
      })
      .addCase(deleteEventById.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to delete event';
      })

      // export (no loading state to avoid page re-render)
      .addCase(exportEventRegistrations.pending, (state) => { state.error = undefined; })
      .addCase(exportEventRegistrations.fulfilled, (state) => { /* No state changes needed */ })
      .addCase(exportEventRegistrations.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to export registrations';
      })

      // eligibility
      .addCase(fetchEventEligibility.pending, (state) => {
        state.isFetchingEligibility = true;
        state.error = undefined;
      })
      .addCase(fetchEventEligibility.fulfilled, (state, action: PayloadAction<EventEligibility>) => {
        state.eligibility = action.payload;
        state.isFetchingEligibility = false;
      })
      .addCase(fetchEventEligibility.rejected, (state, action) => {
        state.isFetchingEligibility = false;
        state.error = action.error.message || 'Failed to check eligibility';
      })

      // approval flows
      .addCase(fetchApprovalFlows.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchApprovalFlows.fulfilled, (state, action: PayloadAction<EventApprovalFlow[]>) => {
        state.loading = false;
        // Update approval flows by eventId
        action.payload.forEach(flow => {
          state.approvalFlows[flow.eventId] = flow;
        });
      })
      .addCase(fetchApprovalFlows.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch approval flows';
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
export const selectApprovalFlows = (state: RootState) => state.events.approvalFlows;
export const selectEventFilters = (state: RootState) => state.events.filters;
export const selectIsFetchingEligibility = (state: RootState) => state.events.isFetchingEligibility;
export const selectMyRegisteredEvents = (state: RootState) => state.events.myRegisteredEventIds;
export const selectMyRegistrations = (state: RootState) => state.events.myRegistrations;
export const selectIsFetchingRegistrations = (state: RootState) => state.events.isFetchingRegistrations;

// Actions
export const { clearError, resetPagination, clearCurrent, setFilters, clearFilters, updateApprovalFlow } = eventsSlice.actions;

export default eventsSlice.reducer;
