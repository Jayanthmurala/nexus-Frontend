import httpEvents from './httpEvents';

// Types matching backend Zod schemas and Prisma models
export type EventType = "WORKSHOP" | "SEMINAR" | "HACKATHON" | "MEETUP";
export type EventMode = "ONLINE" | "ONSITE" | "HYBRID";
export type ModerationStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED";

export interface Event {
  id: string;
  collegeId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  title: string;
  description: string;
  startAt: string; // ISO
  endAt: string;   // ISO
  type: EventType;
  mode: EventMode;
  location?: string | null;
  meetingUrl?: string | null;
  capacity?: number | null;
  visibleToAllDepts: boolean;
  departments: string[];
  tags: string[];
  moderationStatus: ModerationStatus;
  monitorId?: string | null;
  monitorName?: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
  // Aggregated/derived fields included by backend for convenience
  registrationCount?: number; // total registrations for the event
  isRegistered?: boolean; // whether the current user is registered
}

export interface CreateEventRequest {
  title: string;
  description: string;
  startAt: string; // ISO
  endAt: string;   // ISO
  type: EventType;
  mode: EventMode;
  location?: string;
  meetingUrl?: string;
  capacity?: number;
  visibleToAllDepts?: boolean;
  departments?: string[];
  tags?: string[];
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  startAt?: string; // ISO
  endAt?: string;   // ISO
  type?: EventType;
  mode?: EventMode;
  location?: string | null;
  meetingUrl?: string | null;
  capacity?: number | null;
  visibleToAllDepts?: boolean;
  departments?: string[];
  tags?: string[];
}

export interface EventsListParams {
  q?: string;
  department?: string;
  type?: EventType;
  mode?: EventMode;
  status?: ModerationStatus;
  from?: string; // ISO
  to?: string;   // ISO
  upcomingOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface EventsListResponse {
  events: Event[];
  total: number;
  page: number;
  limit: number;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  joinedAt: string;
}

export interface ModerateEventRequest {
  action: "APPROVE" | "REJECT" | "ASSIGN";
  monitorId?: string;
  monitorName?: string;
}

export const eventsApi = {
  async listEvents(params?: EventsListParams): Promise<EventsListResponse> {
    const res = await httpEvents.get('/v1/events', { params });
    return res.data;
  },

  async getEvent(id: string): Promise<{ event: Event }> {
    const res = await httpEvents.get(`/v1/events/${id}`);
    return res.data;
  },

  async createEvent(data: CreateEventRequest): Promise<{ event: Event }> {
    const res = await httpEvents.post('/v1/events', data);
    return res.data;
  },

  async updateEvent(id: string, data: UpdateEventRequest): Promise<{ event: Event }> {
    const res = await httpEvents.put(`/v1/events/${id}`, data);
    return res.data;
  },

  async moderateEvent(id: string, data: ModerateEventRequest): Promise<{ event: Event }> {
    const res = await httpEvents.patch(`/v1/events/${id}/moderate`, data);
    return res.data;
  },

  async registerForEvent(id: string): Promise<{ registration: EventRegistration }> {
    const res = await httpEvents.post(`/v1/events/${id}/register`);
    return res.data;
  },

  async unregisterFromEvent(id: string): Promise<{ success: boolean }> {
    const res = await httpEvents.delete(`/v1/events/${id}/register`);
    return res.data;
  },

  async getMyEvents(): Promise<{ events: Event[] }> {
    const res = await httpEvents.get('/v1/events/mine');
    return res.data;
  },

  async getEligibility(): Promise<{ canCreate: boolean; missingBadges: string[] }> {
    const res = await httpEvents.get('/v1/events/eligibility');
    return res.data;
  },

  async deleteEvent(id: string): Promise<{ success: boolean }> {
    const res = await httpEvents.delete(`/v1/events/${id}`);
    return res.data;
  },

  async exportRegistrations(id: string): Promise<{ blob: Blob; filename: string }> {
    const res = await httpEvents.get(`/v1/events/${id}/export`, { responseType: 'blob' });
    let filename = 'registrations.csv';
    const cd = (res.headers as any)?.['content-disposition'] as string | undefined;
    if (cd) {
      const match = cd.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
      const raw = decodeURIComponent(match?.[1] || match?.[2] || '');
      if (raw) filename = raw;
    }
    return { blob: res.data as Blob, filename };
  },
};

export default eventsApi;
