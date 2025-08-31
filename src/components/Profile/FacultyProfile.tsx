'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { fetchProfile, updateProfile } from '@/store/slices/profileSlice';
import { fetchPublications } from '@/store/slices/publicationsSlice';
import { profileApi, Publication, Experience } from '@/lib/profileApi';
import { networkApi, FollowerStats } from '@/lib/networkApi';
import ProfileHero from './ProfileHero';
import ProfileStats from './ProfileStats';
import ProfileTabs from './ProfileTabs';
import AboutTab from './AboutTab';
import FacultyPublicationsTab from './FacultyPublicationsTab';
import FacultyExperienceTab from './FacultyExperienceTab';
import ContactTab from './ContactTab';

interface FacultyProfileProps {
  userId?: string; // If not provided, shows current user's profile
}

export default function FacultyProfile({ userId }: FacultyProfileProps) {
  const dispatch = useDispatch() as any;
  const reduxUser = useSelector((state: any) => state.auth.user);
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
  
  const { profile, loading: profileLoading } = useSelector((state: any) => state.profile);
  const publications = useSelector((state: any) => state.publications.items);
  const publicationsLoading = useSelector((state: any) => state.publications.loading);
  
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [experiencesLoading, setExperiencesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('about');
  const [followerStats, setFollowerStats] = useState<FollowerStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  
  const isOwnProfile = !userId || userId === user?.id;
  const targetUserId = userId || user?.id;

  const fetchExperiences = async (userId: string) => {
    setExperiencesLoading(true);
    try {
      const data = isOwnProfile 
        ? await profileApi.getMyExperiences()
        : await profileApi.getExperiences(userId);
      setExperiences(data);
    } catch (error: any) {
      console.error('Failed to fetch experiences:', error);
      toast.error('Failed to load experiences');
    } finally {
      setExperiencesLoading(false);
    }
  };

  const fetchFollowerStats = async (userId: string) => {
    setStatsLoading(true);
    try {
      const stats = await networkApi.fetchFollowerStats(userId);
      setFollowerStats(stats);
    } catch (error: any) {
      console.error('Failed to fetch follower stats:', error);
      // Don't show error toast for network stats - it's not critical
      setFollowerStats({ followers: 0, following: 0, isFollowing: false, followsMe: false });
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      console.log('FacultyProfile: No authenticated user, skipping data fetch');
      return;
    }

    if (targetUserId) {
      console.log('FacultyProfile: Fetching profile for userId:', targetUserId);
      dispatch(fetchProfile(targetUserId))
        .unwrap()
        .then((profile: any) => {
          console.log('FacultyProfile: Profile fetched successfully:', profile);
        })
        .catch((error: any) => {
          console.error('FacultyProfile: Failed to fetch profile:', error);
          toast.error('Failed to load profile data');
        });
      
      // Dispatch publications fetch if slice exists
      if (fetchPublications) {
        dispatch(fetchPublications(targetUserId));
      }
      
      // Fetch experiences
      fetchExperiences(targetUserId);
      
      // Fetch follower stats
      fetchFollowerStats(targetUserId);
    }
  }, [dispatch, targetUserId, user, userId]);

  const displayProfile = profile;

  const handleProfileUpdate = useCallback(async (data: any) => {
    try {
      console.log('FacultyProfile: Updating profile with data:', data);
      const result = await dispatch(updateProfile(data));
      console.log('FacultyProfile: Update result:', result);
      if (updateProfile.fulfilled.match(result)) {
        console.log('FacultyProfile: Profile updated successfully');
        // Don't show toast here - AboutTab handles it
      }
    } catch (error) {
      console.error('FacultyProfile: Failed to update profile:', error);
      throw error;
    }
  }, [dispatch]);

  const getStats = () => {
    if (!displayProfile) return [];

    return [
      {
        label: 'Publications',
        value: publications?.length || 0,
        color: 'purple'
      },
      {
        label: 'Followers',
        value: followerStats?.followers || 0,
        color: 'purple'
      },
      {
        label: 'Following',
        value: followerStats?.following || 0,
        color: 'purple'
      },
      {
        label: 'Research Areas',
        value: displayProfile.expertise?.length || 0,
        color: 'blue'
      },
      {
        label: 'Experience Areas',
        value: experiences?.length || 0,
        color: 'emerald'
      },
      {
        label: 'Total Experience',
        value: experiences?.reduce((sum: number, exp: any) => sum + (exp.yearsExp || 0), 0) || 0,
        color: 'indigo'
      }
    ];
  };

  const getTabs = () => {
    const baseTabs = [
      { id: 'about', label: 'About', count: null },
      { id: 'publications', label: 'Publications', count: publications?.length || 0 },
      { id: 'experience', label: 'Experience', count: experiences?.length || 0 },
      { id: 'expertise', label: 'Expertise', count: displayProfile?.expertise?.length || 0 },
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
              name: displayProfile?.displayName || displayProfile?.name || '',
              bio: displayProfile?.bio,
              department: displayProfile?.department || '',
              college: displayProfile?.collegeName || displayProfile?.college || '',
              collegeMemberId: displayProfile?.collegeMemberId,
              contactInfo: displayProfile?.contactInfo,
              phoneNumber: displayProfile?.phoneNumber || displayProfile?.phone,
              alternateEmail: displayProfile?.alternateEmail,
              joinedAt: displayProfile?.joinedAt || new Date().toISOString(),
              isFaculty: true
            }}
            isOwnProfile={isOwnProfile}
            onUpdate={handleProfileUpdate}
          />
        );
      case 'experience':
        return (
          <FacultyExperienceTab
            experiences={experiences}
            isOwnProfile={isOwnProfile}
            loading={experiencesLoading}
            onAddExperience={async (data) => {
              try {
                await profileApi.createExperience(data);
                if (targetUserId) {
                  await fetchExperiences(targetUserId);
                }
                toast.success('Experience added successfully!');
              } catch (error) {
                toast.error('Failed to add experience');
              }
            }}
            onUpdateExperience={async (id, data) => {
              try {
                await profileApi.updateExperience(id, data);
                if (targetUserId) {
                  await fetchExperiences(targetUserId);
                }
                toast.success('Experience updated successfully!');
              } catch (error) {
                toast.error('Failed to update experience');
              }
            }}
            onDeleteExperience={async (id) => {
              try {
                await profileApi.deleteExperience(id);
                if (targetUserId) {
                  await fetchExperiences(targetUserId);
                }
                toast.success('Experience deleted successfully!');
              } catch (error) {
                toast.error('Failed to delete experience');
              }
            }}
          />
        );
      case 'publications':
        return (
          <FacultyPublicationsTab
            publications={publications || []}
            isOwnProfile={isOwnProfile}
            loading={publicationsLoading}
            onAddPublication={async (data) => {
              try {
                await profileApi.createPublication(data);
                if (targetUserId) {
                  dispatch(fetchPublications(targetUserId));
                }
                toast.success('Publication added successfully!');
              } catch (error) {
                toast.error('Failed to add publication');
              }
            }}
            onUpdatePublication={async (id, data) => {
              try {
                await profileApi.updatePublication(id, data);
                if (targetUserId) {
                  dispatch(fetchPublications(targetUserId));
                }
                toast.success('Publication updated successfully!');
              } catch (error) {
                toast.error('Failed to update publication');
              }
            }}
            onDeletePublication={async (id) => {
              try {
                await profileApi.deletePublication(id);
                if (targetUserId) {
                  dispatch(fetchPublications(targetUserId));
                }
                toast.success('Publication deleted successfully!');
              } catch (error) {
                toast.error('Failed to delete publication');
              }
            }}
          />
        );
      case 'expertise':
        return (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Research Areas & Expertise</h3>
                {isOwnProfile && (
                  <button
                    onClick={() => setActiveTab('about')}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Edit Expertise
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {displayProfile?.expertise && displayProfile.expertise.length > 0 ? (
                  displayProfile.expertise.map((area: string) => (
                    <span key={area} className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full font-medium">
                      {area}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500">
                    {isOwnProfile ? 'Add your expertise areas in the About section' : 'No expertise areas specified'}
                  </p>
                )}
              </div>
            </div>
            {experiences && experiences.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Professional Experience</h3>
                  {isOwnProfile && (
                    <button
                      onClick={() => setActiveTab('experience')}
                      className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                    >
                      Manage Experience
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                  {experiences.map((exp: any, index: number) => (
                    <div key={index} className="border-l-4 border-purple-200 pl-4 bg-gray-50 p-4 rounded-r-lg">
                      <h4 className="font-medium text-gray-900">{exp.area}</h4>
                      <p className="text-purple-600 font-medium">{exp.level} Level</p>
                      {exp.yearsExp && <p className="text-sm text-gray-500">{exp.yearsExp} years experience</p>}
                      {exp.description && <p className="text-gray-700 mt-2">{exp.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case 'contact':
        return (
          <ContactTab
            profile={displayProfile || {}}
            role="faculty"
            isOwnProfile={isOwnProfile}
            onUpdate={handleProfileUpdate}
          />
        );
      default:
        return null;
    }
  };

  if (profileLoading || publicationsLoading || experiencesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="w-32 h-32 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="flex-1 space-y-4">
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              </div>
            </div>
          </div>
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
        </div>
      </div>
    );
  }
  if (!displayProfile && !profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Profile not found</h1>
            <p className="text-gray-600 mt-2">The requested profile could not be found.</p>
          </div>
        </div>
      </div>
    );
  }

  if (profileLoading || !displayProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <ProfileHero
          profile={{
            ...displayProfile,
            role: 'faculty' as const,
            name: displayProfile.displayName || displayProfile.name || 'Unknown User',
            department: displayProfile.department || 'Unknown Department',
            college: displayProfile.collegeName || displayProfile.college || 'Unknown College',
            joinedAt: displayProfile.joinedAt || new Date().toISOString(),
            linkedin: displayProfile.linkedIn,
            github: displayProfile.github,
            twitter: displayProfile.twitter,
            website: displayProfile.website
          }}
          stats={getStats().reduce((acc, stat) => ({ ...acc, [stat.label.toLowerCase()]: stat.value }), {})}
          isOwnProfile={isOwnProfile}
          onEditProfile={() => setActiveTab('about')}
          onAvatarUpdate={async (url: string) => {
            await handleProfileUpdate({ avatarUrl: url });
          }}
        />

        <div className="mb-8">
          <ProfileStats 
            role="faculty"
            stats={{
              publications: publications?.length || 0,
              followers: 0, // TODO: Implement followers from network API
              following: 0  // TODO: Implement following from network API
            }}
          />
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <ProfileTabs
            role="faculty"
            activeTab={activeTab}
            onTabChange={setActiveTab}
            counts={{
              publications: publications?.length || 0,
              experiences: experiences?.length || 0
            }}
          />
          
          <div className="p-8">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
