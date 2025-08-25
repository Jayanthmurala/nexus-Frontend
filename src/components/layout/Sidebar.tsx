'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSidebarOpen } from '@/store/slices/uiSlice';
import {
  LayoutDashboard,
  Home,
  Calendar,
  Award,
  Users,
  GraduationCap,
  Briefcase,
  BookOpen,
  X,
  MessageSquare,
  UserPlus,
  FileText,
  BarChart3,
  Building,
  User,
  ChevronLeft,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/contexts/AuthContext';
import { ROUTES } from '@/constants/routes';
import { selectMyApplications, selectMyApplicationsLoading, fetchMyApplications } from '@/store/slices/applicationsSlice';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number; // optional numeric badge (e.g., collaboration count)
}

const baseItems: NavItem[] = [
  { href: ROUTES.ROOT, label: 'Home', icon: <Home className="w-4 h-4" /> },
  { href: ROUTES.DASHBOARD, label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
];

const roleItems: Partial<Record<UserRole, NavItem[]>> = {
  faculty: [
    { href: ROUTES.FACULTY.profile, label: 'Profile', icon: <User className="w-4 h-4" /> },
    { href: ROUTES.FACULTY.projects, label: 'Projects', icon: <BookOpen className="w-4 h-4" /> },
    { href: ROUTES.FACULTY.applications, label: 'Applications', icon: <MessageSquare className="w-4 h-4" /> },
    { href: ROUTES.FACULTY.collaboration, label: 'Collaboration', icon: <UserPlus className="w-4 h-4" /> },
    { href: ROUTES.FACULTY.events, label: 'Events', icon: <Calendar className="w-4 h-4" /> },
    { href: ROUTES.FACULTY.badges, label: 'Badges', icon: <Award className="w-4 h-4" /> },
    { href: ROUTES.FACULTY.students, label: 'Students', icon: <Users className="w-4 h-4" /> },
    { href: ROUTES.FACULTY.network, label: 'Network', icon: <Users className="w-4 h-4" /> },
    { href: ROUTES.FACULTY.messages, label: 'Messages', icon: <MessageSquare className="w-4 h-4" /> },
  ],
  student: [
    { href: ROUTES.STUDENT.profile, label: 'Profile', icon: <User className="w-4 h-4" /> },
    { href: ROUTES.STUDENT.marketplace, label: 'Marketplace', icon: <BookOpen className="w-4 h-4" /> },
    { href: ROUTES.STUDENT.myApplications, label: 'My Applications', icon: <FileText className="w-4 h-4" /> },
    { href: ROUTES.STUDENT.calendar, label: 'Calendar', icon: <Calendar className="w-4 h-4" /> },
    { href: ROUTES.STUDENT.network, label: 'Network', icon: <Users className="w-4 h-4" /> },
    { href: ROUTES.STUDENT.messages, label: 'Messages', icon: <MessageSquare className="w-4 h-4" /> },
  ],
  dept_admin: [
    { href: ROUTES.DEPT_ADMIN.base, label: 'Dept Admin', icon: <Users className="w-4 h-4" /> },
    { href: ROUTES.DEPT_ADMIN.profile, label: 'Profile', icon: <User className="w-4 h-4" /> },
    { href: ROUTES.DEPT_ADMIN.projects, label: 'Projects', icon: <BookOpen className="w-4 h-4" /> },
    { href: ROUTES.DEPT_ADMIN.students, label: 'Students', icon: <Users className="w-4 h-4" /> },
    { href: ROUTES.DEPT_ADMIN.events, label: 'Events', icon: <Calendar className="w-4 h-4" /> },
    { href: ROUTES.DEPT_ADMIN.analytics, label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { href: ROUTES.DEPT_ADMIN.faculty, label: 'Faculty Mgmt', icon: <UserPlus className="w-4 h-4" /> },
  ],
  placements_admin: [
    { href: ROUTES.PLACEMENTS_ADMIN.base, label: 'Placements Admin', icon: <Briefcase className="w-4 h-4" /> },
    { href: ROUTES.PLACEMENTS_ADMIN.profile, label: 'Profile', icon: <User className="w-4 h-4" /> },
    { href: ROUTES.PLACEMENTS_ADMIN.students, label: 'Students', icon: <Users className="w-4 h-4" /> },
    { href: ROUTES.PLACEMENTS_ADMIN.events, label: 'Events', icon: <Calendar className="w-4 h-4" /> },
    { href: ROUTES.PLACEMENTS_ADMIN.analytics, label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
  ],
  head_admin: [
    { href: ROUTES.HEAD_ADMIN.base, label: 'Head Admin', icon: <Building className="w-4 h-4" /> },
    { href: ROUTES.HEAD_ADMIN.profile, label: 'Profile', icon: <User className="w-4 h-4" /> },
    { href: ROUTES.HEAD_ADMIN.analytics, label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { href: ROUTES.HEAD_ADMIN.projects, label: 'All Projects', icon: <BookOpen className="w-4 h-4" /> },
    { href: ROUTES.HEAD_ADMIN.events, label: 'Events', icon: <Calendar className="w-4 h-4" /> },
    { href: ROUTES.HEAD_ADMIN.adminManagement, label: 'Admin Management', icon: <Users className="w-4 h-4" /> },
  ],
};

export default function Sidebar() {
  const { user } = useAuth();
  const open = useAppSelector((s) => s.ui.sidebarOpen);
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  // Student collaboration count (unique projects with ACCEPTED status)
  const myApps = useAppSelector(selectMyApplications);
  const myAppsLoading = useAppSelector(selectMyApplicationsLoading);
  const requestedMyAppsRef = React.useRef(false);

  // Collapsible on large screens; persist in localStorage
  const [collapsed, setCollapsed] = React.useState(false);
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('nexus_sidebar_collapsed');
      if (saved) setCollapsed(saved === '1');
    } catch {}
  }, []);
  React.useEffect(() => {
    try {
      localStorage.setItem('nexus_sidebar_collapsed', collapsed ? '1' : '0');
    } catch {}
  }, [collapsed]);

  // Close mobile sidebar whenever route changes
  React.useEffect(() => {
    dispatch(setSidebarOpen(false));
  }, [pathname, dispatch]);

  // Reset fetch flag on user change
  React.useEffect(() => {
    requestedMyAppsRef.current = false;
  }, [user?.id, user?.role]);

  // Ensure student applications are loaded once per session for badge count
  React.useEffect(() => {
    if (user?.role === 'student' && !requestedMyAppsRef.current) {
      requestedMyAppsRef.current = true;
      try { dispatch(fetchMyApplications()); } catch {}
    }
  }, [user?.role, user?.id, dispatch]);

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  // Build role items, injecting Collaboration (with badge) for students
  let roleSpecific: NavItem[] = [];
  if (user?.role && roleItems[user.role]) {
    roleSpecific = [...(roleItems[user.role] as NavItem[])];
  }
  if (user?.role === 'student') {
    const acceptedProjectIds = new Set(
      (myApps || [])
        .filter((a) => a.status === 'ACCEPTED')
        .map((a) => a.projectId)
    );
    const collabCount = acceptedProjectIds.size;
    const collabItem: NavItem = {
      href: ROUTES.STUDENT.collaboration,
      label: 'Collaboration',
      icon: <Users className="w-4 h-4" />,
      badge: myAppsLoading ? undefined : collabCount,
    };
    // Insert after "My Applications" if present; else append
    const idx = roleSpecific.findIndex((i) => i.href === ROUTES.STUDENT.myApplications);
    if (idx >= 0) roleSpecific.splice(idx + 1, 0, collabItem);
    else roleSpecific.push(collabItem);
  }

  const items: NavItem[] = [
    ...baseItems,
    ...roleSpecific,
  ];

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`fixed inset-0 bg-black/30 z-40 lg:hidden ${open ? 'block' : 'hidden'}`}
        onClick={() => dispatch(setSidebarOpen(false))}
      />

      <aside
        className={`${collapsed ? 'w-20' : 'w-72'} h-full z-50 lg:z-auto transform transition-transform duration-200 ease-out
        fixed lg:static top-0 left-0 overflow-y-auto
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/50 border-r border-white/20 shadow-lg`}
      >
        <div className="lg:hidden flex justify-end p-3">
          <button
            aria-label="Close sidebar"
            onClick={() => dispatch(setSidebarOpen(false))}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Header / Brand + collapse toggle (desktop) */}
        <div className="hidden lg:flex items-center justify-between px-3 py-3 border-b border-white/20">
          <div className={`font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 ${collapsed ? 'mx-auto' : ''}`}>
            {collapsed ? 'N' : 'Nexus'}
          </div>
          <button
            type="button"
            aria-label="Collapse sidebar"
            onClick={() => setCollapsed((v) => !v)}
            className="p-2 rounded-md text-gray-600 hover:bg-white/60"
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            <ChevronLeft className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <nav className="px-3 pb-6">
          <div className="space-y-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-md text-sm transition-colors
                  ${isActive(item.href)
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-white/60'}
                `}
                aria-current={isActive(item.href) ? 'page' : undefined}
                title={collapsed ? item.label : undefined}
              >
                {item.icon}
                {!collapsed && (
                  <>
                    <span>{item.label}</span>
                    {typeof item.badge === 'number' && (
                      <span
                        className={`ml-auto inline-flex items-center justify-center rounded-full text-[11px] px-1.5 py-0.5
                        ${item.badge > 0
                          ? 'bg-white/90 text-blue-700'
                          : 'bg-white/60 text-gray-700'}
                        `}
                        aria-label={`${item.badge} collaborations`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            ))}
          </div>
        </nav>
      </aside>
    </>
  );
}
