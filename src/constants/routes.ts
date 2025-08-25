/**
 * Centralized application route constants
 * Keep in sync with routes under src/app/
 */

export const ROUTES = {
  ROOT: '/',
  DASHBOARD: '/dashboard',
  UNAUTHORIZED: '/unauthorized',

  PLACEMENTS: '/placements',
  LEARNING: '/learning',

  FACULTY: {
    profile: '/profile',
    projects: '/projects',
    applications: '/applications',
    collaboration: '/collaboration',
    events: '/events',
    badges: '/badges',
    students: '/students',
    network: '/network',
    messages: '/messages',
  },

  STUDENT: {
    base: '/student',
    profile: '/student/profile',
    marketplace: '/student/marketplace',
    myApplications: '/student/my-applications',
    collaboration: '/student/collaboration',
    calendar: '/student/calendar',
    network: '/student/network',
    messages: '/student/messages',
  },

  DEPT_ADMIN: {
    base: '/dept-admin',
    profile: '/dept-admin/profile',
    projects: '/dept-admin/projects',
    students: '/dept-admin/students',
    events: '/dept-admin/events',
    analytics: '/dept-admin/analytics',
    faculty: '/dept-admin/faculty',
  },

  PLACEMENTS_ADMIN: {
    base: '/placements-admin',
    profile: '/placements-admin/profile',
    jobs: '/placements-admin/jobs',
    companies: '/placements-admin/companies',
    students: '/placements-admin/students',
    events: '/placements-admin/events',
    analytics: '/placements-admin/analytics',
  },

  HEAD_ADMIN: {
    base: '/head-admin',
    profile: '/head-admin/profile',
    analytics: '/head-admin/analytics',
    projects: '/head-admin/projects',
    events: '/head-admin/events',
    adminManagement: '/head-admin/admin-management',
  },
} as const;

export type RouteMap = typeof ROUTES;
