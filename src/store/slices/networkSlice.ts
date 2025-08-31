import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { networkApi, type FeedScope } from '../../lib/networkApi';
import type { Profile } from '../../lib/profileApi';

export interface FeedItem {
  // Minimal shape; extend when backend shape stabilizes
  id?: string;
  authorId?: string;
  content?: string | null;
  createdAt?: string;
  [key: string]: any;
}

// Use simple types to avoid conflicts
export type UserEdgeItem = any;
export type SuggestionItem = any;

export interface UserDirectoryItem extends Profile {
  // Directory-specific fields
}

export type DirectoryRole = 'student' | 'faculty' | 'dept_admin' | 'head_admin' | 'placements_admin';

interface ScopeState {
  items: FeedItem[];
  nextCursor?: string;
  hasMore: boolean;
  loading: boolean;
  error?: string;
  initialized: boolean;
}

interface EdgeListState {
  items: UserEdgeItem[];
  nextCursor?: string;
  hasMore: boolean;
  loading: boolean;
  error?: string;
  initialized: boolean;
}

interface UserFollowerStats {
  followers: number;
  following: number;
  isFollowing: boolean; // whether current user follows this user
  followsMe: boolean;   // whether this user follows current user
  loading: boolean;
  error?: string;
}

interface NetworkState {
  activeScope: FeedScope;
  byScope: Record<FeedScope, ScopeState>;
  // Following relationships (client-side cache)
  followingById: Record<string, boolean>;
  followLoadingById: Record<string, boolean>;
  // Follower stats keyed by userId
  followerStatsById: Record<string, UserFollowerStats | undefined>;
  // Post interactions
  likeLoadingByPostId: Record<string, boolean>;
  bookmarkLoadingByPostId: Record<string, boolean>;
  // Bookmarks and trending feeds
  bookmarks: ScopeState;
  trending: ScopeState & { sinceDays?: number };
  // Followers/following lists per user
  followersListByUserId: Record<string, EdgeListState | undefined>;
  followingListByUserId: Record<string, EdgeListState | undefined>;
  // Suggestions
  suggestions: { items: SuggestionItem[]; loading: boolean; error?: string; initialized: boolean };
  // Public users directory
  directory: {
    items: UserDirectoryItem[];
    nextOffset: number;
    hasMore: boolean;
    loading: boolean;
    error?: string;
    initialized: boolean;
    q?: string;
    collegeId?: string;
    role?: DirectoryRole;
    department?: string;
    year?: number;
  };
}

const defaultScopeState: ScopeState = {
  items: [],
  nextCursor: undefined,
  hasMore: true,
  loading: false,
  error: undefined,
  initialized: false,
};

const defaultEdgeListState: EdgeListState = {
  items: [],
  nextCursor: undefined,
  hasMore: true,
  loading: false,
  error: undefined,
  initialized: false,
};

const initialState: NetworkState = {
  activeScope: 'college',
  byScope: {
    following: { ...defaultScopeState },
    college: { ...defaultScopeState },
    global: { ...defaultScopeState },
  },
  followingById: {},
  followLoadingById: {},
  followerStatsById: {},
  likeLoadingByPostId: {},
  bookmarkLoadingByPostId: {},
  bookmarks: { ...defaultScopeState },
  trending: { ...defaultScopeState, sinceDays: undefined },
  followersListByUserId: {},
  followingListByUserId: {},
  suggestions: { items: [], loading: false, error: undefined, initialized: false },
  directory: {
    items: [],
    nextOffset: 0,
    hasMore: true,
    loading: false,
    error: undefined,
    initialized: false,
    q: undefined,
    collegeId: undefined,
    role: undefined,
    department: undefined,
    year: undefined,
  },
};

export const fetchFeed = createAsyncThunk<
  { scope: FeedScope; items: FeedItem[]; nextCursor?: string; append: boolean },
  { scope?: FeedScope; cursor?: string; limit?: number; append?: boolean },
  { state: RootState }
>(
  'network/fetchFeed',
  async ({ scope = 'college', cursor, limit = 20, append }, _thunkApi) => {
    const { items, nextCursor } = await networkApi.listFeed<FeedItem>({ scope, cursor, limit });
    return { scope, items, nextCursor, append: !!append || !!cursor };
  },
  {
    condition: ({ scope = 'college' }, { getState }) => {
      const state = (getState() as RootState).network;
      const sc = state.byScope[scope];
      // Prevent duplicate in-flight requests for this scope
      return !sc.loading;
    },
  }
);

export const fetchUsersDirectory = createAsyncThunk<
  { items: UserDirectoryItem[]; nextOffset: number; hasMore: boolean; append: boolean },
  { offset?: number; limit?: number; q?: string; collegeId?: string; role?: DirectoryRole; department?: string; year?: number; append?: boolean },
  { state: RootState }
>(
  'network/fetchUsersDirectory',
  async ({ offset, limit = 20, q, collegeId, role, department, year, append }, { getState }) => {
    const st = (getState() as RootState).network;
    const effQ = q ?? st.directory.q;
    const effCollegeId = collegeId ?? st.directory.collegeId;
    const effRole = role ?? st.directory.role;
    const effDepartment = department ?? st.directory.department;
    const effYear = typeof year === 'number' ? year : st.directory.year;
    // Mock implementation - replace with actual API call when available
    const res = { users: [] as UserDirectoryItem[], nextOffset: 0, hasMore: false };
    return { items: res.users, nextOffset: res.nextOffset, hasMore: res.hasMore, append: !!append || !!offset };
  },
  {
    condition: (_args, { getState }) => {
      const d = (getState() as RootState).network.directory;
      return !d.loading;
    },
  }
);

// Fetch follower/following stats for a given user
export const fetchFollowerStats = createAsyncThunk<
  { userId: string; stats: { followers: number; following: number; isFollowing: boolean; followsMe: boolean } },
  { userId: string },
  { state: RootState }
>(
  'network/fetchFollowerStats',
  async ({ userId }) => {
    const res = await networkApi.fetchFollowerStats(userId);
    return { userId, stats: { followers: res.followers, following: res.following, isFollowing: res.isFollowing, followsMe: res.followsMe } };
  },
  {
    condition: ({ userId }, { getState }) => {
      const st = (getState() as RootState).network.followerStatsById[userId];
      return !st?.loading;
    },
  }
);

// Followers list for a user
export const fetchFollowers = createAsyncThunk<
  { userId: string; items: UserEdgeItem[]; nextCursor?: string; hasMore: boolean; append: boolean },
  { userId: string; cursor?: string; limit?: number; append?: boolean },
  { state: RootState }
>(
  'network/fetchFollowers',
  async ({ userId, cursor, limit = 20, append }) => {
    const res = await networkApi.listFollowers(userId, { cursor, limit });
    return { userId, items: res.items, nextCursor: res.nextCursor, hasMore: !!res.nextCursor && res.items.length > 0, append: !!append || !!cursor };
  },
  {
    condition: ({ userId }, { getState }) => {
      const st = (getState() as RootState).network.followersListByUserId[userId];
      return !st?.loading;
    },
  }
);

// Following list for a user
export const fetchFollowingList = createAsyncThunk<
  { userId: string; items: UserEdgeItem[]; nextCursor?: string; hasMore: boolean; append: boolean },
  { userId: string; cursor?: string; limit?: number; append?: boolean },
  { state: RootState }
>(
  'network/fetchFollowingList',
  async ({ userId, cursor, limit = 20, append }) => {
    const res = await networkApi.listFollowing(userId, { cursor, limit });
    return { userId, items: res.items, nextCursor: res.nextCursor, hasMore: !!res.nextCursor && res.items.length > 0, append: !!append || !!cursor };
  },
  {
    condition: ({ userId }, { getState }) => {
      const st = (getState() as RootState).network.followingListByUserId[userId];
      return !st?.loading;
    },
  }
);

// Suggestions
export const fetchSuggestions = createAsyncThunk<
  { items: SuggestionItem[] },
  { limit?: number } | void,
  { state: RootState }
>(
  'network/fetchSuggestions',
  async (args) => {
    const limit = args?.limit ?? 10;
    const res = await networkApi.listSuggestions({ limit });
    return { items: res.items };
  },
  {
    condition: (_args, { getState }) => {
      const st = (getState() as RootState).network.suggestions;
      return !st.loading;
    },
  }
);

// Bookmarks feed
export const fetchBookmarks = createAsyncThunk<
  { items: FeedItem[]; nextCursor?: string; hasMore: boolean; append: boolean },
  { cursor?: string; limit?: number; append?: boolean },
  { state: RootState }
>(
  'network/fetchBookmarks',
  async ({ cursor, limit = 20, append }) => {
    const res = await networkApi.listBookmarks({ cursor, limit });
    return { items: res.items, nextCursor: res.nextCursor, hasMore: !!res.nextCursor && res.items.length > 0, append: !!append || !!cursor };
  },
  {
    condition: (_args, { getState }) => {
      const st = (getState() as RootState).network.bookmarks;
      return !st.loading;
    },
  }
);

// Trending feed
export const fetchTrending = createAsyncThunk<
  { items: FeedItem[]; nextCursor?: string; hasMore: boolean; append: boolean; sinceDays?: number },
  { sinceDays?: number; cursor?: string; limit?: number; append?: boolean },
  { state: RootState }
>(
  'network/fetchTrending',
  async ({ sinceDays, cursor, limit = 20, append }) => {
    const res = await networkApi.listTrending({ sinceDays, cursor, limit });
    return { items: res.items, nextCursor: res.nextCursor, hasMore: !!res.nextCursor && res.items.length > 0, append: !!append || !!cursor, sinceDays };
  },
  {
    condition: (_args, { getState }) => {
      const st = (getState() as RootState).network.trending;
      return !st.loading;
    },
  }
);

// Follow a user (optimistic client cache)
export const followUser = createAsyncThunk<
  { userId: string; acted: boolean },
  { userId: string },
  { state: RootState }
>(
  'network/followUser',
  async ({ userId }) => {
    const res = await networkApi.follow(userId);
    return { userId, acted: !!res.followed };
  },
  {
    condition: ({ userId }, { getState }) => {
      const st = (getState() as RootState).network;
      if (st.followLoadingById[userId]) return false;
      if (st.followingById[userId]) return false;
      return true;
    },
  }
);

// Unfollow a user (optimistic client cache)
export const unfollowUser = createAsyncThunk<
  { userId: string; acted: boolean },
  { userId: string },
  { state: RootState }
>(
  'network/unfollowUser',
  async ({ userId }) => {
    const res = await networkApi.unfollow(userId);
    return { userId, acted: !!res.deleted };
  },
  {
    condition: ({ userId }, { getState }) => {
      const st = (getState() as RootState).network;
      if (st.followLoadingById[userId]) return false;
      // allow unfollow even if local cache says not following, to reconcile
      return true;
    },
  }
);

// Create a post
export const createPost = createAsyncThunk<
  FeedItem,
  { content: string; visibility?: 'PUBLIC' | 'COLLEGE'; type?: 'STANDARD' | 'BADGE_AWARD' | 'SHARE'; mediaIds?: string[]; tags?: string[]; links?: Array<{ url: string; title?: string }> }
>(
  'network/createPost',
  async ({ content, visibility = 'COLLEGE', type = 'STANDARD', mediaIds, tags, links }) => {
    const res = await networkApi.createPost({ content, visibility, type, mediaIds, tags, links });
    return res as unknown as FeedItem;
  }
);

// Update a post
export const updatePost = createAsyncThunk<
  { postId: string; content: string; visibility: string; type: string },
  { postId: string; content: string; visibility?: 'PUBLIC' | 'COLLEGE'; type?: 'STANDARD' | 'BADGE_AWARD' | 'SHARE' }
>(
  'network/updatePost',
  async ({ postId, content, visibility, type }) => {
    const res = await networkApi.updatePost(postId, { content, visibility, type });
    return { postId, ...res };
  }
);

// Delete a post
export const deletePost = createAsyncThunk<
  { postId: string; deleted: boolean },
  { postId: string }
>(
  'network/deletePost',
  async ({ postId }) => {
    const res = await networkApi.deletePost(postId);
    return { postId, deleted: res.deleted };
  }
);

// Like a post
export const likePost = createAsyncThunk<
  { postId: string; likeCount: number; acted: boolean },
  { postId: string },
  { state: RootState }
>(
  'network/likePost',
  async ({ postId }) => {
    const res = await networkApi.likePost(postId);
    return { postId, likeCount: res.likeCount, acted: !!res.liked };
  },
  {
    condition: ({ postId }, { getState }) => {
      const st = (getState() as RootState).network;
      return !st.likeLoadingByPostId[postId];
    },
  }
);

// Unlike a post
export const unlikePost = createAsyncThunk<
  { postId: string; likeCount: number; acted: boolean },
  { postId: string },
  { state: RootState }
>(
  'network/unlikePost',
  async ({ postId }) => {
    const res = await networkApi.unlikePost(postId);
    return { postId, likeCount: res.likeCount, acted: !!res.unliked };
  },
  {
    condition: ({ postId }, { getState }) => {
      const st = (getState() as RootState).network;
      return !st.likeLoadingByPostId[postId];
    },
  }
);

// Bookmark a post
export const bookmarkPost = createAsyncThunk<
  { postId: string; acted: boolean },
  { postId: string },
  { state: RootState }
>(
  'network/bookmarkPost',
  async ({ postId }) => {
    const res = await networkApi.bookmarkPost(postId);
    return { postId, acted: !!res.bookmarked };
  },
  {
    condition: ({ postId }, { getState }) => {
      const st = (getState() as RootState).network;
      return !st.bookmarkLoadingByPostId[postId];
    },
  }
);

// Remove bookmark
export const unbookmarkPost = createAsyncThunk<
  { postId: string; acted: boolean },
  { postId: string },
  { state: RootState }
>(
  'network/unbookmarkPost',
  async ({ postId }) => {
    const res = await networkApi.unbookmarkPost(postId);
    return { postId, acted: !!res.unbookmarked };
  },
  {
    condition: ({ postId }, { getState }) => {
      const st = (getState() as RootState).network;
      return !st.bookmarkLoadingByPostId[postId];
    },
  }
);

const networkSlice = createSlice({
  name: 'network',
  initialState,
  reducers: {
    setActiveScope(state, action: PayloadAction<FeedScope>) {
      state.activeScope = action.payload;
    },
    resetScope(state, action: PayloadAction<FeedScope | undefined>) {
      const scope = action.payload ?? state.activeScope;
      state.byScope[scope] = { ...defaultScopeState };
    },
    clearNetworkError(state, action: PayloadAction<FeedScope | undefined>) {
      const scope = action.payload ?? state.activeScope;
      state.byScope[scope].error = undefined;
    },
    // directory controls
    setDirectoryQuery(state, action: PayloadAction<string | undefined>) {
      state.directory.q = action.payload?.trim() || undefined;
    },
    setDirectoryCollege(state, action: PayloadAction<string | undefined>) {
      state.directory.collegeId = action.payload?.trim() || undefined;
    },
    setDirectoryRole(state, action: PayloadAction<DirectoryRole | undefined>) {
      state.directory.role = action.payload;
    },
    setDirectoryDepartment(state, action: PayloadAction<string | undefined>) {
      state.directory.department = action.payload?.trim() || undefined;
    },
    setDirectoryYear(state, action: PayloadAction<number | undefined>) {
      state.directory.year = typeof action.payload === 'number' ? action.payload : undefined;
    },
    resetDirectory(state) {
      state.directory = {
        items: [],
        nextOffset: 0,
        hasMore: true,
        loading: false,
        error: undefined,
        initialized: false,
        q: state.directory.q,
        collegeId: state.directory.collegeId,
        role: state.directory.role,
        department: state.directory.department,
        year: state.directory.year,
      };
    },
    // Update post comment count locally after creating/deleting a comment
    incrementPostCommentCount(state, action: PayloadAction<{ postId: string; delta?: number }>) {
      const { postId, delta = 1 } = action.payload;
      (['following','college','global'] as FeedScope[]).forEach((s) => {
        const idx = state.byScope[s].items.findIndex((it) => it.id === postId);
        if (idx >= 0) {
          const curr = state.byScope[s].items[idx].commentCount || 0;
          state.byScope[s].items[idx].commentCount = Math.max(0, curr + delta);
        }
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeed.pending, (state, action) => {
        const scope = action.meta.arg.scope ?? 'college';
        state.byScope[scope].loading = true;
        state.byScope[scope].error = undefined;
      })
      .addCase(fetchFeed.fulfilled, (state, action) => {
        const { scope, items, nextCursor, append } = action.payload;
        const sc = state.byScope[scope];
        sc.loading = false;
        sc.initialized = true;
        if (append) sc.items = [...sc.items, ...items];
        else sc.items = items;
        sc.nextCursor = nextCursor;
        sc.hasMore = !!nextCursor && items.length > 0;
      })
      .addCase(fetchFeed.rejected, (state, action) => {
        const scope = action.meta.arg.scope ?? 'college';
        const sc = state.byScope[scope];
        sc.loading = false;
        sc.initialized = true;
        sc.error = action.error.message || 'Failed to load network feed';
      })
      // create post
      .addCase(createPost.fulfilled, (state, action) => {
        const post = action.payload;
        // Prepend into relevant scopes based on visibility
        const vis = (post.visibility as string) || 'COLLEGE';
        if (vis === 'COLLEGE') {
          state.byScope.college.items = [post, ...state.byScope.college.items];
        } else if (vis === 'PUBLIC') {
          state.byScope.global.items = [post, ...state.byScope.global.items];
        }
      })
      // directory
      .addCase(fetchUsersDirectory.pending, (state) => {
        state.directory.loading = true;
        state.directory.error = undefined;
      })
      .addCase(fetchUsersDirectory.fulfilled, (state, action) => {
        const { items, nextOffset, hasMore, append } = action.payload;
        state.directory.loading = false;
        state.directory.initialized = true;
        state.directory.items = append ? [...state.directory.items, ...items] : items;
        state.directory.nextOffset = nextOffset;
        state.directory.hasMore = hasMore;
      })
      .addCase(fetchUsersDirectory.rejected, (state, action) => {
        state.directory.loading = false;
        state.directory.initialized = true;
        state.directory.error = action.error.message || 'Failed to load users';
      })
      // followers list
      .addCase(fetchFollowers.pending, (state, action) => {
        const { userId } = action.meta.arg;
        const existing = state.followersListByUserId[userId] ?? { ...defaultEdgeListState };
        state.followersListByUserId[userId] = { ...existing, loading: true, error: undefined };
      })
      .addCase(fetchFollowers.fulfilled, (state, action) => {
        const { userId, items, nextCursor, hasMore, append } = action.payload;
        const list = state.followersListByUserId[userId] ?? { ...defaultEdgeListState };
        list.loading = false;
        list.initialized = true;
        list.items = append ? [...list.items, ...items] : items;
        list.nextCursor = nextCursor;
        list.hasMore = hasMore;
        state.followersListByUserId[userId] = list;
      })
      .addCase(fetchFollowers.rejected, (state, action) => {
        const { userId } = action.meta.arg;
        const list = state.followersListByUserId[userId] ?? { ...defaultEdgeListState };
        list.loading = false;
        list.initialized = true;
        list.error = action.error.message || 'Failed to load followers';
        state.followersListByUserId[userId] = list;
      })
      // following list
      .addCase(fetchFollowingList.pending, (state, action) => {
        const { userId } = action.meta.arg;
        const existing = state.followingListByUserId[userId] ?? { ...defaultEdgeListState };
        state.followingListByUserId[userId] = { ...existing, loading: true, error: undefined };
      })
      .addCase(fetchFollowingList.fulfilled, (state, action) => {
        const { userId, items, nextCursor, hasMore, append } = action.payload;
        const list = state.followingListByUserId[userId] ?? { ...defaultEdgeListState };
        list.loading = false;
        list.initialized = true;
        list.items = append ? [...list.items, ...items] : items;
        list.nextCursor = nextCursor;
        list.hasMore = hasMore;
        state.followingListByUserId[userId] = list;
      })
      .addCase(fetchFollowingList.rejected, (state, action) => {
        const { userId } = action.meta.arg;
        const list = state.followingListByUserId[userId] ?? { ...defaultEdgeListState };
        list.loading = false;
        list.initialized = true;
        list.error = action.error.message || 'Failed to load following';
        state.followingListByUserId[userId] = list;
      })
      // suggestions
      .addCase(fetchSuggestions.pending, (state) => {
        state.suggestions.loading = true;
        state.suggestions.error = undefined;
      })
      .addCase(fetchSuggestions.fulfilled, (state, action) => {
        state.suggestions.loading = false;
        state.suggestions.initialized = true;
        state.suggestions.items = action.payload.items;
      })
      .addCase(fetchSuggestions.rejected, (state, action) => {
        state.suggestions.loading = false;
        state.suggestions.initialized = true;
        state.suggestions.error = action.error.message || 'Failed to load suggestions';
      })
      // bookmarks
      .addCase(fetchBookmarks.pending, (state) => {
        state.bookmarks.loading = true;
        state.bookmarks.error = undefined;
      })
      .addCase(fetchBookmarks.fulfilled, (state, action) => {
        const { items, nextCursor, hasMore, append } = action.payload;
        state.bookmarks.loading = false;
        state.bookmarks.initialized = true;
        state.bookmarks.items = append ? [...state.bookmarks.items, ...items] : items;
        state.bookmarks.nextCursor = nextCursor;
        state.bookmarks.hasMore = hasMore;
      })
      .addCase(fetchBookmarks.rejected, (state, action) => {
        state.bookmarks.loading = false;
        state.bookmarks.initialized = true;
        state.bookmarks.error = action.error.message || 'Failed to load bookmarks';
      })
      // trending
      .addCase(fetchTrending.pending, (state) => {
        state.trending.loading = true;
        state.trending.error = undefined;
      })
      .addCase(fetchTrending.fulfilled, (state, action) => {
        const { items, nextCursor, hasMore, append, sinceDays } = action.payload;
        state.trending.loading = false;
        state.trending.initialized = true;
        state.trending.items = append ? [...state.trending.items, ...items] : items;
        state.trending.nextCursor = nextCursor;
        state.trending.hasMore = hasMore;
        state.trending.sinceDays = sinceDays;
      })
      .addCase(fetchTrending.rejected, (state, action) => {
        state.trending.loading = false;
        state.trending.initialized = true;
        state.trending.error = action.error.message || 'Failed to load trending';
      })
      // follower stats
      .addCase(fetchFollowerStats.pending, (state, action) => {
        const { userId } = action.meta.arg;
        const existing = state.followerStatsById[userId];
        state.followerStatsById[userId] = {
          followers: existing?.followers ?? 0,
          following: existing?.following ?? 0,
          isFollowing: existing?.isFollowing ?? false,
          followsMe: existing?.followsMe ?? false,
          loading: true,
          error: undefined,
        };
      })
      .addCase(fetchFollowerStats.fulfilled, (state, action) => {
        const { userId, stats } = action.payload;
        state.followerStatsById[userId] = {
          followers: stats.followers,
          following: stats.following,
          isFollowing: stats.isFollowing,
          followsMe: stats.followsMe,
          loading: false,
          error: undefined,
        };
        // Sync following map with server truth
        state.followingById[userId] = !!stats.isFollowing;
      })
      .addCase(fetchFollowerStats.rejected, (state, action) => {
        const { userId } = action.meta.arg;
        const existing = state.followerStatsById[userId];
        if (existing) {
          existing.loading = false;
          existing.error = action.error.message || 'Failed to load follower stats';
        } else {
          state.followerStatsById[userId] = {
            followers: 0,
            following: 0,
            isFollowing: false,
            followsMe: false,
            loading: false,
            error: action.error.message || 'Failed to load follower stats',
          };
        }
      })
      // follow
      .addCase(followUser.pending, (state, action) => {
        const userId = action.meta.arg.userId;
        state.followLoadingById[userId] = true;
      })
      .addCase(followUser.fulfilled, (state, action) => {
        const { userId, acted } = action.payload;
        state.followLoadingById[userId] = false;
        state.followingById[userId] = true;
        const s = state.followerStatsById[userId];
        if (s) {
          s.isFollowing = true;
          if (acted) s.followers = Math.max(0, (s.followers || 0) + 1);
        }
      })
      .addCase(followUser.rejected, (state, action) => {
        const userId = action.meta.arg.userId;
        state.followLoadingById[userId] = false;
      })
      // unfollow
      .addCase(unfollowUser.pending, (state, action) => {
        const userId = action.meta.arg.userId;
        state.followLoadingById[userId] = true;
      })
      .addCase(unfollowUser.fulfilled, (state, action) => {
        const { userId, acted } = action.payload;
        state.followLoadingById[userId] = false;
        state.followingById[userId] = false;
        const s = state.followerStatsById[userId];
        if (s) {
          s.isFollowing = false;
          if (acted) s.followers = Math.max(0, (s.followers || 0) - 1);
        }
      })
      .addCase(unfollowUser.rejected, (state, action) => {
        const userId = action.meta.arg.userId;
        state.followLoadingById[userId] = false;
      })
      // like/unlike
      .addCase(likePost.pending, (state, action) => {
        const { postId } = action.meta.arg;
        state.likeLoadingByPostId[postId] = true;
      })
      .addCase(likePost.fulfilled, (state, action) => {
        const { postId, likeCount } = action.payload;
        state.likeLoadingByPostId[postId] = false;
        (['following','college','global'] as FeedScope[]).forEach((s) => {
          const idx = state.byScope[s].items.findIndex((it) => it.id === postId);
          if (idx >= 0) {
            state.byScope[s].items[idx].likeCount = likeCount;
            state.byScope[s].items[idx].likedByMe = true;
          }
        });
      })
      .addCase(likePost.rejected, (state, action) => {
        const { postId } = action.meta.arg;
        state.likeLoadingByPostId[postId] = false;
      })
      .addCase(unlikePost.pending, (state, action) => {
        const { postId } = action.meta.arg;
        state.likeLoadingByPostId[postId] = true;
      })
      .addCase(unlikePost.fulfilled, (state, action) => {
        const { postId, likeCount } = action.payload;
        state.likeLoadingByPostId[postId] = false;
        (['following','college','global'] as FeedScope[]).forEach((s) => {
          const idx = state.byScope[s].items.findIndex((it) => it.id === postId);
          if (idx >= 0) {
            state.byScope[s].items[idx].likeCount = likeCount;
            state.byScope[s].items[idx].likedByMe = false;
          }
        });
      })
      .addCase(unlikePost.rejected, (state, action) => {
        const { postId } = action.meta.arg;
        state.likeLoadingByPostId[postId] = false;
      })
      // bookmark/unbookmark
      .addCase(bookmarkPost.pending, (state, action) => {
        const { postId } = action.meta.arg;
        state.bookmarkLoadingByPostId[postId] = true;
      })
      .addCase(bookmarkPost.fulfilled, (state, action) => {
        const { postId } = action.payload;
        state.bookmarkLoadingByPostId[postId] = false;
        (['following','college','global'] as FeedScope[]).forEach((s) => {
          const idx = state.byScope[s].items.findIndex((it) => it.id === postId);
          if (idx >= 0) state.byScope[s].items[idx].bookmarkedByMe = true;
        });
      })
      .addCase(bookmarkPost.rejected, (state, action) => {
        const { postId } = action.meta.arg;
        state.bookmarkLoadingByPostId[postId] = false;
      })
      .addCase(unbookmarkPost.pending, (state, action) => {
        const { postId } = action.meta.arg;
        state.bookmarkLoadingByPostId[postId] = true;
      })
      .addCase(unbookmarkPost.fulfilled, (state, action) => {
        const { postId } = action.payload;
        state.bookmarkLoadingByPostId[postId] = false;
        (['following','college','global'] as FeedScope[]).forEach((s) => {
          const idx = state.byScope[s].items.findIndex((it) => it.id === postId);
          if (idx >= 0) state.byScope[s].items[idx].bookmarkedByMe = false;
        });
      })
      // update post
      .addCase(updatePost.fulfilled, (state, action) => {
        const { postId, content, visibility, type } = action.payload;
        (['following','college','global'] as FeedScope[]).forEach((s) => {
          const idx = state.byScope[s].items.findIndex((it) => it.id === postId);
          if (idx >= 0) {
            state.byScope[s].items[idx].content = content;
            state.byScope[s].items[idx].visibility = visibility;
            state.byScope[s].items[idx].type = type;
          }
        });
      })
      // delete post
      .addCase(deletePost.fulfilled, (state, action) => {
        const { postId } = action.payload;
        (['following','college','global'] as FeedScope[]).forEach((s) => {
          state.byScope[s].items = state.byScope[s].items.filter((it) => it.id !== postId);
        });
      })
      .addCase(unbookmarkPost.rejected, (state, action) => {
        const { postId } = action.meta.arg;
        state.bookmarkLoadingByPostId[postId] = false;
      });
  },
});

// Selectors
export const selectActiveScope = (state: RootState) => state.network.activeScope;
export const selectScopeState = (state: RootState, scope?: FeedScope) => state.network.byScope[scope ?? state.network.activeScope];
export const selectFeedItems = (state: RootState, scope?: FeedScope) => selectScopeState(state, scope).items;
export const selectFeedLoading = (state: RootState, scope?: FeedScope) => selectScopeState(state, scope).loading;
export const selectFeedError = (state: RootState, scope?: FeedScope) => selectScopeState(state, scope).error;
export const selectFeedHasMore = (state: RootState, scope?: FeedScope) => selectScopeState(state, scope).hasMore;
export const selectFeedNextCursor = (state: RootState, scope?: FeedScope) => selectScopeState(state, scope).nextCursor;
export const selectFeedInitialized = (state: RootState, scope?: FeedScope) => selectScopeState(state, scope).initialized;
// Following selectors
export const selectFollowingMap = (state: RootState) => state.network.followingById;
export const selectFollowLoadingMap = (state: RootState) => state.network.followLoadingById;
// Post interactions
export const selectLikeLoadingMap = (state: RootState) => state.network.likeLoadingByPostId;
export const selectBookmarkLoadingMap = (state: RootState) => state.network.bookmarkLoadingByPostId;
// Directory selectors
export const selectDirectoryItems = (state: RootState) => state.network.directory.items;
export const selectDirectoryLoading = (state: RootState) => state.network.directory.loading;
export const selectDirectoryError = (state: RootState) => state.network.directory.error;
export const selectDirectoryHasMore = (state: RootState) => state.network.directory.hasMore;
export const selectDirectoryNextOffset = (state: RootState) => state.network.directory.nextOffset;
export const selectDirectoryInitialized = (state: RootState) => state.network.directory.initialized;
export const selectDirectoryQuery = (state: RootState) => state.network.directory.q;
export const selectDirectoryCollegeId = (state: RootState) => state.network.directory.collegeId;
export const selectDirectoryRole = (state: RootState) => state.network.directory.role;
export const selectDirectoryDepartment = (state: RootState) => state.network.directory.department;
export const selectDirectoryYear = (state: RootState) => state.network.directory.year;
// Followers/following selectors
export const selectFollowersList = (state: RootState, userId: string) => state.network.followersListByUserId[userId];
export const selectFollowingList = (state: RootState, userId: string) => state.network.followingListByUserId[userId];
// Suggestions selectors
export const selectSuggestions = (state: RootState) => state.network.suggestions;
// Bookmarks selectors
export const selectBookmarksItems = (state: RootState) => state.network.bookmarks.items;
export const selectBookmarksLoading = (state: RootState) => state.network.bookmarks.loading;
export const selectBookmarksError = (state: RootState) => state.network.bookmarks.error;
export const selectBookmarksHasMore = (state: RootState) => state.network.bookmarks.hasMore;
export const selectBookmarksNextCursor = (state: RootState) => state.network.bookmarks.nextCursor;
export const selectBookmarksInitialized = (state: RootState) => state.network.bookmarks.initialized;
// Trending selectors
export const selectTrendingItems = (state: RootState) => state.network.trending.items;
export const selectTrendingLoading = (state: RootState) => state.network.trending.loading;
export const selectTrendingError = (state: RootState) => state.network.trending.error;
export const selectTrendingHasMore = (state: RootState) => state.network.trending.hasMore;
export const selectTrendingNextCursor = (state: RootState) => state.network.trending.nextCursor;
export const selectTrendingInitialized = (state: RootState) => state.network.trending.initialized;
export const selectTrendingSinceDays = (state: RootState) => state.network.trending.sinceDays;

// Follower stats selectors
export const selectFollowerStatsById = (state: RootState, userId: string) => state.network.followerStatsById[userId];

// Actions
export const { setActiveScope, resetScope, clearNetworkError, setDirectoryQuery, setDirectoryCollege, setDirectoryRole, setDirectoryDepartment, setDirectoryYear, resetDirectory, incrementPostCommentCount } = networkSlice.actions;

export default networkSlice.reducer;
