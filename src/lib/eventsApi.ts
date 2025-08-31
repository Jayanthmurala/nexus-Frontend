import httpEvents from './httpEvents';

// Types matching backend Zod schemas and Prisma models
export type EventType = "WORKSHOP" | "SEMINAR" | "HACKATHON" | "MEETUP";
export type EventMode = "ONLINE" | "ONSITE" | "HYBRID";
export type ModerationStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED";

// Legacy types for backward compatibility during migration
export type LegacyEventType = 'workshop' | 'seminar' | 'competition' | 'networking';
export type LegacyEventMode = 'online' | 'in_person' | 'hybrid';

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
  registrationDeadline?: string | null; // ISO
  visibleToAllDepts: boolean;
  departments: string[];
  tags: string[];
  requirements?: string;
  benefits?: string;
  moderationStatus: ModerationStatus;
  monitorId?: string | null;
  monitorName?: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
  // Aggregated/derived fields included by backend for convenience
  registrationCount: number; // total registrations for the event (default 0)
  isRegistered?: boolean; // whether the current user is registered
}

// Badge eligibility response
export interface EventEligibility {
  canCreate: boolean;
  missingBadges: string[];
  badgesEarned?: number;
  badgesRequired?: number;
  progressPercentage?: number;
}

// Approval flow tracking
export interface EventApprovalFlow {
  id: string;
  eventId: string;
  submittedAt: string;
  assignedTo?: string;
  assignedToName?: string;
  escalatedAt?: string;
  escalatedTo?: string;
  escalatedToName?: string;
  approvedAt?: string;
  approvedBy?: string;
  approvedByName?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectedByName?: string;
  rejectionReason?: string;
  mentorAssigned?: string;
  mentorName?: string;
  isEscalated: boolean;
}

export interface CreateEventRequest {
  title: string;
  description: string;
  startAt: string; // ISO
  endAt?: string;  // ISO - Optional for single-day events
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
  mentorId?: string;
  mentorName?: string;
  rejectionReason?: string;
}

export const eventsApi = {
  // List events with optional filters/pagination
  async listEvents(params?: EventsListParams): Promise<EventsListResponse> {
    const response = await httpEvents.get('/v1/events', { params });
    return response.data;
  },

  // Get single event by ID
  async getEvent(id: string): Promise<{ event: Event }> {
    const response = await httpEvents.get(`/v1/events/${id}`);
    return response.data;
  },

  // Get my events (authored + registered)
  async getMyEvents(): Promise<{ events: Event[] }> {
    const response = await httpEvents.get('/v1/events/my');
    return response.data;
  },

  // Create event
  async createEvent(data: CreateEventRequest): Promise<{ event: Event }> {
    const response = await httpEvents.post('/v1/events', data);
    return response.data;
  },

  // Update event
  async updateEvent(id: string, data: UpdateEventRequest): Promise<{ event: Event }> {
    const response = await httpEvents.put(`/v1/events/${id}`, data);
    return response.data;
  },

  // Delete event
  async deleteEvent(id: string): Promise<void> {
    await httpEvents.delete(`/v1/events/${id}`);
  },

  // Register for event
  async registerForEvent(id: string): Promise<{ registration: EventRegistration }> {
    const response = await httpEvents.post(`/v1/events/${id}/register`);
    return response.data;
  },

  // Unregister from event
  async unregisterFromEvent(id: string): Promise<void> {
    await httpEvents.delete(`/v1/events/${id}/register`);
  },

  // Moderate event (admin only)
  async moderateEvent(id: string, data: ModerateEventRequest): Promise<{ event: Event }> {
    const response = await httpEvents.post(`/v1/events/${id}/moderate`, data);
    return response.data;
  },

  // Export registrations (faculty only)
  async exportRegistrations(id: string): Promise<{ blob: Blob; filename: string }> {
    const response = await httpEvents.get(`/v1/events/${id}/export`, {
      responseType: 'blob',
    });
    const filename = response.headers['content-disposition']?.match(/filename="(.+)"/)?.[1] || `event-${id}-registrations.csv`;
    return { blob: response.data, filename };
  },

  // Check badge eligibility for event creation (students)
  async getEligibility(): Promise<EventEligibility> {
    const response = await httpEvents.get('/v1/events/eligibility');
    return response.data;
  },

  // Get approval flows for events (admin only)
  async getApprovalFlows(eventId?: string): Promise<{ flows: EventApprovalFlow[] }> {
    const url = eventId ? `/v1/events/${eventId}/approval-flow` : '/v1/events/approval-flows';
    const response = await httpEvents.get(url);
    return response.data;
  },
};

export default eventsApi;
