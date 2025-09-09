'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSidebarOpen, toggleSidebarCollapse } from '@/store/slices/uiSlice';
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
  MessageCircle,
  UserPlus,
  FileText,
  BarChart3,
  Building,
  User,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
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
    { href: ROUTES.student.dashboard, label: 'Student Dashboard', icon: <Home className="w-4 h-4" /> },
    { href: ROUTES.student.profile, label: 'Profile', icon: <User className="w-4 h-4" /> },
    { href: ROUTES.student.marketplace, label: 'Marketplace', icon: <BookOpen className="w-4 h-4" /> },
    { href: ROUTES.student.applications, label: 'My Applications', icon: <MessageSquare className="w-4 h-4" /> },
    { href: ROUTES.student.events, label: 'Events', icon: <Calendar className="w-4 h-4" /> },
    { href: ROUTES.student.network, label: 'Network', icon: <Users className="w-4 h-4" /> },
    { href: ROUTES.student.messages, label: 'Messages', icon: <MessageCircle className="w-4 h-4" /> },
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
  HEAD_ADMIN: [
    { href: '/head-admin', label: 'Dashboard', icon: <Building className="w-4 h-4" /> },
    { href: '/head-admin/users', label: 'User Management', icon: <Users className="w-4 h-4" /> },
    { href: '/head-admin/analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { href: '/head-admin/projects', label: 'All Projects', icon: <BookOpen className="w-4 h-4" /> },
    { href: '/head-admin/events', label: 'Events', icon: <Calendar className="w-4 h-4" /> },
    { href: '/head-admin/admin-management', label: 'System Settings', icon: <Building className="w-4 h-4" /> },
  ],
};

export default function Sidebar() {
  const dispatch = useAppDispatch();
  const open = useAppSelector((state) => state.ui.sidebarOpen);
  const collapsed = useAppSelector((state) => state.ui.sidebarCollapsed);
  const { user, logout } = useAuth();
  const pathname = usePathname();
  // Student collaboration count (unique projects with ACCEPTED status)
  const myApps = useAppSelector(selectMyApplications);
  const myAppsLoading = useAppSelector(selectMyApplicationsLoading);
  const requestedMyAppsRef = React.useRef(false);

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
    if (user?.role !== 'student') return;
    if (requestedMyAppsRef.current) return;
    if (myAppsLoading) return;
    if ((myApps?.length ?? 0) > 0) return;
    requestedMyAppsRef.current = true;
    try { dispatch(fetchMyApplications()); } catch {}
  }, [user?.role, user?.id, dispatch, myAppsLoading, myApps?.length]);

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
      href: '/student/collaboration',
      label: 'Collaboration',
      icon: <Users className="w-4 h-4" />,
      badge: myAppsLoading ? undefined : collabCount,
    };
    // Insert after "My Applications" if present; else append
    const idx = roleSpecific.findIndex((i) => i.href === ROUTES.student.applications);
    if (idx >= 0) roleSpecific.splice(idx + 1, 0, collabItem);
    else roleSpecific.push(collabItem);
  }

  const items: NavItem[] = [
    ...baseItems,
    ...roleSpecific,
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden ${open ? 'block' : 'hidden'}`}
        onClick={() => dispatch(setSidebarOpen(false))}
      />

      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-lg border"
        onClick={() => dispatch(setSidebarOpen(true))}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Sidebar - ChatGPT style with collapse support */}
      <aside
        className={`${collapsed ? 'w-16' : 'w-64'} h-screen z-50 lg:z-auto transform transition-all duration-200 ease-out
        fixed top-0 left-0 flex flex-col
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 bg-gray-900 text-white`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          {!collapsed && <div className="font-bold text-xl">Nexus</div>}
          <div className="flex items-center gap-2">
            {/* Desktop collapse toggle */}
            <button
              className="hidden lg:block p-1 rounded hover:bg-gray-700"
              onClick={() => dispatch(toggleSidebarCollapse())}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
            {/* Mobile close button */}
            <button
              className="lg:hidden p-1 rounded hover:bg-gray-700"
              onClick={() => dispatch(setSidebarOpen(false))}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation - Scrollable middle section */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="space-y-1 px-3">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center ${collapsed ? 'justify-center px-3' : 'gap-3 px-3'} py-2.5 rounded-lg text-sm transition-colors
                  ${isActive(item.href)
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'}
                `}
                aria-current={isActive(item.href) ? 'page' : undefined}
                title={collapsed ? item.label : undefined}
              >
                {item.icon}
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {typeof item.badge === 'number' && item.badge > 0 && (
                      <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            ))}
          </div>
        </nav>

        {/* User info and logout - Fixed at bottom */}
        <div className="border-t border-gray-700 p-4">
          {!collapsed && (
            <div className="flex items-center gap-3 mb-3 px-3 py-2">
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {user?.name || 'User'}
                </div>
                <div className="text-xs text-gray-400 capitalize">
                  {user?.role?.replace('_', ' ') || 'Role'}
                </div>
              </div>
            </div>
          )}
          
          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${collapsed ? 'justify-center px-3' : 'gap-3 px-3'} py-2.5 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors`}
            title={collapsed ? 'Logout' : undefined}
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
