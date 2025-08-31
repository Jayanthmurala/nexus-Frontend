'use client';

import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { checkAuth, loginUser } from '@/store/slices/authSlice';
import StudentProfile from '@/components/Profile/StudentProfile';
import FacultyProfile from '@/components/Profile/FacultyProfile';

export default function TestProfilePage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const loading = useAppSelector((state) => state.auth.loading);

  useEffect(() => {
    // Initialize auth if no user
    if (!user && !loading) {
      dispatch(checkAuth());
    }
  }, [dispatch, user, loading]);

  const handleLoginAsStudent = () => {
    dispatch(loginUser({ email: 'student@test.com', password: 'test' }));
  };

  const handleLoginAsFaculty = () => {
    dispatch(loginUser({ email: 'faculty@test.com', password: 'test' }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full mx-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Test Profile Pages</h1>
          <p className="text-gray-600 mb-6 text-center">
            Login as different user types to test profile functionality
          </p>
          
          <div className="space-y-4">
            <button
              onClick={handleLoginAsStudent}
              className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
            >
              Login as Student
            </button>
            
            <button
              onClick={handleLoginAsFaculty}
              className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
            >
              Login as Faculty
            </button>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Debug Info:</h3>
            <p className="text-sm text-gray-600">User: {user ? 'Logged in' : 'None'}</p>
            <p className="text-sm text-gray-600">Loading: {loading ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* User switcher */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">Profile Test Page</h1>
            <div className="text-sm text-gray-600">
              Logged in as: <span className="font-medium">{(user as any).name || 'User'}</span> ({(user as any).roles?.[0] || 'Unknown'})
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleLoginAsStudent}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                (user as any).roles?.includes('STUDENT') 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Student View
            </button>
            
            <button
              onClick={handleLoginAsFaculty}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                (user as any).roles?.includes('FACULTY') 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Faculty View
            </button>
          </div>
        </div>
      </div>

      {/* Render appropriate profile component */}
      {(user as any).roles?.includes('FACULTY') ? (
        <FacultyProfile />
      ) : (
        <StudentProfile />
      )}
    </div>
  );
}
