'use client';

import React from 'react';
import { User } from '@/contexts/AuthContext';
import { 
  User as UserIcon, 
  MapPin, 
  Briefcase, 
  GraduationCap,
  Eye,
  Users,
  Award
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/constants/routes';

interface ProfileSidebarProps {
  user: User;
}

export default function ProfileSidebar({ user }: ProfileSidebarProps) {
  const router = useRouter();

  const getProfileRoute = () => {
    switch (user.role) {
      case 'student':
        return ROUTES.student.profile;
      case 'faculty':
        return ROUTES.FACULTY.profile;
      case 'dept_admin':
        return ROUTES.DEPT_ADMIN.profile;
      case 'head_admin':
        return ROUTES.HEAD_ADMIN.profile;
      case 'placements_admin':
        return ROUTES.PLACEMENTS_ADMIN.profile;
      default:
        return '/profile';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'student': return 'Student';
      case 'faculty': return 'Faculty Member';
      case 'dept_admin': return 'Department Admin';
      case 'head_admin': return 'Head Administrator';
      case 'placements_admin': return 'Placements Admin';
      default: return 'User';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Cover & Profile Picture */}
      <div className="relative">
        <div className="h-20 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700"></div>
        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
          <div className="w-20 h-20 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center">
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.displayName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <UserIcon className="w-10 h-10 text-white" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="pt-12 pb-6 px-6 text-center border-b border-gray-100">
        <button
          onClick={() => router.push(getProfileRoute())}
          className="group transition-all duration-200"
        >
          <h3 className="font-bold text-gray-900 text-base group-hover:text-blue-600 transition-colors duration-200">
            {user.displayName}
          </h3>
        </button>
        <p className="text-sm text-gray-600 mt-1 font-medium">{getRoleDisplayName(user.role)}</p>
        {user.department && (
          <div className="flex items-center justify-center mt-3 text-sm text-gray-500 bg-gray-50 rounded-full px-3 py-1">
            <GraduationCap className="w-4 h-4 mr-2" />
            {user.department}
          </div>
        )}
        {user.bio && (
          <p className="text-sm text-gray-600 mt-3 line-clamp-2 leading-relaxed">{user.bio}</p>
        )}
      </div>

      {/* Stats */}
      <div className="px-4 py-4 border-b border-gray-100 space-y-2">
        <button 
          onClick={() => router.push(getProfileRoute())}
          className="w-full text-left hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors duration-200 group"
        >
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700 flex items-center font-medium group-hover:text-blue-700">
              <Eye className="w-4 h-4 mr-2" />
              Profile views
            </span>
            <span className="text-blue-600 font-bold">-</span>
          </div>
        </button>
        <button 
          onClick={() => router.push(user.role === 'student' ? ROUTES.student.network : ROUTES.FACULTY.network)}
          className="w-full text-left hover:bg-purple-50 px-3 py-2 rounded-lg transition-colors duration-200 group"
        >
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700 flex items-center font-medium group-hover:text-purple-700">
              <Users className="w-4 h-4 mr-2" />
              Connections
            </span>
            <span className="text-purple-600 font-bold">-</span>
          </div>
        </button>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-4">
        <h4 className="text-sm font-bold text-gray-900 mb-3">Quick Access</h4>
        <div className="space-y-2">
          {user.role === 'student' && (
            <>
              <button
                onClick={() => router.push(ROUTES.student.marketplace)}
                className="w-full text-left text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg flex items-center transition-all duration-200 group"
              >
                <Briefcase className="w-4 h-4 mr-3 group-hover:scale-110 transition-transform duration-200" />
                Browse Projects
              </button>
              <button
                onClick={() => router.push(ROUTES.student.events)}
                className="w-full text-left text-sm text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-3 py-2 rounded-lg flex items-center transition-all duration-200 group"
              >
                <Award className="w-4 h-4 mr-3 group-hover:scale-110 transition-transform duration-200" />
                Events
              </button>
            </>
          )}
          {user.role === 'faculty' && (
            <>
              <button
                onClick={() => router.push(ROUTES.FACULTY.projects)}
                className="w-full text-left text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg flex items-center transition-all duration-200 group"
              >
                <Briefcase className="w-4 h-4 mr-3 group-hover:scale-110 transition-transform duration-200" />
                My Projects
              </button>
              <button
                onClick={() => router.push(ROUTES.FACULTY.badges)}
                className="w-full text-left text-sm text-gray-700 hover:text-green-600 hover:bg-green-50 px-3 py-2 rounded-lg flex items-center transition-all duration-200 group"
              >
                <Award className="w-4 h-4 mr-3 group-hover:scale-110 transition-transform duration-200" />
                Badges
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
