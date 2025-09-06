'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { fetchFeedPosts, clearFeed } from '@/store/slices/feedSlice';
import CreatePost from '@/components/Home/CreatePost';
import PostCard from '../Posts/PostCard';
import CreatePostModal from '../Posts/CreatePostModal';
import PostSearchFilters from '@/components/feed/PostSearchFilters';
import { CreatePostRequest } from '@/types/post';
import { networkApi } from '@/lib/networkApi';
import { Loader2, Search, Filter, RefreshCw, Calendar, User, Hash, X, ArrowUp } from 'lucide-react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
// Simple debounce utility
const debounce = <T extends (...args: any[]) => any>(func: T, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export default function MainFeed() {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch: AppDispatch = useDispatch();
  const { posts, loading, error, hasMore, page } = useSelector((state: RootState) => state.feed);
  
  // Performance optimized state
  const [activeTab, setActiveTab] = useState<'global' | 'following' | 'college'>('global');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    postTypes: [] as string[],
    dateRange: null as { from: string; to: string } | null,
    authorId: null as string | null,
    tags: [] as string[]
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Refs for performance
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const feedContainerRef = useRef<HTMLDivElement>(null);
  const lastFetchRef = useRef<number>(0);

  // Optimized tab change with debouncing
  const handleTabChange = useCallback((scope: 'global' | 'following' | 'college') => {
    setActiveTab(scope);
    setSearchResults([]);
    dispatch(clearFeed());
    dispatch(fetchFeedPosts({ scope, search: searchQuery, refresh: true }));
  }, [dispatch, searchQuery]);

  // Debounced search for performance
  const debouncedSearch = useMemo(
    () => debounce(async (query: string, searchFilters: any) => {
      if (!query.trim() && !Object.values(searchFilters).some(v => Array.isArray(v) ? v.length > 0 : v)) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const result = await networkApi.searchPosts(query, {
          postTypes: searchFilters.postTypes,
          dateRange: searchFilters.dateRange.from && searchFilters.dateRange.to 
            ? { from: searchFilters.dateRange.from, to: searchFilters.dateRange.to }
            : undefined,
          authorId: searchFilters.authorId || undefined,
          tags: searchFilters.tags,
          limit: 20
        });
        setSearchResults(result.items);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  const handleSearch = useCallback((query: string, searchFilters: any) => {
    debouncedSearch(query, searchFilters);
  }, [debouncedSearch]);

  const handleClearSearch = useCallback(() => {
    setSearchResults([]);
    setSearchQuery('');
  }, []);

  // Optimized refresh with throttling
  const handleRefresh = useCallback(async () => {
    const now = Date.now();
    if (now - lastFetchRef.current < 2000) return; // Throttle to 2 seconds
    
    lastFetchRef.current = now;
    setIsRefreshing(true);
    dispatch(clearFeed());
    await dispatch(fetchFeedPosts({ scope: activeTab, search: searchQuery, refresh: true }));
    setIsRefreshing(false);
    setSearchResults([]);
  }, [dispatch, activeTab, searchQuery]);

  // Infinite scroll handler
  const handleLoadMore = useCallback(async () => {
    if (loading || isLoadingMore || !hasMore || searchResults.length > 0) return;
    
    setIsLoadingMore(true);
    try {
      await dispatch(fetchFeedPosts({ 
        scope: activeTab, 
        search: searchQuery, 
        page: page + 1,
        refresh: false 
      }));
    } finally {
      setIsLoadingMore(false);
    }
  }, [dispatch, loading, isLoadingMore, hasMore, searchResults.length, activeTab, searchQuery, page]);

  // Scroll to top handler
  const scrollToTop = useCallback(() => {
    feedContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Intersection observer for infinite scroll
  useIntersectionObserver(loadMoreRef, handleLoadMore, {
    threshold: 0.1,
    rootMargin: '100px'
  });

  // Optimized effects
  useEffect(() => {
    if (user) {
      dispatch(fetchFeedPosts({ scope: activeTab, refresh: true }));
    }
  }, [dispatch, user, activeTab]);

  // Scroll position tracking
  useEffect(() => {
    const handleScroll = () => {
      if (feedContainerRef.current) {
        const scrollTop = feedContainerRef.current.scrollTop;
        setShowScrollTop(scrollTop > 500);
      }
    };

    const container = feedContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Memoized post list for performance
  const memoizedPosts = useMemo(() => {
    const postsToRender = searchResults.length > 0 ? searchResults : posts;
    return postsToRender.map((post: any, index: number) => (
      <div 
        key={post.id} 
        className="animate-in slide-in-from-bottom-4 duration-300"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <PostCard 
          post={post}
          isOptimized={true}
        />
      </div>
    ));
  }, [posts, searchResults]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Create Post */}
      <CreatePost />
      
      {/* Create Post Button */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Create New Post
        </button>
      </div>

      {/* Search and Filter Bar */}
      <PostSearchFilters
            onSearch={handleSearch}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filters={filters as any}
            setFilters={setFilters as any}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            isSearching={isSearching}
          />

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex space-x-1">
            {[
              { key: 'global', label: 'Global', icon: Hash },
              { key: 'following', label: 'Following', icon: User },
              { key: 'college', label: 'College', icon: Calendar }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => handleTabChange(key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeTab === key
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh feed"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Posts Container with Infinite Scroll */}
      <div 
        ref={feedContainerRef}
        className="space-y-4 max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
      >
        {loading && posts.length === 0 ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">Error loading posts: {error}</p>
            <button 
              onClick={handleRefresh}
              className="mt-2 text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            {searchResults.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-600">
                    Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                  </p>
                  <button
                    onClick={handleClearSearch}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    Clear search
                  </button>
                </div>
                {searchResults.map((post: any, index: number) => (
                  <div 
                    key={post.id}
                    className="animate-in slide-in-from-bottom-4 duration-300"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <PostCard post={post} isOptimized={true} />
                  </div>
                ))}
              </>
            ) : posts.length > 0 ? (
              <>
                {memoizedPosts}
                
                {/* Infinite Scroll Trigger */}
                {hasMore && (
                  <div 
                    ref={loadMoreRef}
                    className="flex justify-center py-6"
                  >
                    {isLoadingMore ? (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Loading more posts...</span>
                      </div>
                    ) : (
                      <div className="w-full h-4" />
                    )}
                  </div>
                )}
                
                {!hasMore && posts.length > 5 && (
                  <div className="text-center py-6 text-gray-500">
                    <p className="text-sm">You've reached the end of the feed</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No posts found</p>
                <p className="text-sm mt-1">Be the first to share something!</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 z-50 animate-in slide-in-from-bottom-4"
          title="Scroll to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={async (postData: CreatePostRequest) => {
          // Refresh feed to show new post
          dispatch(clearFeed());
          dispatch(fetchFeedPosts({ scope: activeTab, refresh: true }));
          setShowCreateModal(false);
        }}
      />
    </div>
  );
}
