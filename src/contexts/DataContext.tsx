'use client';

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { User } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchMyProjects, fetchProjects, createProject as createProjectThunk, updateProject as updateProjectThunk, deleteProject as deleteProjectThunk, selectProjects } from '@/store/slices/projectsSlice';
import type { Project as ReduxProject, CreateProjectRequest, UpdateProjectRequest, ProjectType } from '@/lib/projectsApi';
import { fetchMyApplications, fetchProjectApplications, applyToProject as applyToProjectThunk, updateApplicationStatusThunk, selectMyApplications } from '@/store/slices/applicationsSlice';
import { fetchEvents as fetchEventsThunk, fetchMyEvents as fetchMyEventsThunk, createEvent as createEventThunkEvents, registerForEvent as registerForEventThunk, unregisterFromEvent as unregisterFromEventThunk, selectEvents as selectReduxEvents } from '@/store/slices/eventsSlice';
import type { Event as ApiEvent, CreateEventRequest as CreateEventReq, EventMode as ApiEventMode, EventType as ApiEventType } from '@/lib/eventsApi';

export interface Project {
  departments: any;
  projectDuration: ReactNode;
  id: string;
  title: string;
  description: string;
  facultyId: string;
  facultyName: string;
  department: string;
  projectType: 'project' | 'research' | 'paper_publish' | 'other';
  skills: string[];
  duration: string;
  status: 'open' | 'in_progress' | 'completed';
  maxStudents: number;
  currentStudents: number;
  createdAt: Date;
  deadline?: Date;
  tags: string[];
  requirements: string[];
  outcomes: string[];
  // Student-specific annotations
  hasApplied?: boolean;
  myApplicationStatus?: 'pending' | 'accepted' | 'rejected' | null;
}

export interface Application {
  id: string;
  projectId: string;
  studentId: string;
  studentName: string;
  studentDepartment: string;
  status: 'pending' | 'accepted' | 'rejected';
  appliedAt: Date;
  message?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  location: string;
  organizer: string;
  department: string;
  type: 'workshop' | 'seminar' | 'competition' | 'networking';
  capacity: number;
  registered: number;
  // Optional delivery mode and join link for online/hybrid events
  mode?: 'online' | 'in_person' | 'hybrid';
  joinUrl?: string;
}

export interface StudentShowcaseProject {
  id: string;
  studentId: string;
  title: string;
  description: string;
  tech: string[];
  link?: string; // live/project page
  repo?: string; // source code repo
  demo?: string; // demo/video link
  image?: string; // thumbnail or cover image
  createdAt: Date;
}


// Interface for event registrations
export interface EventRegistration {
  id: string;
  eventId: string;
  studentId: string;
  registeredAt: Date;
}

// Social graph: follow relationships (student-to-student)
export interface Follow {
  id: string;
  followerId: string; // who follows
  followingId: string; // who is being followed
  createdAt: Date;
}

// Basic post model for feed/profile aggregation
export interface NetworkPost {
  id: string;
  authorId: string;
  content: string;
  type: 'text' | 'project_update' | 'achievement' | 'event' | 'collaboration';
  attachments?: Array<{ type: 'image' | 'document' | 'link'; url: string; title?: string }>;
  tags?: string[];
  likes: number;
  comments: number;
  shares: number;
  timestamp: Date;
}

// Placements-specific entities
export interface Company {
  id: string;
  name: string;
  industry: string;
  website?: string;
  contactName?: string;
  contactEmail?: string;
  rating?: number;
  locations: string[];
  openings?: number;
  createdAt: Date;
}

export interface Job {
  id: string;
  title: string;
  companyId: string;
  companyName: string;
  type: 'full_time' | 'internship' | 'part_time';
  location: string;
  ctc?: string; // annual package for full-time
  stipend?: string; // stipend for internship
  requirements: string[];
  skills: string[];
  openings: number;
  status: 'open' | 'closed';
  postedAt: Date;
  applyBy?: Date;
}

export interface PlacementDrive {
  id: string;
  companyId: string;
  companyName: string;
  date: Date;
  positions: number;
  package: string;
  type: 'on_campus' | 'off_campus' | 'virtual';
  requirements: string[];
  status: 'upcoming' | 'completed' | 'cancelled';
  applicants: string[]; // student IDs
  shortlisted: string[];
  selected: string[];
}

 export interface DataContextType {
  projects: Project[];
  applications: Application[];
  events: Event[];
  eventRegistrations: EventRegistration[];
  studentShowcase: StudentShowcaseProject[];
  // Users/Network
  users: User[];
  follows: Follow[];
  posts: NetworkPost[];
  // Placements
  companies: Company[];
  jobs: Job[];
  drives: PlacementDrive[];
  registerForEvent: (eventId: string, studentId: string) => Promise<void>;
  unregisterFromEvent: (eventId: string, studentId: string) => Promise<void>;
  addEvent: (eventData: Omit<Event, 'id'>) => Promise<void>;
  addProject: (projectData: Omit<Project, 'id' | 'createdAt'>) => Promise<void>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  applyToProject: (projectId: string, studentId: string, message?: string) => Promise<void>;
  updateApplication: (applicationId: string, status: 'accepted' | 'rejected') => Promise<void>;
  addStudentShowcaseProject: (data: Omit<StudentShowcaseProject, 'id' | 'createdAt'>) => void;
  updateStudentShowcaseProject: (projectId: string, updates: Partial<StudentShowcaseProject>) => void;
  deleteStudentShowcaseProject: (projectId: string) => void;
  // Placements CRUD
  addCompany: (data: Omit<Company, 'id' | 'createdAt'>) => void;
  updateCompany: (companyId: string, updates: Partial<Company>) => void;
  deleteCompany: (companyId: string) => void;
  addJob: (data: Omit<Job, 'id' | 'postedAt'>) => void;
  updateJob: (jobId: string, updates: Partial<Job>) => void;
  deleteJob: (jobId: string) => void;
  addDrive: (data: Omit<PlacementDrive, 'id' | 'applicants' | 'shortlisted' | 'selected'>) => void;
  updateDrive: (driveId: string, updates: Partial<PlacementDrive>) => void;
  deleteDrive: (driveId: string) => void;
  applyToDrive: (driveId: string, studentId: string) => void;
  shortlistStudent: (driveId: string, studentId: string) => void;
  selectStudent: (driveId: string, studentId: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const pathname = usePathname();
  const reduxProjects = useAppSelector(selectProjects);
  const myApplicationsRedux = useAppSelector(selectMyApplications);
  const applicationsByProject = useAppSelector((state) => state.applications.byProjectId);
  const reduxEvents = useAppSelector(selectReduxEvents);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventRegistrations, setEventRegistrations] = useState<EventRegistration[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [follows, setFollows] = useState<Follow[]>([]);
  const [posts, setPosts] = useState<NetworkPost[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [drives, setDrives] = useState<PlacementDrive[]>([]);
  const [studentShowcaseProjects, setStudentShowcaseProjects] = useState<StudentShowcaseProject[]>([]);

  // Guard: ensure we dispatch fetchMyApplications only once per user session
  const requestedMyAppsRef = useRef(false);
  // Guards for events fetching to avoid duplicate dispatches
  const requestedEventsRef = useRef(false);
  const requestedMyEventsRef = useRef(false);
  // Track last user ID to reset guards immediately within the same effect cycle
  const lastUserIdRef = useRef<string | null>(null);

  // Helper function to convert Redux Project to DataContext Project
  const convertReduxToDataProject = (reduxProject: ReduxProject): Project => ({
    id: reduxProject.id,
    title: reduxProject.title,
    description: reduxProject.description,
    facultyId: reduxProject.authorId,
    facultyName: reduxProject.authorName,
    department: reduxProject.departments[0] || '', // Take first department
    projectType: reduxProject.projectType.toLowerCase() as Project['projectType'],
    skills: reduxProject.skills,
    duration: reduxProject.projectDuration || '',
    status: reduxProject.progressStatus.toLowerCase().replace('_', '_') as Project['status'],
    maxStudents: reduxProject.maxStudents,
    currentStudents: 0, // TODO: Calculate from applications
    createdAt: new Date(reduxProject.createdAt),
    deadline: reduxProject.deadline ? new Date(reduxProject.deadline) : undefined,
    tags: reduxProject.tags,
    requirements: reduxProject.requirements,
    outcomes: reduxProject.outcomes,
    hasApplied: reduxProject.hasApplied ?? false,
    myApplicationStatus: reduxProject.myApplicationStatus
      ? (reduxProject.myApplicationStatus.toLowerCase() as 'pending' | 'accepted' | 'rejected')
      : null,
    departments: undefined,
    projectDuration: undefined
  });

  // Helpers to convert Events API -> DataContext Event model
  const mapApiTypeToUi = (t: ApiEventType): Event['type'] => {
    switch (t) {
      case 'WORKSHOP': return 'workshop';
      case 'SEMINAR': return 'seminar';
      case 'HACKATHON': return 'competition';
      case 'MEETUP': return 'networking';
      default: return 'seminar';
    }
  };

  const mapApiModeToUi = (m?: ApiEventMode): Event['mode'] | undefined => {
    switch (m) {
      case 'ONLINE': return 'online';
      case 'ONSITE': return 'in_person';
      case 'HYBRID': return 'hybrid';
      default: return undefined;
    }
  };

  const convertApiToDataEvent = (e: ApiEvent): Event => ({
    id: e.id,
    title: e.title,
    description: e.description,
    date: new Date(e.startAt),
    location: e.location ?? (e.meetingUrl ? 'Online' : ''),
    organizer: e.authorName,
    department: e.visibleToAllDepts ? 'All Departments' : (e.departments[0] || ''),
    type: mapApiTypeToUi(e.type),
    capacity: e.capacity ?? 0,
    registered: e.registrationCount ?? 0,
    mode: mapApiModeToUi(e.mode),
    joinUrl: e.meetingUrl ?? undefined,
  });

  // Helper to convert API application to DataContext application shape
  const convertApiToDataApplication = (
    apiApp: import('@/lib/projectsApi').Application
  ): Application => ({
    id: apiApp.id,
    projectId: apiApp.projectId,
    studentId: apiApp.studentId,
    studentName: apiApp.studentName,
    studentDepartment: apiApp.studentDepartment,
    status: apiApp.status.toLowerCase() as Application['status'],
    appliedAt: new Date(apiApp.appliedAt),
    message: apiApp.message ?? undefined,
  });

  // Sync Redux projects with local state (always mirror Redux)
  useEffect(() => {
    const convertedProjects = reduxProjects.map(convertReduxToDataProject);
    setProjects(convertedProjects);
    // Debug: trace Redux -> DataContext sync and mapping
    try {
      console.debug('[DataContext] Redux->DataContext projects sync', {
        userId: user?.id,
        role: user?.role,
        reduxCount: reduxProjects.length,
        sample:
          reduxProjects[0]
            ? {
                redux: {
                  id: reduxProjects[0].id,
                  authorId: reduxProjects[0].authorId,
                  authorName: reduxProjects[0].authorName,
                  progressStatus: reduxProjects[0].progressStatus,
                },
                mapped: convertedProjects[0]
                  ? {
                      id: convertedProjects[0].id,
                      facultyId: convertedProjects[0].facultyId,
                      facultyName: convertedProjects[0].facultyName,
                      status: convertedProjects[0].status,
                    }
                  : null,
              }
            : null,
      });
    } catch {}
  }, [reduxProjects, user?.id, user?.role]);

  // Sync Redux events with local state (mirror Redux -> DataContext)
  useEffect(() => {
    const convertedEvents = (reduxEvents ?? []).map(convertApiToDataEvent);
    setEvents(convertedEvents);
    // Derive per-user registrations from Redux events' isRegistered flag
    setEventRegistrations((prev) => {
      if (!user?.id) return [];
      const regs = (reduxEvents ?? [])
        .filter((e: any) => e?.isRegistered === true)
        .map((e: any) => ({
          id: `reg_${e.id}_${user.id}`,
          eventId: e.id as string,
          studentId: user.id as string,
          registeredAt: new Date(),
        }));
      return regs;
    });
    try {
      console.debug('[DataContext] Redux->DataContext events sync', {
        count: reduxEvents?.length ?? 0,
        regs: (reduxEvents ?? []).reduce((acc: number, e: any) => acc + (e?.isRegistered ? 1 : 0), 0),
      });
    } catch {}
  }, [reduxEvents, user?.id]);

  // Fetch projects based on user role and route
  useEffect(() => {
    if (!user) return;
    try { console.debug('[DataContext] Role-based projects fetch', { userId: user.id, role: user.role, path: pathname }); } catch {}
    if (user.role === 'student') {
      const onCollabPage = pathname?.startsWith('/student/collaboration');
      if (onCollabPage) {
        dispatch(fetchMyProjects());
      } else {
        dispatch(fetchProjects({ progressStatus: 'OPEN' }));
      }
    } else {
      dispatch(fetchMyProjects());
    }
  }, [dispatch, user?.id, user?.role, pathname]);

  // Fetch events on mount and when user changes (guarded). Resets guards synchronously on user change
  useEffect(() => {
    const uid = user?.id ?? null;
    const userChanged = lastUserIdRef.current !== uid;
    if (userChanged) {
      lastUserIdRef.current = uid;
      // Reset guards so we refetch for the new user (to refresh isRegistered flags)
      requestedEventsRef.current = false;
      requestedMyEventsRef.current = false;
      requestedMyAppsRef.current = false;
    }

    if (!requestedEventsRef.current) {
      requestedEventsRef.current = true;
      try { console.debug('[DataContext] Dispatch fetchEvents (guarded)'); } catch {}
      dispatch(fetchEventsThunk({ upcomingOnly: true }));
    }
    if (user && !requestedMyEventsRef.current) {
      requestedMyEventsRef.current = true;
      try { console.debug('[DataContext] Dispatch fetchMyEvents (guarded)'); } catch {}
      dispatch(fetchMyEventsThunk());
    }
  }, [dispatch, user?.id]);

  // (Removed separate reset effect; handled inside the guarded events effect above)

  // For students: fetch my applications via Redux (guarded)
  useEffect(() => {
    if (!user || user.role !== 'student') return;
    if (requestedMyAppsRef.current) return;
    if ((myApplicationsRedux?.length ?? 0) > 0) return; // already loaded
    requestedMyAppsRef.current = true;
    try {
      console.debug('[DataContext] Dispatch fetchMyApplications (guarded)');
      dispatch(fetchMyApplications());
    } catch (e) {
      try { console.error('[DataContext] Failed to dispatch fetchMyApplications', e); } catch {}
    }
  }, [dispatch, user?.id, user?.role]);

  // Load data from Redux on mount and fetch Redux projects
  useEffect(() => {
    // Fetching of projects is handled in the role-based effect above
    // Events are fetched via Redux; no demo seeding

    // Users will be fetched from backend APIs when needed
    setUsers([]);

    // Student showcase projects will be fetched from backend API when needed
    setStudentShowcaseProjects([]);

    // Placements data (companies, jobs, drives) will be fetched from backend APIs when needed
    setCompanies([]);
    setJobs([]);
    setDrives([]);

    // Applications are loaded from backend; see effect below

    // Event registrations now managed server-side; keep local mirror empty (derive from API if needed)
    setEventRegistrations([]);

    // Follows and posts will be fetched from backend APIs when needed
    setFollows([]);
    setPosts([]);
  }, []);

  // Fetch applications for faculty-owned projects via Redux
  useEffect(() => {
    if (!user || user.role !== 'faculty') return;

    const myProjectIds = projects
      .filter((p) => p.facultyId === user.id)
      .map((p) => p.id);

    if (myProjectIds.length === 0) {
      try { console.debug('[DataContext] Faculty has no projects yet; no applications to fetch', { userId: user?.id }); } catch {}
      return;
    }

    try {
      console.debug('[DataContext] Dispatch fetchProjectApplications for my projects', { ids: myProjectIds });
    } catch {}

    myProjectIds.forEach((pid) => {
      dispatch(fetchProjectApplications({ projectId: pid }));
    });
  }, [dispatch, user?.id, user?.role, projects]);

  // Mirror Redux applications for students without depending on `projects` to avoid loops
  useEffect(() => {
    if (!user) {
      setApplications([]);
      return;
    }
    if (user.role !== 'student') return;

    const mapped = (myApplicationsRedux ?? []).map(convertApiToDataApplication);
    setApplications(mapped);

    // Overlay annotations onto projects for immediate UI feedback.
    // Guard against unnecessary state updates to prevent render loops.
    setProjects((prev) => {
      const byProject = new Map<string, Application['status']>(
        mapped.map((a) => [a.projectId, a.status])
      );
      let changed = false;
      const next = prev.map((p) => {
        const status = byProject.get(p.id);
        const nextHasApplied = Boolean(status);
        const nextStatus = (status ?? null) as Project['myApplicationStatus'];
        if ((p.hasApplied ?? false) !== nextHasApplied || (p.myApplicationStatus ?? null) !== nextStatus) {
          changed = true;
          return { ...p, hasApplied: nextHasApplied, myApplicationStatus: nextStatus };
        }
        return p;
      });
      return changed ? next : prev;
    });
  }, [user?.id, user?.role, myApplicationsRedux]);

  // Mirror Redux applications for faculty; depends on projects to reflect ownership changes
  useEffect(() => {
    if (!user) {
      setApplications([]);
      return;
    }
    if (user.role !== 'faculty') return;

    const myProjectIds = projects
      .filter((p) => p.facultyId === user.id)
      .map((p) => p.id);
    const allApiApps = myProjectIds.flatMap((pid) => applicationsByProject[pid] ?? []);
    const mapped = allApiApps.map(convertApiToDataApplication);
    setApplications(mapped);
  }, [user?.id, user?.role, applicationsByProject, projects]);

  // Derive currentStudents from accepted applications for faculty-owned projects
  useEffect(() => {
    if (!user || user.role !== 'faculty') return;

    // Build accepted counts per projectId from Redux applications state
    const acceptedCounts = new Map<string, number>();
    try {
      Object.entries(applicationsByProject || {}).forEach(([pid, arr]) => {
        const list = Array.isArray(arr) ? arr : [];
        const count = list.reduce((acc, a: any) => (a?.status === 'ACCEPTED' ? acc + 1 : acc), 0);
        acceptedCounts.set(pid, count);
      });
    } catch {}

    // Overlay onto DataContext projects; avoid unnecessary state updates
    setProjects((prev) => {
      let changed = false;
      const next = prev.map((p) => {
        const nextCount = acceptedCounts.get(p.id);
        if (typeof nextCount === 'number' && nextCount !== p.currentStudents) {
          changed = true;
          return { ...p, currentStudents: nextCount };
        }
        return p;
      });
      return changed ? next : prev;
    });
  }, [user?.id, user?.role, applicationsByProject]);

  const addProject = async (projectData: Omit<Project, 'id' | 'createdAt'>) => {
    const payload: CreateProjectRequest = {
      title: projectData.title,
      description: projectData.description,
      projectDuration: projectData.duration,
      skills: projectData.skills,
      projectType: projectData.projectType.toUpperCase() as ProjectType,
      departments: projectData.department ? [projectData.department] : undefined,
      maxStudents: projectData.maxStudents,
      deadline: projectData.deadline ? projectData.deadline.toISOString() : undefined,
      tags: projectData.tags,
      requirements: projectData.requirements,
      outcomes: projectData.outcomes,
    };
    await dispatch(createProjectThunk(payload));
  };

  const updateProject = async (projectId: string, updates: Partial<Project>) => {
    try {
      // Convert DataContext Project interface to API UpdateProjectRequest
      const apiUpdates: UpdateProjectRequest = {
        title: updates.title,
        description: updates.description,
        projectDuration: updates.duration,
        skills: updates.skills,
        projectType: updates.projectType ? (updates.projectType.toUpperCase() as ProjectType) : undefined,
        departments: updates.department ? [updates.department] : undefined,
        maxStudents: updates.maxStudents,
        deadline: updates.deadline ? updates.deadline.toISOString() : undefined,
        tags: updates.tags,
        requirements: updates.requirements,
        outcomes: updates.outcomes,
      };
      
      // Use Redux thunk for API call
      await dispatch(updateProjectThunk({ id: projectId, changes: apiUpdates }));
    } catch (error) {
      console.error('Failed to update project:', error);
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      // Use Redux thunk for API call
      await dispatch(deleteProjectThunk(projectId));
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const applyToProject = async (
    projectId: string,
    studentId: string,
    message?: string
  ) => {
    try {
      // studentId is derived from auth on the backend; kept here to maintain signature
      await dispatch(applyToProjectThunk({ projectId, message }));
      // Immediately mark project as applied in UI
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, hasApplied: true, myApplicationStatus: 'pending' } : p))
      );
    } catch (error) {
      console.error('Failed to apply to project:', error);
      throw error;
    }
  };

  const updateApplication = async (
    applicationId: string,
    status: 'accepted' | 'rejected'
  ) => {
    try {
      const mappedStatus = status.toUpperCase() as 'ACCEPTED' | 'REJECTED';
      await dispatch(updateApplicationStatusThunk({ applicationId, status: mappedStatus }));
    } catch (error) {
      console.error('Failed to update application status:', error);
    }
  };

  const addEvent = async (eventData: Omit<Event, 'id'>) => {
    const startAtIso = eventData.date.toISOString();
    const endAtIso = new Date(eventData.date.getTime() + 60 * 60 * 1000).toISOString(); // +1h fallback

    const typeMap: Record<Event['type'], ApiEventType> = {
      workshop: 'WORKSHOP',
      seminar: 'SEMINAR',
      competition: 'HACKATHON',
      networking: 'MEETUP',
    };
    const modeMap: Record<NonNullable<Event['mode']>, ApiEventMode> = {
      online: 'ONLINE',
      in_person: 'ONSITE',
      hybrid: 'HYBRID',
    };
    const visibleToAllDepts = eventData.department === 'All Departments';
    const hasLink = !!eventData.joinUrl && eventData.joinUrl.trim().length > 0;
    const hasLocation = !!eventData.location && eventData.location.trim().length > 0;
    const resolvedMode: ApiEventMode = eventData.mode
      ? modeMap[eventData.mode]
      : (hasLink && hasLocation
          ? 'HYBRID'
          : hasLink
            ? 'ONLINE'
            : 'ONSITE');
    const payload: CreateEventReq = {
      title: eventData.title,
      description: eventData.description,
      startAt: startAtIso,
      endAt: endAtIso,
      type: typeMap[eventData.type],
      mode: resolvedMode,
      location: eventData.location || undefined,
      meetingUrl: eventData.joinUrl || undefined,
      capacity: eventData.capacity || undefined,
      visibleToAllDepts,
      departments: visibleToAllDepts ? undefined : [eventData.department],
      tags: [],
    };
    try {
      await dispatch(createEventThunkEvents(payload)).unwrap();
      try { console.debug('[DataContext] createEvent success'); } catch {}
    } catch (e) {
      try { console.error('[DataContext] createEvent failed', e); } catch {}
      throw e;
    }
  };


  // Student Showcase CRUD methods
  const addStudentShowcaseProject = (data: Omit<StudentShowcaseProject, 'id' | 'createdAt'>) => {
    const newProj: StudentShowcaseProject = {
      id: Date.now().toString(),
      createdAt: new Date(),
      ...data,
    };
    setStudentShowcaseProjects((prev: StudentShowcaseProject[]) => {
      const updated = [newProj, ...prev];
      localStorage.setItem('nexus_student_showcase', JSON.stringify(updated));
      return updated;
    });
  };

  const updateStudentShowcaseProject = (projectId: string, updates: Partial<StudentShowcaseProject>) => {
    setStudentShowcaseProjects((prev: StudentShowcaseProject[]) => {
      const updated = prev.map((p: StudentShowcaseProject) => (p.id === projectId ? { ...p, ...updates } : p));
      localStorage.setItem('nexus_student_showcase', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteStudentShowcaseProject = (projectId: string) => {
    setStudentShowcaseProjects((prev: StudentShowcaseProject[]) => {
      const updated = prev.filter((p: StudentShowcaseProject) => p.id !== projectId);
      localStorage.setItem('nexus_student_showcase', JSON.stringify(updated));
      return updated;
    });
  };

  const registerForEvent = async (eventId: string, _studentId: string) => {
    const sid = user?.id ?? _studentId;
    // Optimistic UI update
    let reverted = false;
    setEventRegistrations((prev) => {
      const exists = prev.some((r) => r.eventId === eventId && r.studentId === sid);
      if (exists || !sid) return prev;
      return [
        ...prev,
        { id: `reg_${eventId}_${sid}` , eventId, studentId: sid, registeredAt: new Date() },
      ];
    });
    setEvents((prev) => prev.map((e) => e.id === eventId ? { ...e, registered: (e.registered ?? 0) + 1 } : e));

    try {
      await dispatch(registerForEventThunk(eventId)).unwrap();
      // Refresh to ensure consistency; slice also updates in-place
      try { dispatch(fetchEventsThunk({ upcomingOnly: true })); } catch {}
    } catch (err) {
      // Rollback optimistic update on failure
      reverted = true;
      setEventRegistrations((prev) => prev.filter((r) => !(r.eventId === eventId && r.studentId === sid)));
      setEvents((prev) => prev.map((e) => e.id === eventId ? { ...e, registered: Math.max(0, (e.registered ?? 0) - 1) } : e));
      throw err;
    } finally {
      if (!reverted) {
        try { console.debug('[DataContext] registerForEvent success (optimistic applied)'); } catch {}
      }
    }
  };

  const unregisterFromEvent = async (eventId: string, _studentId: string) => {
    const sid = user?.id ?? _studentId;
    // Optimistic UI update
    let reverted = false;
    setEventRegistrations((prev) => prev.filter((r) => !(r.eventId === eventId && r.studentId === sid)));
    setEvents((prev) => prev.map((e) => e.id === eventId ? { ...e, registered: Math.max(0, (e.registered ?? 0) - 1) } : e));

    try {
      await dispatch(unregisterFromEventThunk(eventId)).unwrap();
      try { dispatch(fetchEventsThunk({ upcomingOnly: true })); } catch {}
    } catch (err) {
      // Rollback optimistic update on failure
      reverted = true;
      setEventRegistrations((prev) => {
        if (!sid) return prev;
        const exists = prev.some((r) => r.eventId === eventId && r.studentId === sid);
        return exists ? prev : [...prev, { id: `reg_${eventId}_${sid}`, eventId, studentId: sid, registeredAt: new Date() }];
      });
      setEvents((prev) => prev.map((e) => e.id === eventId ? { ...e, registered: (e.registered ?? 0) + 1 } : e));
      throw err;
    } finally {
      if (!reverted) {
        try { console.debug('[DataContext] unregisterFromEvent success (optimistic applied)'); } catch {}
      }
    }
  };

  // Placements: companies CRUD
  const addCompany = (data: Omit<Company, 'id' | 'createdAt'>) => {
    const newCompany: Company = {
      id: Date.now().toString(),
      createdAt: new Date(),
      ...data,
    };
    const updated = [newCompany, ...companies];
    setCompanies(updated);
    localStorage.setItem('nexus_companies', JSON.stringify(updated));
  };

  const updateCompany = (companyId: string, updates: Partial<Company>) => {
    const updated = companies.map(c => (c.id === companyId ? { ...c, ...updates } : c));
    setCompanies(updated);
    localStorage.setItem('nexus_companies', JSON.stringify(updated));
  };

  const deleteCompany = (companyId: string) => {
    const updated = companies.filter(c => c.id !== companyId);
    setCompanies(updated);
    localStorage.setItem('nexus_companies', JSON.stringify(updated));
  };

  // Placements: jobs CRUD
  const addJob = (data: Omit<Job, 'id' | 'postedAt'>) => {
    const newJob: Job = {
      id: Date.now().toString(),
      postedAt: new Date(),
      ...data,
    };
    const updated = [newJob, ...jobs];
    setJobs(updated);
    localStorage.setItem('nexus_jobs', JSON.stringify(updated));
  };

  const updateJob = (jobId: string, updates: Partial<Job>) => {
    const updated = jobs.map(j => (j.id === jobId ? { ...j, ...updates } : j));
    setJobs(updated);
    localStorage.setItem('nexus_jobs', JSON.stringify(updated));
  };

  const deleteJob = (jobId: string) => {
    const updated = jobs.filter(j => j.id !== jobId);
    setJobs(updated);
    localStorage.setItem('nexus_jobs', JSON.stringify(updated));
  };

  // Placements: drives CRUD and workflows
  const addDrive = (data: Omit<PlacementDrive, 'id' | 'applicants' | 'shortlisted' | 'selected'>) => {
    const newDrive: PlacementDrive = {
      id: Date.now().toString(),
      applicants: [],
      shortlisted: [],
      selected: [],
      ...data,
    };
    const updated = [newDrive, ...drives];
    setDrives(updated);
    localStorage.setItem('nexus_drives', JSON.stringify(updated));
  };

  const updateDrive = (driveId: string, updates: Partial<PlacementDrive>) => {
    const updated = drives.map(d => (d.id === driveId ? { ...d, ...updates } : d));
    setDrives(updated);
    localStorage.setItem('nexus_drives', JSON.stringify(updated));
  };

  const deleteDrive = (driveId: string) => {
    const updated = drives.filter(d => d.id !== driveId);
    setDrives(updated);
    localStorage.setItem('nexus_drives', JSON.stringify(updated));
  };

  const applyToDrive = (driveId: string, studentId: string) => {
    const updated = drives.map(d => {
      if (d.id !== driveId) return d;
      if (d.applicants.includes(studentId)) return d;
      return { ...d, applicants: [...d.applicants, studentId] };
    });
    setDrives(updated);
    localStorage.setItem('nexus_drives', JSON.stringify(updated));
  };

  const shortlistStudent = (driveId: string, studentId: string) => {
    const updated = drives.map(d => {
      if (d.id !== driveId) return d;
      if (d.shortlisted.includes(studentId)) return d;
      return { ...d, shortlisted: [...d.shortlisted, studentId] };
    });
    setDrives(updated);
    localStorage.setItem('nexus_drives', JSON.stringify(updated));
  };

  const selectStudent = (driveId: string, studentId: string) => {
    const updated = drives.map(d => {
      if (d.id !== driveId) return d;
      if (d.selected.includes(studentId)) return d;
      const newShortlisted = d.shortlisted.filter(id => id !== studentId);
      return { ...d, shortlisted: newShortlisted, selected: [...d.selected, studentId] };
    });
    setDrives(updated);
    localStorage.setItem('nexus_drives', JSON.stringify(updated));
  };

  return (
    <DataContext.Provider
      value={{
        projects,
        applications,
        events,
        eventRegistrations,
        studentShowcase: studentShowcaseProjects,
        // Users/Network
        users,
        follows,
        posts,
        // Placements
        companies,
        jobs,
        drives,
        // actions
        addStudentShowcaseProject,
        updateStudentShowcaseProject,
        deleteStudentShowcaseProject,
        registerForEvent,
        unregisterFromEvent,
        addEvent,
        addProject,
        updateProject,
        deleteProject,
        applyToProject,
        updateApplication,
        addCompany,
        updateCompany,
        deleteCompany,
        addJob,
        updateJob,
        deleteJob,
        addDrive,
        updateDrive,
        deleteDrive,
        applyToDrive,
        shortlistStudent,
        selectStudent,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

