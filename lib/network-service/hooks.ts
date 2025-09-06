/**
 * React Hooks for Nexus Network Service
 * Custom hooks for seamless frontend integration
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  NetworkApiClient, 
  PostResponse, 
  CommentResponse, 
  CreatePostRequest, 
  FeedParams,
  PaginatedResponse,
  PostType 
} from './api-client';

// Hook configurations
export interface UseNetworkConfig {
  client: NetworkApiClient;
}

// =================== FEED HOOKS ===================

export function useFeed(params: FeedParams = {}, config: UseNetworkConfig) {
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [refreshing, setRefreshing] = useState(false);

  const loadFeed = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        // Reset cursor for refresh
        const response = await config.client.getFeed({ ...params, cursor: undefined });
        setPosts(response.items);
        setNextCursor(response.nextCursor);
        setHasMore(response.hasMore);
      } else {
        setLoading(true);
        const response = await config.client.getFeed(params);
        setPosts(response.items);
        setNextCursor(response.nextCursor);
        setHasMore(response.hasMore);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [config.client, params]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;

    try {
      const response = await config.client.getFeed({
        ...params,
        cursor: nextCursor
      });
      
      setPosts(prev => [...prev, ...response.items]);
      setNextCursor(response.nextCursor);
      setHasMore(response.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more posts');
    }
  }, [config.client, params, nextCursor, hasMore, loading]);

  const refresh = useCallback(() => {
    loadFeed(true);
  }, [loadFeed]);

  // Auto-load on mount and params change
  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  return {
    posts,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    refreshing
  };
}

// =================== POST MANAGEMENT HOOKS ===================

export function usePost(postId: string, config: UseNetworkConfig) {
  const [post, setPost] = useState<PostResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPost = useCallback(async () => {
    try {
      setLoading(true);
      const response = await config.client.getPost(postId);
      setPost(response);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load post');
    } finally {
      setLoading(false);
    }
  }, [config.client, postId]);

  useEffect(() => {
    if (postId) {
      loadPost();
    }
  }, [loadPost, postId]);

  return {
    post,
    loading,
    error,
    reload: loadPost
  };
}

export function useCreatePost(config: UseNetworkConfig) {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPost = useCallback(async (postData: CreatePostRequest): Promise<PostResponse | null> => {
    try {
      setCreating(true);
      setError(null);
      const response = await config.client.createPost(postData);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post');
      return null;
    } finally {
      setCreating(false);
    }
  }, [config.client]);

  return {
    createPost,
    creating,
    error
  };
}

export function useDeletePost(config: UseNetworkConfig) {
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const deletePost = useCallback(async (postId: string): Promise<boolean> => {
    try {
      setDeleting(prev => ({ ...prev, [postId]: true }));
      setError(null);
      await config.client.deletePost(postId);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete post');
      return false;
    } finally {
      setDeleting(prev => ({ ...prev, [postId]: false }));
    }
  }, [config.client]);

  return {
    deletePost,
    deleting,
    error
  };
}

// =================== POST INTERACTION HOOKS ===================

export function usePostInteractions(config: UseNetworkConfig) {
  const [liking, setLiking] = useState<Record<string, boolean>>({});
  const [bookmarking, setBookmarking] = useState<Record<string, boolean>>({});

  const toggleLike = useCallback(async (postId: string, currentlyLiked: boolean) => {
    try {
      setLiking(prev => ({ ...prev, [postId]: true }));
      
      if (currentlyLiked) {
        return await config.client.unlikePost(postId);
      } else {
        return await config.client.likePost(postId);
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to toggle like');
    } finally {
      setLiking(prev => ({ ...prev, [postId]: false }));
    }
  }, [config.client]);

  const toggleBookmark = useCallback(async (postId: string, currentlyBookmarked: boolean) => {
    try {
      setBookmarking(prev => ({ ...prev, [postId]: true }));
      
      if (currentlyBookmarked) {
        return await config.client.unbookmarkPost(postId);
      } else {
        return await config.client.bookmarkPost(postId);
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to toggle bookmark');
    } finally {
      setBookmarking(prev => ({ ...prev, [postId]: false }));
    }
  }, [config.client]);

  return {
    toggleLike,
    toggleBookmark,
    liking,
    bookmarking
  };
}

// =================== COMMENTS HOOKS ===================

export function useComments(postId: string, config: UseNetworkConfig) {
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();

  const loadComments = useCallback(async (isRefresh = false) => {
    try {
      setLoading(true);
      const cursor = isRefresh ? undefined : nextCursor;
      const response = await config.client.getComments(postId, cursor);
      
      if (isRefresh) {
        setComments(response.items);
      } else {
        setComments(prev => [...prev, ...response.items]);
      }
      
      setNextCursor(response.nextCursor);
      setHasMore(response.hasMore);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [config.client, postId, nextCursor]);

  const createComment = useCallback(async (content: string) => {
    try {
      const newComment = await config.client.createComment(postId, content);
      setComments(prev => [newComment, ...prev]);
      return newComment;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create comment');
    }
  }, [config.client, postId]);

  const deleteComment = useCallback(async (commentId: string) => {
    try {
      await config.client.deleteComment(commentId);
      setComments(prev => prev.filter(comment => comment.id !== commentId));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete comment');
    }
  }, [config.client]);

  useEffect(() => {
    if (postId) {
      loadComments(true);
    }
  }, [postId, config.client]);

  return {
    comments,
    loading,
    error,
    hasMore,
    loadMore: () => loadComments(false),
    createComment,
    deleteComment
  };
}

// =================== MEDIA HOOKS ===================

export function useMediaUpload(config: UseNetworkConfig) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadMedia = useCallback(async (file: File) => {
    try {
      setUploading(true);
      setError(null);
      setProgress(0);
      
      // Note: This is a simplified version
      // In a real implementation, you'd want to track upload progress
      const response = await config.client.uploadMedia(file);
      setProgress(100);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload media');
      return null;
    } finally {
      setUploading(false);
    }
  }, [config.client]);

  return {
    uploadMedia,
    uploading,
    progress,
    error
  };
}

// =================== USER CONTENT HOOKS ===================

export function useUserPosts(config: UseNetworkConfig) {
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();

  const loadUserPosts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await config.client.getUserPosts();
      setPosts(response.items);
      setNextCursor(response.nextCursor);
      setHasMore(response.hasMore);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user posts');
    } finally {
      setLoading(false);
    }
  }, [config.client]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;

    try {
      const response = await config.client.getUserPosts(nextCursor);
      setPosts(prev => [...prev, ...response.items]);
      setNextCursor(response.nextCursor);
      setHasMore(response.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more posts');
    }
  }, [config.client, nextCursor, hasMore, loading]);

  useEffect(() => {
    loadUserPosts();
  }, [loadUserPosts]);

  return {
    posts,
    loading,
    error,
    hasMore,
    loadMore,
    refresh: loadUserPosts
  };
}

export function useBookmarks(config: UseNetworkConfig) {
  const [bookmarks, setBookmarks] = useState<PostResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();

  const loadBookmarks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await config.client.getUserBookmarks();
      setBookmarks(response.items);
      setNextCursor(response.nextCursor);
      setHasMore(response.hasMore);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  }, [config.client]);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  return {
    bookmarks,
    loading,
    error,
    hasMore,
    refresh: loadBookmarks
  };
}

// =================== ADMIN HOOKS ===================

export function useAdminStats(config: UseNetworkConfig) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await config.client.getAdminStats();
      setStats(response);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin stats');
    } finally {
      setLoading(false);
    }
  }, [config.client]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    refresh: loadStats
  };
}

// =================== UTILITY HOOKS ===================

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  return [storedValue, setValue] as const;
}

// =================== HIGHER-ORDER HOOKS ===================

export function useInfiniteScroll(
  loadMore: () => Promise<void>,
  hasMore: boolean,
  loading: boolean
) {
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop !== 
        document.documentElement.offsetHeight ||
        loading ||
        !hasMore
      ) {
        return;
      }
      loadMore();
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore, hasMore, loading]);
}

// Post type utilities
export function usePostTypeFilter() {
  const [selectedTypes, setSelectedTypes] = useState<PostType[]>([]);

  const toggleType = useCallback((type: PostType) => {
    setSelectedTypes(prev => 
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  }, []);

  const clearTypes = useCallback(() => {
    setSelectedTypes([]);
  }, []);

  return {
    selectedTypes,
    toggleType,
    clearTypes,
    hasFilters: selectedTypes.length > 0
  };
}
