'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { useAuth } from '@/contexts/AuthContext';
import { fetchProfile, updateProfile } from '@/store/slices/profileSlice';
import { fetchAwardsForStudent } from '@/store/slices/badgesSlice';
import { fetchMyPersonalProjects } from '@/store/slices/projectsSlice';
import { profileApi } from '@/lib/profileApi';
import type { StudentBadgeAward } from '../../lib/profileApi';
import toast from 'react-hot-toast';
import ProfileHero from './ProfileHero';
import ProfileStats from './ProfileStats';
import ProfileTabs from './ProfileTabs';
import AboutTab from './AboutTab';
import StudentProjectsTab from './StudentProjectsTab';
import StudentBadgesTab from './StudentBadgesTab';
import ContactTab from './ContactTab';

interface StudentProfileProps {
  userId?: string; // If not provided, shows current user's profile
}

// Transform StudentBadgeAward to Badge format expected by StudentBadgesTab
const transformBadges = (awards: StudentBadgeAward[]) => {
  return awards.map(award => ({
    id: award.id,
    name: award.badge?.name || award.badgeId,
    description: award.badge?.description || award.reason,
    icon: award.badge?.icon || 'award', // Use icon from badge definition or fallback
    color: award.badge?.color || '#3B82F6', // Use color from badge or default blue
    rarity: (award.badge?.rarity?.toLowerCase() || 'common') as 'common' | 'rare' | 'epic' | 'legendary',
    category: award.badge?.category || 'achievement',
    awardedAt: award.awardedAt,
    awardedBy: award.awardedBy,
    awardedByName: award.awardedByName || 'Unknown',
    reason: award.reason,
    projectId: award.projectId
  }));
};

// Transform profile to include role
const transformProfileWithRole = (profile: any) => {
  if (!profile) return null;
  return {
    ...profile,
    role: 'student' as const
  };
};

export default function StudentProfile({ userId }: StudentProfileProps) {
  const dispatch = useAppDispatch();
  const reduxUser = useAppSelector((state) => state.auth.user);
  const { user: authUser } = useAuth(); // Fallback to AuthContext
  const user = reduxUser || (authUser ? {
    id: authUser.id,
    name: authUser.name,
    email: authUser.email,
    roles: [authUser.role.toUpperCase()],
    avatar: authUser.avatar,
    collegeMemberId: authUser.collegeMemberId,
    college: authUser.collegeId,
    department: authUser.department,
  } : null);
  const { profile, loading: profileLoading } = useAppSelector((state) => state.profile);
  const { badges, loading: badgesLoading } = useAppSelector((state) => state.badges);
  const { personalProjects, loading: projectsLoading } = useAppSelector((state) => state.projects);
  
  const [activeTab, setActiveTab] = useState('about');
  const isOwnProfile = !userId || userId === user?.id;
  const targetUserId = userId || user?.id;

  useEffect(() => {
    // Ensure we have a user before attempting to fetch profile data
    if (!user) {
      console.log('StudentProfile: No authenticated user, skipping data fetch');
      console.log('StudentProfile: Auth state debug:', { user, userId, targetUserId });
      return;
    }

    if (targetUserId) {
      console.log('StudentProfile: Fetching data for userId:', targetUserId);
      console.log('StudentProfile: Current user:', user);
      console.log('StudentProfile: Profile state before fetch:', { profile, profileLoading });
      
      dispatch(fetchProfile(targetUserId))
        .unwrap()
        .then((profile) => {
          console.log('StudentProfile: Profile fetched successfully:', profile);
        })
        .catch((error) => {
          console.error('StudentProfile: Failed to fetch profile:', error);
          toast.error('Failed to load profile data');
        });
      
      dispatch(fetchAwardsForStudent({ studentId: targetUserId }));
      // Fetch personal projects for the specific user
      if (isOwnProfile) {
        dispatch(fetchMyPersonalProjects());
      }
    } else {
      console.log('StudentProfile: No targetUserId available');
      console.log('StudentProfile: userId prop:', userId);
      console.log('StudentProfile: user from auth:', user);
    }
  }, [dispatch, targetUserId, user, userId, isOwnProfile]);

  const handleProfileUpdate = async (data: any) => {
    try {
      await dispatch(updateProfile(data));
      // Refresh profile data to get updated avatar
      if (targetUserId) {
        dispatch(fetchProfile(targetUserId));
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const getStats = () => {
    if (!profile) return [];

    return [
      {
        label: 'Projects',
        value: personalProjects?.length || 0,
        color: 'emerald'
      },
      {
        label: 'Badges Earned',
        value: badges?.length || 0,
        color: 'amber'
      },
      {
        label: 'Skills',
        value: profile.skills?.length || 0,
        color: 'blue'
      },
      {
        label: 'Year',
        value: profile.year || 1,
        color: 'purple'
      }
    ];
  };

  const getTabs = () => {
    const baseTabs = [
      { id: 'about', label: 'About', count: null },
      { id: 'projects', label: 'Projects', count: personalProjects?.length || 0 },
      { id: 'badges', label: 'Badges', count: badges?.length || 0 },
      { id: 'contact', label: 'Contact', count: null }
    ];

    return baseTabs;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'about':
        return (
          <AboutTab
            profile={{
              name: displayProfile?.displayName || '',
              bio: displayProfile?.bio,
              department: displayProfile?.department || '',
              college: displayProfile?.collegeName || displayProfile?.college || '',
              year: displayProfile?.year,
              collegeMemberId: displayProfile?.collegeMemberId,
              contactInfo: displayProfile?.contactInfo,
              phoneNumber: displayProfile?.phoneNumber || displayProfile?.phone,
              alternateEmail: displayProfile?.alternateEmail,
              joinedAt: displayProfile?.joinedAt || new Date().toISOString(),
              skills: displayProfile?.skills || []
            }}
            isOwnProfile={isOwnProfile}
            onUpdate={handleProfileUpdate}
          />
        );
      case 'projects':
        return (
          <StudentProjectsTab
            projects={(personalProjects || []).map(project => ({
              ...project,
              technologies: (project as any).technologies || []
            }))}
            isOwnProfile={isOwnProfile}
            loading={projectsLoading}
            onAddProject={async (projectData) => {
              try {
                await profileApi.createPersonalProject(projectData);
                toast.success('Project added successfully!');
                dispatch(fetchMyPersonalProjects());
              } catch (error) {
                toast.error('Failed to add project');
                console.error('Add project error:', error);
              }
            }}
            onUpdateProject={async (id, projectData) => {
              try {
                await profileApi.updatePersonalProject(id, projectData);
                toast.success('Project updated successfully!');
                dispatch(fetchMyPersonalProjects());
              } catch (error) {
                toast.error('Failed to update project');
                console.error('Update project error:', error);
              }
            }}
            onDeleteProject={async (id) => {
              try {
                await profileApi.deletePersonalProject(id);
                toast.success('Project deleted successfully!');
                dispatch(fetchMyPersonalProjects());
              } catch (error) {
                toast.error('Failed to delete project');
                console.error('Delete project error:', error);
              }
            }}
          />
        );
      case 'badges':
        return (
          <StudentBadgesTab
            badges={transformBadges(badges || [])}
            loading={badgesLoading}
          />
        );
      case 'contact':
        return (
          <ContactTab
            profile={{
              ...displayProfile,
              phoneNumber: displayProfile?.phoneNumber || displayProfile?.phone,
              resumeUrl: (displayProfile as any)?.resumeUrl,
              resumeFilename: (displayProfile as any)?.resumeFilename
            }}
            role="student"
            isOwnProfile={isOwnProfile}
            onUpdate={handleProfileUpdate}
          />
        );
      default:
        return null;
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Hero Skeleton */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-8">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="w-32 h-32 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="flex-1 space-y-4">
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Stats Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="space-y-3">
                  <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Content Skeleton */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <div className="space-y-6">
              <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-4 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Use real profile data from API
  const displayProfile = profile;

  if (!displayProfile && !profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Not Found</h2>
            <p className="text-gray-600">Unable to load profile data. Please try again later.</p>
            
            {/* Debug information */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg text-left text-xs">
              <h4 className="font-medium mb-2">Debug Info:</h4>
              <p>User: {user ? `${user.name} (${user.id})` : 'Not authenticated'}</p>
              <p>Target User ID: {targetUserId || 'None'}</p>
              <p>Profile Loading: {profileLoading ? 'Yes' : 'No'}</p>
              <p>Profile Data: {displayProfile ? 'Available' : 'None'}</p>
            </div>
            
            <button 
              onClick={() => targetUserId && dispatch(fetchProfile(targetUserId))}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <ProfileHero
            profile={{
              ...transformProfileWithRole(displayProfile),
              avatar: displayProfile?.avatarUrl,
              avatarUrl: displayProfile?.avatarUrl,
              linkedin: displayProfile?.linkedIn,
              github: displayProfile?.github,
              twitter: displayProfile?.twitter,
              website: displayProfile?.website
            }}
            stats={{
              projects: personalProjects?.length || 0,
              badges: badges?.length || 0,
              skills: displayProfile?.skills?.length || 0,
              followers: 0,
              following: 0
            }}
            isOwnProfile={isOwnProfile}
            onAvatarUpdate={async (url: string) => {
              await handleProfileUpdate({ avatarUrl: url });
            }}
            onNavigateToContact={() => setActiveTab('contact')}
          />
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <ProfileStats
            stats={{
              projects: personalProjects?.length || 0,
              badges: badges?.length || 0,
              followers: 0,
              following: 0
            }}
            role="student"
            loading={profileLoading || badgesLoading || projectsLoading}
          />
        </motion.div>

        {/* Tabs and Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <ProfileTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            role="student"
            counts={{
              projects: personalProjects?.length || 0,
              badges: badges?.length || 0
            }}
          />
          
          <div className="p-8">
            {renderTabContent()}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
