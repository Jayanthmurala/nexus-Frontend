import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { networkApi, User, NetworkStats, DirectoryResponse, FollowSuggestion, SuggestionsResponse, ConnectionsResponse } from '../../lib/networkApi';

// Enhanced User interface for network slice
export interface NetworkUser extends User {
  roles?: string[];
  collegeName?: string;
  collegeMemberId?: string;
  year?: number;
  followersCount?: number;
  followingCount?: number;
  bio?: string;
}

export interface NetworkState {
  // User directory
  users: NetworkUser[];
  totalUsers: number;
  currentPage: number;
  totalPages: number;
  isLoadingUsers: boolean;
  
  // Network stats
  stats: NetworkStats | null;
  isLoadingStats: boolean;
  
  // Follow suggestions
  suggestions: FollowSuggestion[];
  isLoadingSuggestions: boolean;
  
  // User connections
  connections: NetworkUser[];
  isLoadingConnections: boolean;
  
  // Search and filters
  searchQuery: string;
  collegeFilter: string;
  
  // Follow operations
  followLoading: Record<string, boolean>;
  
  // Error handling
  error: string | null;
}

const initialState: NetworkState = {
  users: [],
  totalUsers: 0,
  currentPage: 1,
  totalPages: 1,
  isLoadingUsers: false,
  
  stats: null,
  isLoadingStats: false,
  
  suggestions: [],
  isLoadingSuggestions: false,
  
  connections: [],
  isLoadingConnections: false,
  
  searchQuery: '',
  collegeFilter: 'all',
  
  followLoading: {},
  
  error: null,
};

// Async thunks
export const fetchUsersDirectory = createAsyncThunk(
  'network/fetchUsersDirectory',
  async (params: {
    page?: number;
    limit?: number;
    search?: string;
    college?: string;
  } = {}) => {
    const response = await networkApi.getUserDirectory(
      params.limit || 20,
      ((params.page || 1) - 1) * (params.limit || 20)
    );
    return response;
  }
);

export const fetchNetworkStats = createAsyncThunk(
  'network/fetchNetworkStats',
  async (userId: string) => {
    const response = await networkApi.getNetworkStats(userId);
    return response;
  }
);

export const fetchFollowSuggestions = createAsyncThunk(
  'network/fetchFollowSuggestions',
  async (limit: number = 10) => {
    const response = await networkApi.getFollowSuggestions(limit);
    return response;
  }
);

export const fetchConnections = createAsyncThunk(
  'network/fetchConnections',
  async (userId: string) => {
    const [followers, following] = await Promise.all([
      networkApi.getFollowers(userId),
      networkApi.getConnections(userId)
    ]);
    
    // Combine and deduplicate connections
    const allConnections = [...followers.users, ...following.users];
    const uniqueConnections = allConnections.filter((user, index, self) => 
      index === self.findIndex(u => u.id === user.id)
    );
    
    return uniqueConnections;
  }
);

export const followUser = createAsyncThunk(
  'network/followUser',
  async (userId: string, { rejectWithValue }) => {
    try {
      await networkApi.followUser(userId);
      return userId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to follow user');
    }
  }
);

export const unfollowUser = createAsyncThunk(
  'network/unfollowUser',
  async (userId: string, { rejectWithValue }) => {
    try {
      await networkApi.unfollowUser(userId);
      return userId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to unfollow user');
    }
  }
);

export const searchUsers = createAsyncThunk(
  'network/searchUsers',
  async (params: {
    query: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await networkApi.searchUsers(
      params.query,
      params.limit || 20
    );
    return response;
  }
);

const networkSlice = createSlice({
  name: 'network',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setCollegeFilter: (state, action: PayloadAction<string>) => {
      state.collegeFilter = action.payload;
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetNetworkState: (state) => {
      return { ...initialState };
    },
    updateUserInList: (state, action: PayloadAction<{ userId: string; updates: Partial<NetworkUser> }>) => {
      const { userId, updates } = action.payload;
      
      // Update in users array
      const userIndex = state.users.findIndex(user => user.id === userId);
      if (userIndex !== -1) {
        state.users[userIndex] = { ...state.users[userIndex], ...updates };
      }
      
      // Update in connections array
      const connectionIndex = state.connections.findIndex(user => user.id === userId);
      if (connectionIndex !== -1) {
        state.connections[connectionIndex] = { ...state.connections[connectionIndex], ...updates };
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch users directory
    builder
      .addCase(fetchUsersDirectory.pending, (state) => {
        state.isLoadingUsers = true;
        state.error = null;
      })
      .addCase(fetchUsersDirectory.fulfilled, (state, action) => {
        state.isLoadingUsers = false;
        state.users = action.payload.users;
        state.totalUsers = action.payload.total;
        state.totalPages = Math.ceil(action.payload.total / 20);
        state.currentPage = 1;
      })
      .addCase(fetchUsersDirectory.rejected, (state, action) => {
        state.isLoadingUsers = false;
        state.error = action.error.message || 'Failed to fetch users';
      });

    // Fetch network stats
    builder
      .addCase(fetchNetworkStats.pending, (state) => {
        state.isLoadingStats = true;
      })
      .addCase(fetchNetworkStats.fulfilled, (state, action) => {
        state.isLoadingStats = false;
        state.stats = action.payload;
      })
      .addCase(fetchNetworkStats.rejected, (state, action) => {
        state.isLoadingStats = false;
        state.error = action.error.message || 'Failed to fetch network stats';
      });

    // Fetch follow suggestions
    builder
      .addCase(fetchFollowSuggestions.pending, (state) => {
        state.isLoadingSuggestions = true;
      })
      .addCase(fetchFollowSuggestions.fulfilled, (state, action) => {
        state.isLoadingSuggestions = false;
        state.suggestions = action.payload.suggestions;
      })
      .addCase(fetchFollowSuggestions.rejected, (state, action) => {
        state.isLoadingSuggestions = false;
        state.error = action.error.message || 'Failed to fetch suggestions';
      });

    // Fetch connections
    builder
      .addCase(fetchConnections.pending, (state) => {
        state.isLoadingConnections = true;
      })
      .addCase(fetchConnections.fulfilled, (state, action) => {
        state.isLoadingConnections = false;
        state.connections = action.payload;
      })
      .addCase(fetchConnections.rejected, (state, action) => {
        state.isLoadingConnections = false;
        state.error = action.error.message || 'Failed to fetch connections';
      });

    // Follow user
    builder
      .addCase(followUser.pending, (state, action) => {
        state.followLoading[action.meta.arg] = true;
      })
      .addCase(followUser.fulfilled, (state, action) => {
        state.followLoading[action.payload] = false;
        
        // Update user's follower count if available
        const userId = action.payload;
        const userIndex = state.users.findIndex(user => user.id === userId);
        if (userIndex !== -1 && state.users[userIndex].followersCount !== undefined) {
          state.users[userIndex].followersCount! += 1;
        }
        
        // Update stats if available
        if (state.stats) {
          state.stats.followingCount += 1;
        }
      })
      .addCase(followUser.rejected, (state, action) => {
        state.followLoading[action.meta.arg] = false;
        state.error = action.payload as string;
      });

    // Unfollow user
    builder
      .addCase(unfollowUser.pending, (state, action) => {
        state.followLoading[action.meta.arg] = true;
      })
      .addCase(unfollowUser.fulfilled, (state, action) => {
        state.followLoading[action.payload] = false;
        
        // Update user's follower count if available
        const userId = action.payload;
        const userIndex = state.users.findIndex(user => user.id === userId);
        if (userIndex !== -1 && state.users[userIndex].followersCount !== undefined) {
          state.users[userIndex].followersCount! = Math.max(0, state.users[userIndex].followersCount! - 1);
        }
        
        // Remove from connections
        state.connections = state.connections.filter(user => user.id !== userId);
        
        // Update stats if available
        if (state.stats) {
          state.stats.followingCount = Math.max(0, state.stats.followingCount - 1);
        }
      })
      .addCase(unfollowUser.rejected, (state, action) => {
        state.followLoading[action.meta.arg] = false;
        state.error = action.payload as string;
      });

    // Search users
    builder
      .addCase(searchUsers.pending, (state) => {
        state.isLoadingUsers = true;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.isLoadingUsers = false;
        state.users = action.payload.users;
        state.totalUsers = action.payload.total;
        state.totalPages = Math.ceil(action.payload.total / 20);
        state.currentPage = 1;
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.isLoadingUsers = false;
        state.error = action.error.message || 'Failed to search users';
      });
  },
});

export const {
  setSearchQuery,
  setCollegeFilter,
  setCurrentPage,
  clearError,
  resetNetworkState,
  updateUserInList,
} = networkSlice.actions;

export default networkSlice.reducer;
