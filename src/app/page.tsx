'use client';

import React from 'react';
import AuthPage from '@/components/Auth/AuthPage';
import { useAuth } from '@/contexts/AuthContext';
import Feed from '@/components/feed/Feed';
import CreatePost from '@/components/feed/CreatePost';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createPost, selectFeedItems } from '@/store/slices/networkSlice';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { selectProjects, fetchMyProjects } from '@/store/slices/projectsSlice';
import { selectAwardsForStudent, fetchAwardsForStudent } from '@/store/slices/badgesSlice';

export default function HomePage() {
  const { user, loading } = useAuth();
  const dispatch = useAppDispatch();
  const [showCreate, setShowCreate] = React.useState(false);
  const [updateText, setUpdateText] = React.useState('');

  // Stats data
  const projects = useAppSelector(selectProjects);
  const activeProjectsCount = React.useMemo(
    () => projects.filter((p) => p.progressStatus === 'OPEN' || p.progressStatus === 'IN_PROGRESS').length,
    [projects]
  );
  const myAwards = useAppSelector((state) => (user?.id ? selectAwardsForStudent(state, user.id) : []));
  const achievementsCount = myAwards?.length || 0;
  const feedItems = useAppSelector((state) => selectFeedItems(state, 'college'));

  React.useEffect(() => {
    // Prefetch stats
    dispatch(fetchMyProjects());
  }, [dispatch]);

  React.useEffect(() => {
    if (user?.id) {
      dispatch(fetchAwardsForStudent({ studentId: user.id }));
    }
  }, [dispatch, user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) return <AuthPage />;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Academic Feed</h1>
          <p className="text-gray-600">Share your journey, discover opportunities, celebrate achievements</p>
        </div>
        <div className="flex gap-2">
          <Button variant="default" className="bg-blue-600 hover:bg-blue-700">All</Button>
          <Button asChild variant="outline" className="flex items-center gap-2">
            <Link href="/badges">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z" />
              </svg>
              Badges
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Active Projects */}
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-700 font-medium mb-1">Active Projects</p>
                <p className="text-3xl font-bold text-blue-900">{activeProjectsCount}</p>
              </div>
              <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card className="bg-green-50 border-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-700 font-medium mb-1">Achievements</p>
                <p className="text-3xl font-bold text-green-900">{achievementsCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Network (Posts Loaded) */}
        <Card className="bg-purple-50 border-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-700 font-medium mb-1">Network</p>
                <div className="flex items-center gap-1">
                  <p className="text-3xl font-bold text-purple-900">{feedItems.length}</p>
                  <svg className="w-6 h-6 text-yellow-500 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z" />
                  </svg>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-200 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Update Input */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            {/* Avatar fallback */}
            <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-semibold flex items-center justify-center">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 flex items-center gap-3">
              <Input
                placeholder="Share an update, achievement, or opportunity..."
                value={updateText}
                onChange={(e) => setUpdateText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') setShowCreate(true); }}
                className="flex-1 border-gray-200 focus:border-blue-500"
              />
              <Button size="icon" className="bg-blue-600 hover:bg-blue-700 rounded-lg" onClick={() => setShowCreate(true)}>
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feed */}
      <Feed />

      {showCreate && (
        <CreatePost
          onClose={() => setShowCreate(false)}
          onSubmit={(post) => {
            setShowCreate(false);
            const content = post.content?.trim();
            if (!content) return;
            dispatch(createPost({
              content,
              visibility: 'COLLEGE',
              type: 'STANDARD',
              mediaIds: post.mediaIds && post.mediaIds.length ? post.mediaIds : undefined,
            }));
            setUpdateText('');
          }}
        />
      )}
    </div>
  );
}

