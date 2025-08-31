'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Search, Heart, Bookmark, MessageCircle, Plus, FileText } from 'lucide-react';
import UserCard from '@/components/network/UserCard';
import MessageInterface from '@/components/messaging/MessageInterface';
import ConnectionsManager from '@/components/connections/ConnectionsManager';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchFeed,
  selectActiveScope,
  selectFeedItems,
  selectFeedLoading,
  selectFeedError,
  selectFeedHasMore,
  selectFeedNextCursor,
  selectFeedInitialized,
  setActiveScope,
  // Directory
  fetchUsersDirectory,
  selectDirectoryItems,
  selectDirectoryLoading,
  selectDirectoryError,
  selectDirectoryHasMore,
  selectDirectoryNextOffset,
  selectDirectoryInitialized,
  setDirectoryQuery,
  setDirectoryCollege,
  resetDirectory,
  // Follow actions
  selectFollowingMap,
  selectFollowLoadingMap,
  followUser,
  unfollowUser,
  // Post interactions
  likePost,
  unlikePost,
  bookmarkPost,
  unbookmarkPost,
  selectLikeLoadingMap,
  selectBookmarkLoadingMap,
  createPost,
} from '@/store/slices/networkSlice';
import { fetchColleges, selectColleges, selectCollegesLoading } from '@/store/slices/collegesSlice';
import CreatePost from '@/components/feed/CreatePost';

export default function Network() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const [showCreate, setShowCreate] = useState(false);
  const [showMessageInterface, setShowMessageInterface] = useState(false);
  const [showConnectionsManager, setShowConnectionsManager] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Network feed state
  const activeScope = useAppSelector(selectActiveScope);
  const items = useAppSelector((s) => selectFeedItems(s, activeScope));
  const loading = useAppSelector((s) => selectFeedLoading(s, activeScope));
  const error = useAppSelector((s) => selectFeedError(s, activeScope));
  const hasMore = useAppSelector((s) => selectFeedHasMore(s, activeScope));
  const nextCursor = useAppSelector((s) => selectFeedNextCursor(s, activeScope));
  const initialized = useAppSelector((s) => selectFeedInitialized(s, activeScope));
  const likeLoadingMap = useAppSelector(selectLikeLoadingMap);
  const bookmarkLoadingMap = useAppSelector(selectBookmarkLoadingMap);

  // Users directory state
  const dirItems = useAppSelector(selectDirectoryItems);
  const dirLoading = useAppSelector(selectDirectoryLoading);
  const dirError = useAppSelector(selectDirectoryError);
  const dirHasMore = useAppSelector(selectDirectoryHasMore);
  const dirNextOffset = useAppSelector(selectDirectoryNextOffset);
  const dirInitialized = useAppSelector(selectDirectoryInitialized);
  const dirQ = useAppSelector((s) => s.network.directory.q);
  const dirCollegeId = useAppSelector((s) => s.network.directory.collegeId);
  const followingMap = useAppSelector(selectFollowingMap);
  const followLoadingMap = useAppSelector(selectFollowLoadingMap);
  const [qInput, setQInput] = React.useState(dirQ ?? '');

  // Colleges
  const colleges = useAppSelector(selectColleges);
  const collegesLoading = useAppSelector(selectCollegesLoading);

  // Note: Following state and people suggestions removed (no dummy data)

  // Initial feed fetch per scope (guarded by initialized/loading)
  useEffect(() => {
    const requiresAuth = activeScope === 'following';
    // Fetch if scope is public (college/global), or if following and user is present
    if ((!requiresAuth || user) && !initialized && !loading) {
      try { if (process.env.NODE_ENV !== 'production') console.debug('[Network] fetching feed', { scope: activeScope }); } catch {}
      dispatch(fetchFeed({ scope: activeScope }));
    }
  }, [user?.id, activeScope, initialized, loading, dispatch]);

  // Initial directory fetch
  useEffect(() => {
    if (!dirInitialized && !dirLoading) {
      try { if (process.env.NODE_ENV !== 'production') console.debug('[Network] fetching users directory'); } catch {}
      dispatch(fetchUsersDirectory({ offset: 0 }));
    }
  }, [dirInitialized, dirLoading, dispatch]);

  // Debounced search on qInput changes (post-initialization)
  const hasMountedRef = React.useRef(false);
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    if (!dirInitialized) return;
    const trimmed = qInput.trim();
    if (trimmed === (dirQ ?? '')) return;
    const handle = setTimeout(() => {
      dispatch(setDirectoryQuery(trimmed || undefined));
      dispatch(resetDirectory());
      dispatch(fetchUsersDirectory({ offset: 0 }));
    }, 500);
    return () => clearTimeout(handle);
  }, [qInput, dirInitialized, dirQ, dispatch]);

  // Fetch colleges for filter
  useEffect(() => {
    if (!collegesLoading && colleges.length === 0) {
      dispatch(fetchColleges());
    }
  }, [colleges.length, collegesLoading, dispatch]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Network
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Discover and follow students and faculty to build your professional network.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowConnectionsManager(true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 text-gray-700 text-sm hover:bg-gray-50"
          >
            <Users className="w-4 h-4" />
            Connections
          </button>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Create Post
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border rounded-xl p-4">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            dispatch(setDirectoryQuery(qInput.trim() || undefined));
            dispatch(resetDirectory());
            dispatch(fetchUsersDirectory({ offset: 0 }));
          }}
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search people by name"
              className="w-full pl-9 pr-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
            />
          </div>
          <select
            className="h-10 px-2 py-2 rounded-md border text-sm"
            value={dirCollegeId || ''}
            onChange={(e) => {
              const id = e.target.value || undefined;
              // update filter and refetch
              dispatch(setDirectoryCollege(id));
              dispatch(resetDirectory());
              dispatch(fetchUsersDirectory({ offset: 0 }));
            }}
          >
            <option value="">All colleges</option>
            {colleges.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            type="submit"
            className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm disabled:opacity-50"
            disabled={dirLoading}
          >
            Search
          </button>
        </form>
      </div>

      {/* People directory */}
      <div className="bg-white border rounded-xl">
        <div className="px-4 pt-4 pb-2 font-medium text-gray-900">People</div>
        <div className="p-4 space-y-3">
          {dirError && (
            <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-md p-2">{dirError}</div>
          )}
          {dirLoading && !dirInitialized && (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between border rounded-lg p-3 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200" />
                    <div>
                      <div className="h-3 w-40 bg-gray-200 rounded" />
                      <div className="h-2 w-56 bg-gray-100 rounded mt-2" />
                    </div>
                  </div>
                  <div className="h-8 w-24 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          )}
          {!dirLoading && dirItems.length === 0 && !dirError && (
            <div className="text-sm text-gray-600">No people found.</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dirItems.map((p) => (
              <UserCard
                key={p.id}
                user={{
                  userId: p.id,
                  displayName: p.name,
                  avatarUrl: p.avatar,
                  collegeName: p.college,
                  department: p.department,
                  year: p.year
                }}
                onMessage={(userId) => {
                  setSelectedUserId(userId);
                  setShowMessageInterface(true);
                }}
                variant="compact"
              />
            ))}
          </div>

          {/* Load more people */}
          <div className="pt-1">
            {dirHasMore && (
              <button
                type="button"
                className="w-full text-sm border rounded-md py-2 hover:bg-gray-50 disabled:opacity-60"
                disabled={dirLoading}
                onClick={() => dispatch(fetchUsersDirectory({ offset: dirNextOffset, append: true }))}
              >
                {dirLoading ? 'Loading…' : 'Load more people'}
              </button>
            )}
            {!dirHasMore && dirInitialized && dirItems.length > 0 && (
              <div className="text-center text-xs text-gray-500">No more people</div>
            )}
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="bg-white border rounded-xl">
        {/* Scope tabs */}
        <div className="border-b px-4 pt-4">
          <div className="inline-flex rounded-lg bg-gray-100 p-1 text-sm">
            {([
              { key: 'following', label: 'Following' },
              { key: 'college', label: 'College' },
              { key: 'global', label: 'Global' },
            ] as const).map((t) => {
              const active = activeScope === t.key;
              return (
                <button
                  key={t.key}
                  className={`px-3 py-1.5 rounded-md transition ${
                    active ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-800'
                  }`}
                  onClick={() => dispatch(setActiveScope(t.key))}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Feed list */}
        <div className="p-4 space-y-3">
          {error && (
            <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-md p-2">
              {error}
            </div>
          )}

          {!loading && items.length === 0 && !error && (
            <div className="text-sm text-gray-600">No posts yet.</div>
          )}

          {items.map((it, idx) => (
            <div key={it.id ?? `${idx}`} className="border rounded-lg p-3">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="font-medium text-gray-900">{it.authorDisplayName || it.authorId || 'Unknown'}</div>
                <div>{it.createdAt ? new Date(it.createdAt).toLocaleString() : '—'}</div>
              </div>
              <div className="mt-2 text-sm text-gray-900 whitespace-pre-wrap">
                {it.content?.trim() ? it.content : <span className="text-gray-500">(no content)</span>}
              </div>
              {Array.isArray((it as any).media) && (it as any).media.length > 0 && (
                <div className="mt-3 space-y-3">
                  {/* Images */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {(it as any).media
                      .filter((m: any) => m?.mimeType?.startsWith('image/'))
                      .map((m: any) => (
                        <div key={m.id} className="rounded overflow-hidden border">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={m.url} alt={m.mimeType} className="w-full h-40 object-cover" />
                        </div>
                      ))}
                  </div>
                  {/* Documents */}
                  <div className="space-y-2">
                    {(it as any).media
                      .filter((m: any) => !m?.mimeType?.startsWith('image/'))
                      .map((m: any) => (
                        <a
                          key={m.id}
                          href={m.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 text-sm text-blue-700 hover:underline"
                        >
                          <FileText className="w-4 h-4" />
                          <span>{m.mimeType}</span>
                        </a>
                      ))}
                  </div>
                </div>
              )}
              <div className="mt-2 flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-50 ${it.likedByMe ? 'text-red-600' : 'text-gray-600'}`}
                    disabled={!it.id || !!(it.id && likeLoadingMap[it.id])}
                    onClick={() => it.id && dispatch(it.likedByMe ? unlikePost({ postId: it.id }) : likePost({ postId: it.id }))}
                  >
                    <Heart className={`w-4 h-4 ${it.likedByMe ? 'fill-current' : ''}`} />
                    <span>{typeof it.likeCount === 'number' ? it.likeCount : 0}</span>
                  </button>
                  <div className="flex items-center gap-1 text-gray-500">
                    <MessageCircle className="w-4 h-4" />
                    <span>{typeof it.commentCount === 'number' ? it.commentCount : 0}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className={`p-2 rounded hover:bg-gray-50 ${it.bookmarkedByMe ? 'text-blue-600' : 'text-gray-600'}`}
                  disabled={!it.id || !!(it.id && bookmarkLoadingMap[it.id])}
                  onClick={() => it.id && dispatch(it.bookmarkedByMe ? unbookmarkPost({ postId: it.id }) : bookmarkPost({ postId: it.id }))}
                  aria-label="Bookmark"
                >
                  <Bookmark className={`w-4 h-4 ${it.bookmarkedByMe ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
          ))}

          {/* Load more */}
          <div className="pt-1">
            {hasMore && (
              <button
                type="button"
                className="w-full text-sm border rounded-md py-2 hover:bg-gray-50 disabled:opacity-60"
                disabled={loading}
                onClick={() => dispatch(fetchFeed({ scope: activeScope, cursor: nextCursor, append: true }))}
              >
                {loading ? 'Loading…' : 'Load more'}
              </button>
            )}
            {!hasMore && initialized && items.length > 0 && (
              <div className="text-center text-xs text-gray-500">No more posts</div>
            )}
          </div>
        </div>
      </div>

      {/* Suggestions and lists removed (dummy data) */}

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
          }}
        />
      )}

      {showMessageInterface && (
        <MessageInterface
          onClose={() => setShowMessageInterface(false)}
          initialUserId={selectedUserId || undefined}
        />
      )}

      {showConnectionsManager && (
        <ConnectionsManager
          onClose={() => setShowConnectionsManager(false)}
        />
      )}
    </div>
  );
}
