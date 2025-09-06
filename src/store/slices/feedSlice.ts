import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Post, CreatePostRequest } from '@/types/post';
import { RootState } from '../store';

interface FeedState {
  posts: Post[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
  total: number;
  creating: boolean;
  updating: boolean;
  deleting: string | null; // postId being deleted
  lastFetchTime: number;
  currentScope: 'global' | 'college' | 'following';
  currentSearch: string;
  cache: Record<string, { posts: Post[]; timestamp: number; total: number; hasMore: boolean }>;
}

const initialState: FeedState = {
  posts: [],
  loading: false,
  error: null,
  hasMore: true,
  page: 1,
  total: 0,
  creating: false,
  updating: false,
  deleting: null,
  lastFetchTime: 0,
  currentScope: 'global',
  currentSearch: '',
  cache: {},
};

// Async thunks
export const fetchFeedPosts = createAsyncThunk(
  'feed/fetchPosts',
  async ({ page = 1, limit = 20, refresh = false, scope = 'global', search }: { page?: number; limit?: number; refresh?: boolean; scope?: 'global' | 'college' | 'following'; search?: string } = {}, { getState }) => {
    const { networkApi } = await import('@/lib/networkApi');
    
    try {
      // Calculate offset for pagination
      const offset = refresh ? 0 : (page - 1) * limit;
      const response = await networkApi.getFeed({ scope, limit, search });
      
      return { 
        posts: response.items || [], 
        total: response.total || 0, 
        hasMore: (response.items?.length || 0) === limit && (offset + limit) < (response.total || 0),
        page, 
        refresh,
        scope,
        search
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch feed posts');
    }
  }
);

export const createPostThunk = createAsyncThunk(
  'feed/createPost',
  async (postData: CreatePostRequest) => {
    const { networkApi } = await import('@/lib/networkApi');
    
    try {
      const response = await networkApi.createPost(postData);
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create post');
    }
  }
);

export const updatePostThunk = createAsyncThunk(
  'feed/updatePost',
  async ({ postId, postData }: { postId: string; postData: Partial<CreatePostRequest> }) => {
    const baseUrl = process.env.NEXT_PUBLIC_NETWORK_API_BASE_URL || 'http://localhost:4005';
    const response = await fetch(`${baseUrl}/v1/posts/${postId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        // Add auth header when available
      },
      body: JSON.stringify(postData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to update post');
    }
    
    return await response.json();
  }
);

export const deletePostThunk = createAsyncThunk(
  'feed/deletePost',
  async (postId: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_NETWORK_API_BASE_URL || 'http://localhost:4005';
    const response = await fetch(`${baseUrl}/v1/posts/${postId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        // Add auth header when available
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete post');
    }
    
    return postId;
  }
);

export const toggleLikeThunk = createAsyncThunk(
  'feed/toggleLike',
  async (postId: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_NETWORK_API_BASE_URL || 'http://localhost:4005';
    const response = await fetch(`${baseUrl}/v1/posts/${postId}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add auth header when available
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to toggle like');
    }
    
    const result = await response.json();
    return { postId, ...result };
  }
);

export const sharePostThunk = createAsyncThunk(
  'feed/sharePost',
  async ({ postId, content }: { postId: string; content?: string }) => {
    const baseUrl = process.env.NEXT_PUBLIC_NETWORK_API_BASE_URL || 'http://localhost:4005';
    const response = await fetch(`${baseUrl}/v1/posts/${postId}/share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add auth header when available
      },
      body: JSON.stringify({ content })
    });
    
    if (!response.ok) {
      throw new Error('Failed to share post');
    }
    
    return await response.json();
  }
);

export const uploadMediaThunk = createAsyncThunk(
  'feed/uploadMedia',
  async (files: File[]) => {
    const baseUrl = process.env.NEXT_PUBLIC_NETWORK_API_BASE_URL || 'http://localhost:4005';
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`file${index}`, file);
    });
    
    const response = await fetch(`${baseUrl}/v1/media/upload`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload media');
    }
    
    return await response.json();
  }
);

const feedSlice = createSlice({
  name: 'feed',
  initialState,
  reducers: {
    clearFeed: (state) => {
      state.posts = [];
      state.error = null;
      state.hasMore = true;
      state.page = 1;
      state.total = 0;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearCache: (state) => {
      state.cache = {};
    },
    updatePostInFeed: (state, action: PayloadAction<Post>) => {
      const index = state.posts.findIndex(post => post.id === action.payload.id);
      if (index !== -1) {
        state.posts[index] = { ...state.posts[index], ...action.payload };
        
        // Update cache as well
        const cacheKey = `${state.currentScope}_${state.currentSearch || 'all'}`;
        if (state.cache[cacheKey]) {
          const cacheIndex = state.cache[cacheKey].posts.findIndex(p => p.id === action.payload.id);
          if (cacheIndex !== -1) {
            state.cache[cacheKey].posts[cacheIndex] = { ...state.cache[cacheKey].posts[cacheIndex], ...action.payload };
          }
        }
      }
    },
    removePostFromFeed: (state, action: PayloadAction<string>) => {
      state.posts = state.posts.filter(post => post.id !== action.payload);
      state.total = Math.max(0, state.total - 1);
      
      // Update cache as well
      const cacheKey = `${state.currentScope}_${state.currentSearch || 'all'}`;
      if (state.cache[cacheKey]) {
        state.cache[cacheKey].posts = state.cache[cacheKey].posts.filter(p => p.id !== action.payload);
        state.cache[cacheKey].total = Math.max(0, state.cache[cacheKey].total - 1);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch feed posts
      .addCase(fetchFeedPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFeedPosts.fulfilled, (state, action) => {
        state.loading = false;
        const { posts, total, hasMore, page, refresh, scope, search } = action.payload;
        
        // Update current context
        state.currentScope = scope || 'global';
        state.currentSearch = search || '';
        state.lastFetchTime = Date.now();
        
        // Create cache key
        const cacheKey = `${scope || 'global'}_${search || 'all'}`;
        
        if (refresh || page === 1) {
          state.posts = posts;
          state.page = 1;
          // Update cache
          state.cache[cacheKey] = {
            posts: [...posts],
            timestamp: Date.now(),
            total,
            hasMore
          };
        } else {
          // Append new posts, avoiding duplicates
          const existingIds = new Set(state.posts.map((p: Post) => p.id));
          const newPosts = posts.filter((p: Post) => !existingIds.has(p.id));
          state.posts.push(...newPosts);
          state.page = page;
          
          // Update cache with all current posts
          state.cache[cacheKey] = {
            posts: [...state.posts],
            timestamp: Date.now(),
            total,
            hasMore
          };
        }
        
        state.total = total;
        state.hasMore = hasMore;
      })
      .addCase(fetchFeedPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch posts';
      })

      // Create post
      .addCase(createPostThunk.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createPostThunk.fulfilled, (state, action) => {
        state.creating = false;
        // Add new post to the beginning of the feed
        state.posts.unshift(action.payload);
        state.total += 1;
      })
      .addCase(createPostThunk.rejected, (state, action) => {
        state.creating = false;
        state.error = action.error.message || 'Failed to create post';
      })

      // Update post
      .addCase(updatePostThunk.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updatePostThunk.fulfilled, (state, action) => {
        state.updating = false;
        const index = state.posts.findIndex(post => post.id === action.payload.id);
        if (index !== -1) {
          state.posts[index] = action.payload;
        }
      })
      .addCase(updatePostThunk.rejected, (state, action) => {
        state.updating = false;
        state.error = action.error.message || 'Failed to update post';
      })

      // Delete post
      .addCase(deletePostThunk.pending, (state, action) => {
        state.deleting = action.meta.arg;
        state.error = null;
      })
      .addCase(deletePostThunk.fulfilled, (state, action) => {
        state.deleting = null;
        state.posts = state.posts.filter(post => post.id !== action.payload);
        state.total = Math.max(0, state.total - 1);
      })
      .addCase(deletePostThunk.rejected, (state, action) => {
        state.deleting = null;
        state.error = action.error.message || 'Failed to delete post';
      })

      // Toggle like
      .addCase(toggleLikeThunk.fulfilled, (state, action) => {
        const { postId, liked, likeCount } = action.payload;
        const post = state.posts.find(p => p.id === postId);
        if (post) {
          post.likedByMe = liked;
          post.likeCount = likeCount;
        }
      })

      // Share post
      .addCase(sharePostThunk.fulfilled, (state, action) => {
        // Add shared post to the beginning of the feed
        state.posts.unshift(action.payload);
        state.total += 1;
      });
  },
});

export const {
  clearFeed,
  clearError,
  clearCache,
  updatePostInFeed,
  removePostFromFeed,
} = feedSlice.actions;

// Selectors
export const selectFeedPosts = (state: RootState) => state.feed.posts;
export const selectFeedLoading = (state: RootState) => state.feed.loading;
export const selectFeedError = (state: RootState) => state.feed.error;
export const selectFeedHasMore = (state: RootState) => state.feed.hasMore;
export const selectFeedPage = (state: RootState) => state.feed.page;
export const selectFeedTotal = (state: RootState) => state.feed.total;
export const selectFeedCreating = (state: RootState) => state.feed.creating;
export const selectFeedUpdating = (state: RootState) => state.feed.updating;
export const selectFeedDeleting = (state: RootState) => state.feed.deleting;

export default feedSlice.reducer;
