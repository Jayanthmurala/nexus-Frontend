'use client';

import React from 'react';
import {
  Plus,
  Award,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectBadgeDefinitions, selectRecentAwards, fetchBadgeDefinitions, fetchRecentAwards } from '@/store/slices/badgesSlice';
import CreatePost from '@/components/feed/CreatePost';
import PostCard from '@/components/feed/PostCard';

interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: 'student' | 'faculty' | 'admin';
  authorDepartment: string;
  content: string;
  type: 'text' | 'project_update' | 'achievement' | 'event' | 'collaboration' | 'badge_award';
  attachments?: Array<{
    type: 'image' | 'document' | 'link';
    url: string;
    title?: string;
  }>;
  tags?: string[];
  likes: number;
  comments: number;
  shares: number;
  timestamp: Date;
  isLiked: boolean;
  isBookmarked: boolean;
  badgeData?: {
    badgeName: string;
    badgeIcon: string;
    badgeColor: string;
    recipientName: string;
    reason: string;
  };
}

export default function Feed() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const badgeDefs = useAppSelector(selectBadgeDefinitions);
  const recentAwards = useAppSelector(selectRecentAwards);
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [showCreatePost, setShowCreatePost] = React.useState(false);
  const [filter, setFilter] = React.useState<'all' | 'badges'>('all');

  // Load badge definitions and recent awards
  React.useEffect(() => {
    dispatch(fetchBadgeDefinitions());
    dispatch(fetchRecentAwards({ limit: 50 }));
  }, [dispatch]);

  // Generate badge award posts from recentAwards
  React.useEffect(() => {
    const badgePosts: Post[] = recentAwards.map((award) => {
      const badge = badgeDefs.find((b) => b.id === award.badgeId);
      if (!badge) return null as any;

      return {
        id: `badge_${award.id}`,
        authorId: award.awardedBy,
        authorName: award.awardedByName || 'Faculty',
        authorRole: 'faculty' as const,
        authorDepartment: 'Faculty',
        content: `🎉 Congratulations to ${award.studentId === user?.id ? 'you' : 'a student'} for earning the "${badge.name}" badge! ${award.reason}`,
        type: 'badge_award' as const,
        tags: ['Achievement', 'Badge', ...(badge.category ? [badge.category] : [])],
        likes: Math.floor(Math.random() * 20) + 5,
        comments: Math.floor(Math.random() * 8) + 1,
        shares: Math.floor(Math.random() * 5) + 1,
        timestamp: new Date(award.awardedAt),
        isLiked: false,
        isBookmarked: false,
        badgeData: {
          badgeName: badge.name,
          badgeIcon: badge.icon || '🏅',
          badgeColor: badge.color || '#888',
          recipientName: award.studentId === user?.id ? user?.name || 'You' : 'Student',
          reason: award.reason,
        },
      };
    }).filter(Boolean) as Post[];

    const samplePosts: Post[] = [
      {
        id: '1',
        authorId: '2',
        authorName: 'Dr. Sarah Wilson',
        authorRole: 'faculty',
        authorDepartment: 'Computer Science',
        content:
          'Excited to share that our AI research project has been accepted at NeurIPS 2024! Looking for passionate graduate students to join our team. 🚀',
        type: 'achievement',
        tags: ['AI', 'Research', 'NeurIPS', 'Opportunity'],
        likes: 24,
        comments: 8,
        shares: 3,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        isLiked: false,
        isBookmarked: true,
      },
      {
        id: '2',
        authorId: '1',
        authorName: 'Alex Rodriguez',
        authorRole: 'student',
        authorDepartment: 'Mechanical Engineering',
        content:
          'Just finished building a robotic arm prototype! This project taught me so much about control systems and 3D printing. Special thanks to Prof. Johnson for the guidance.',
        type: 'project_update',
        attachments: [
          {
            type: 'image',
            url: 'https://picsum.photos/400/300',
            title: 'Robotic Arm Prototype',
          },
        ],
        tags: ['Robotics', '3D Printing', 'Engineering'],
        likes: 18,
        comments: 12,
        shares: 2,
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        isLiked: true,
        isBookmarked: false,
      },
      ...badgePosts,
    ];

    setPosts(samplePosts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  }, [badgeDefs, recentAwards, user]);

  const handleCreatePost = (
    newPost: Omit<Post, 'id' | 'likes' | 'comments' | 'shares' | 'isLiked' | 'isBookmarked'>
  ) => {
    const post: Post = {
      ...newPost,
      id: Date.now().toString(),
      likes: 0,
      comments: 0,
      shares: 0,
      isLiked: false,
      isBookmarked: false,
    };
    setPosts((prev) => [post, ...prev]);
    setShowCreatePost(false);
  };

  const handleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
          : post
      )
    );
  };

  const handleBookmark = (postId: string) => {
    setPosts((prev) => prev.map((post) => (post.id === postId ? { ...post, isBookmarked: !post.isBookmarked } : post)));
  };

  const filteredPosts = posts.filter((post) => {
    switch (filter) {
      case 'badges':
        return post.type === 'badge_award';
      default:
        return true;
    }
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Enhanced Header Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Academic Feed</h1>
            <p className="text-gray-600 mt-1">Share your journey, discover opportunities, celebrate achievements</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  filter === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('badges')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  filter === 'badges' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Award className="w-4 h-4 mr-1 inline" />
                Badges
              </button>
            </div>
          </div>
        </div>

        {/* Header bodies and actions */}

        {/* Quick Create Post */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">{user?.name?.charAt(0)}</span>
            </div>
            <button
              onClick={() => setShowCreatePost(true)}
              className="flex-1 bg-white border border-gray-200 rounded-lg px-4 py-3 text-left text-gray-500 hover:border-gray-300 transition-colors"
            >
              Share an update, achievement, or opportunity...
            </button>
            <button onClick={() => setShowCreatePost(true)} className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg transition-colors">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreatePost && <CreatePost onClose={() => setShowCreatePost(false)} onSubmit={handleCreatePost} />}

      {/* Posts Feed */}
      <div className="space-y-6">
        {filteredPosts.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
            <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
            <p className="text-gray-500">{filter === 'badges' ? 'No badge achievements to show yet.' : 'Be the first to share something!'}</p>
          </div>
        ) : (
          filteredPosts.map((post) => <PostCard key={post.id} post={post} onLike={handleLike} onBookmark={handleBookmark} />)
        )}
      </div>

      {/* Load More */}
      {filteredPosts.length > 0 && (
        <div className="text-center py-8">
          <button className="bg-white border border-gray-200 hover:border-gray-300 px-6 py-3 rounded-lg text-gray-600 hover:text-gray-900 transition-colors">
            Load More Posts
          </button>
        </div>
      )}
    </div>
  );
}
