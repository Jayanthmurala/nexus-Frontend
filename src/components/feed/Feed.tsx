'use client';

import React, { useEffect, useState } from 'react';
import { Award, Heart, Bookmark, MessageCircle, FileText, Plus } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchFeed,
  selectFeedItems,
  selectFeedLoading,
  selectFeedError,
  selectFeedHasMore,
  selectFeedNextCursor,
  selectFeedInitialized,
  likePost,
  unlikePost,
  bookmarkPost,
  unbookmarkPost,
  selectLikeLoadingMap,
  selectBookmarkLoadingMap,
  createPost,
  updatePost,
  deletePost,
} from '@/store/slices/networkSlice';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/toast';
import PostCard from './PostCard';
import CreatePost from './CreatePost';

export default function Feed() {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  const scope: 'college' | 'global' | 'following' = 'college';
  const items = useAppSelector((s) => selectFeedItems(s, scope));
  const loading = useAppSelector((s) => selectFeedLoading(s, scope));
  const error = useAppSelector((s) => selectFeedError(s, scope));
  const hasMore = useAppSelector((s) => selectFeedHasMore(s, scope));
  const nextCursor = useAppSelector((s) => selectFeedNextCursor(s, scope));
  const initialized = useAppSelector((s) => selectFeedInitialized(s, scope));
  const likeLoadingMap = useAppSelector(selectLikeLoadingMap);
  const bookmarkLoadingMap = useAppSelector(selectBookmarkLoadingMap);

  useEffect(() => {
    if (!initialized && !loading) {
      dispatch(fetchFeed({ scope }));
    }
  }, [initialized, loading, scope, dispatch]);

  const formatTime = (iso?: string) => {
    if (!iso) return '';
    const date = new Date(iso);
    const diffMs = Date.now() - date.getTime();
    const h = Math.floor(diffMs / 3600000);
    if (h < 1) return 'Just now';
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    return date.toLocaleDateString();
  };

  const handleCreatePost = async (postData: any) => {
    try {
      await dispatch(createPost({
        content: postData.content,
        visibility: postData.visibility,
        type: 'STANDARD',
        mediaIds: postData.mediaIds,
        tags: postData.tags,
        links: postData.links,
      })).unwrap();
      addToast({
        type: 'success',
        title: 'Post created successfully!',
        description: 'Your post has been shared with the community.',
      });
      setShowCreatePost(false);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to create post',
        description: 'Please try again later.',
      });
    }
  };

  const handleEditPost = (postId: string) => {
    setEditingPostId(postId);
    setShowCreatePost(true);
  };

  const handleDeletePost = async (postId: string) => {
    if (confirm('Are you sure you want to delete this post?')) {
      try {
        await dispatch(deletePost({ postId })).unwrap();
        addToast({
          type: 'success',
          title: 'Post deleted',
          description: 'Your post has been removed.',
        });
      } catch (error) {
        addToast({
          type: 'error',
          title: 'Failed to delete post',
          description: 'Please try again later.',
        });
      }
    }
  };

  const handleLike = (postId: string) => {
    const post = items.find(p => p.id === postId);
    if (post?.likedByMe) {
      dispatch(unlikePost({ postId }));
    } else {
      dispatch(likePost({ postId }));
    }
  };

  const handleBookmark = (postId: string) => {
    const post = items.find(p => p.id === postId);
    if (post?.bookmarkedByMe) {
      dispatch(unbookmarkPost({ postId }));
    } else {
      dispatch(bookmarkPost({ postId }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Network Feed</h1>
            <p className="text-gray-600 mt-1">Showing college feed</p>
          </div>
          <button
            onClick={() => setShowCreatePost(true)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Post</span>
          </button>
        </div>
      </div>

      {/* Feed items */}
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>
        )}
        {!initialized && loading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white border rounded-lg p-4 animate-pulse">
                <div className="h-3 w-48 bg-gray-200 rounded" />
                <div className="h-2 w-64 bg-gray-100 rounded mt-2" />
                <div className="h-2 w-40 bg-gray-100 rounded mt-2" />
              </div>
            ))}
          </div>
        )}
        {initialized && items.length === 0 && !loading && !error && (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
            <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-500">When posts are created in your college network, they will appear here.</p>
          </div>
        )}
        {items.map((it, idx) => (
          <PostCard
            key={it.id ?? idx}
            post={{
              id: it.id || '',
              authorId: it.authorId || '',
              authorName: it.authorDisplayName || 'Unknown',
              authorRole: user?.role === 'faculty' ? 'faculty' : user?.role === 'dept_admin' || user?.role === 'placements_admin' || user?.role === 'head_admin' ? 'admin' : 'student',
              authorDepartment: '', // Could be enhanced with user data
              content: it.content || '',
              visibility: (it.visibility as 'PUBLIC' | 'COLLEGE') || 'COLLEGE',
              type: 'text',
              attachments: [
                ...(it as any).media?.map((m: any) => ({
                  type: m?.mimeType?.startsWith('image/') ? 'image' : 'document',
                  url: m.url,
                  title: m.mimeType,
                })) || [],
                ...(it as any).links?.map((l: any) => ({
                  type: 'link',
                  url: l.url,
                  title: l.title || l.url,
                })) || [],
              ],
              tags: (it as any).tags || [],
              likes: it.likeCount || 0,
              comments: it.commentCount || 0,
              shares: 0,
              timestamp: new Date(it.createdAt || Date.now()),
              isLiked: it.likedByMe || false,
              isBookmarked: it.bookmarkedByMe || false,
            }}
            onLike={handleLike}
            onBookmark={handleBookmark}
            onEdit={handleEditPost}
            onDelete={handleDeletePost}
            currentUserId={user?.id}
          />
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="text-center py-6">
          <button
            className="bg-white border border-gray-200 hover:border-gray-300 px-6 py-3 rounded-lg text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-60"
            disabled={loading}
            onClick={() => dispatch(fetchFeed({ scope, cursor: nextCursor }))}
          >
            {loading ? 'Loading…' : 'Load More'}
          </button>
        </div>
      )}

      {/* Create Post Modal */}
      {showCreatePost && (
        <CreatePost
          onClose={() => {
            setShowCreatePost(false);
            setEditingPostId(null);
          }}
          onSubmit={handleCreatePost}
        />
      )}
    </div>
  );
}
