'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import StudentProfile from '@/components/Profile/StudentProfile';
import FacultyProfile from '@/components/Profile/FacultyProfile';
import { Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  const { user } = useAppSelector((state) => state.auth || { user: null });
  const [profileRole, setProfileRole] = useState<'student' | 'faculty' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Determine profile role based on user data or API call
    const determineProfileRole = async () => {
      try {
        // If viewing own profile, use current user's role
        if (!userId || userId === user?.id) {
          const userRoles = user?.roles || [];
          if (userRoles.includes('STUDENT')) {
            setProfileRole('student');
          } else if (userRoles.includes('FACULTY')) {
            setProfileRole('faculty');
          }
        } else {
          // For other users, we'd need to fetch their profile to determine role
          // For now, we'll make an assumption based on the route or implement API call
          // This would typically be handled by the profile components themselves
          setProfileRole('student'); // Default assumption
        }
      } catch (error) {
        console.error('Error determining profile role:', error);
      } finally {
        setLoading(false);
      }
    };

    determineProfileRole();
  }, [userId, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profileRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile not found</h2>
          <p className="text-gray-600">Unable to determine profile type or user not found.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {profileRole === 'student' && <StudentProfile userId={userId} />}
      {profileRole === 'faculty' && <FacultyProfile userId={userId} />}
    </>
  );
}
