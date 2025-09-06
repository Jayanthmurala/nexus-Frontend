import httpNetwork from './httpNetwork';

// Types for Network API
export interface NetworkStats {
  followersCount: number;
  followingCount: number;
  profileViews: number;
  searchAppearances: number;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  department?: string;
  college?: string;
  collegeName?: string;
  collegeMemberId?: string;
  roles?: string[];
  bio?: string;
  year?: number;
  followersCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
}

export interface FollowSuggestion extends User {
  mutualFollowersCount: number;
  reason: 'same_college' | 'same_department' | 'mutual_connections' | 'popular';
}

export interface FollowResponse {
  success: boolean;
  message: string;
}

export interface ConnectionsResponse {
  users: User[];
  total: number;
  hasMore: boolean;
}

export interface SuggestionsResponse {
  suggestions: FollowSuggestion[];
  total: number;
}

export interface DirectoryResponse {
  users: User[];
}

// Post and Comment Types
export interface Comment {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  authorDisplayName: string;
  authorAvatarUrl?: string;
  parentCommentId?: string;
  likeCount: number;
  likedByMe: boolean;
  createdAt: string;
  updatedAt: string;
  replies: Comment[];
}

export interface Post {
  id: string;
  type: string;
  content: string;
  visibility: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  authorDisplayName: string;
  authorAvatarUrl?: string;
  authorRole: string;
  authorDepartment?: string;
  authorCollegeId?: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewCount: number;
  likedByMe: boolean;
  bookmarkedByMe: boolean;
  media: any[];
  tags: string[];
  links: any[];
  badgeData?: any;
  collaborationData?: any;
  projectData?: any;
  eventData?: any;
  jobData?: any;
}

export const networkApi = {
  // Get network statistics for a user
  getNetworkStats: async (userId: string): Promise<NetworkStats> => {
    const response = await httpNetwork.get(`/v1/users/${userId}/stats`);
    return response.data;
  },

  // Get follow suggestions
  getFollowSuggestions: async (limit: number = 12): Promise<SuggestionsResponse> => {
    const response = await httpNetwork.get(`/v1/users/suggestions?limit=${limit}`);
    return response.data;
  },

  // Get user directory (fallback for suggestions)
  getUserDirectory: async (limit: number = 50, offset: number = 0, collegeFilter?: string): Promise<DirectoryResponse> => {
    let url = `/v1/users/directory?limit=${limit}&offset=${offset}`;
    if (collegeFilter && collegeFilter !== 'all') {
      url += `&search=${encodeURIComponent(collegeFilter)}`;
    }
    const response = await httpNetwork.get(url);
    return response.data;
  },

  // Get colleges list
  getColleges: async (): Promise<{colleges: Array<{id: string, name: string}>}> => {
    const response = await httpNetwork.get('/v1/colleges');
    return response.data;
  },

  // Get user's connections (following)
  getConnections: async (userId: string, limit: number = 50): Promise<ConnectionsResponse> => {
    const response = await httpNetwork.get(`/v1/users/${userId}/following?limit=${limit}`);
    return response.data;
  },

  // Follow a user
  followUser: async (userId: string): Promise<FollowResponse> => {
    const response = await httpNetwork.post(`/v1/users/${userId}/follow`);
    return response.data;
  },

  // Unfollow a user
  unfollowUser: async (userId: string): Promise<FollowResponse> => {
    const response = await httpNetwork.delete(`/v1/users/${userId}/follow`);
    return response.data;
  },

  // Get followers of a user
  getFollowers: async (userId: string, limit: number = 50): Promise<ConnectionsResponse> => {
    const response = await httpNetwork.get(`/v1/users/${userId}/followers?limit=${limit}`);
    return response.data;
  },

  // Search users
  searchUsers: async (query: string, limit: number = 20): Promise<DirectoryResponse> => {
    const response = await httpNetwork.get(`/v1/users/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    return response.data;
  },

  // Get feed posts
  getFeed: async ({ scope = 'global', limit = 10, search }: { scope?: 'global' | 'college' | 'following'; limit?: number; search?: string } = {}) => {
    let url = `/v1/network/feed?scope=${scope}&limit=${limit}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    const response = await httpNetwork.get(url);
    return response.data;
  },

  // Create post
  createPost: async (postData: any) => {
    const response = await httpNetwork.post('/v1/posts/specialized', postData);
    return response.data;
  },

  // Get trending topics
  getTrending: async (): Promise<{ items: any[] }> => {
    const response = await httpNetwork.get('/v1/network/trending');
    return response.data;
  },

  // Get user suggestions
  getSuggestions: async (): Promise<{ suggestions: FollowSuggestion[] }> => {
    const response = await httpNetwork.get('/v1/users/suggestions');
    return response.data;
  },

  // Apply to collaboration post
  applyToCollaboration: async (postId: string, message?: string): Promise<{ success: boolean; message: string }> => {
    const response = await httpNetwork.post(`/v1/posts/${postId}/apply`, { message });
    return response.data;
  },

  // =================== POST CRUD OPERATIONS ===================
  
  // Like/Unlike a post
  likePost: async (postId: string): Promise<{ liked: boolean; likeCount: number }> => {
    const response = await httpNetwork.post(`/v1/posts/${postId}/like`);
    return response.data;
  },

  // Bookmark/Unbookmark a post
  bookmarkPost: async (postId: string): Promise<{ bookmarked: boolean }> => {
    const response = await httpNetwork.post(`/v1/posts/${postId}/bookmark`);
    return response.data;
  },

  // Update a post
  updatePost: async (postId: string, updateData: any): Promise<Post> => {
    const response = await httpNetwork.put(`/v1/posts/${postId}`, updateData);
    return response.data;
  },

  // Delete a post
  deletePost: async (postId: string): Promise<{ deleted: boolean }> => {
    const response = await httpNetwork.delete(`/v1/posts/${postId}`);
    return response.data;
  },

  // Share a post
  sharePost: async (postId: string, shareType: 'SHARE' | 'REPOST' = 'SHARE'): Promise<{ shared: boolean; shareCount: number }> => {
    const response = await httpNetwork.post(`/v1/posts/${postId}/share`, { shareType });
    return response.data;
  },

  // Report a post
  reportPost: async (postId: string, reason: string, description?: string): Promise<{ reported: boolean }> => {
    const response = await httpNetwork.post(`/v1/posts/${postId}/report`, { reason, description });
    return response.data;
  },

  // =================== COMMENT CRUD OPERATIONS ===================
  
  // Get comments for a post (alias for compatibility)
  listComments: async (postId: string, cursor?: string, limit: number = 20): Promise<{ items: Comment[]; nextCursor?: string; hasMore: boolean }> => {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    params.append('limit', limit.toString());
    
    const response = await httpNetwork.get(`/v1/posts/${postId}/comments?${params}`);
    return response.data;
  },

  // Get comments for a post
  getComments: async (postId: string, cursor?: string, limit: number = 20): Promise<{ items: Comment[]; nextCursor?: string; hasMore: boolean }> => {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    params.append('limit', limit.toString());
    
    const response = await httpNetwork.get(`/v1/posts/${postId}/comments?${params}`);
    return response.data;
  },

  // Create a comment
  createComment: async (postId: string, content: string, parentCommentId?: string): Promise<Comment> => {
    const response = await httpNetwork.post(`/v1/posts/${postId}/comments`, { content, parentCommentId });
    return response.data.comment;
  },

  // Update a comment
  updateComment: async (commentId: string, content: string): Promise<Comment> => {
    const response = await httpNetwork.put(`/v1/comments/${commentId}`, { content });
    return response.data.comment;
  },

  // Delete a comment
  deleteComment: async (commentId: string): Promise<{ deleted: boolean }> => {
    const response = await httpNetwork.delete(`/v1/comments/${commentId}`);
    return response.data;
  },

  // Like/Unlike a comment
  likeComment: async (commentId: string): Promise<{ liked: boolean; likeCount: number }> => {
    const response = await httpNetwork.post(`/v1/comments/${commentId}/like`);
    return response.data;
  },

  // Associate media with post
  associateMediaWithPost: async (postId: string, mediaIds: string[]): Promise<{ success: boolean }> => {
    const response = await httpNetwork.post(`/v1/posts/${postId}/media`, { mediaIds });
    return response.data;
  },

  // =================== MEDIA UPLOAD ===================
  
  // Upload media file
  uploadMedia: async (file: File): Promise<{ id: string; url: string; mimeType: string; width?: number; height?: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await httpNetwork.post('/v1/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // =================== SEARCH AND FILTERING ===================
  
  // Enhanced search posts
  searchPosts: async (query: string, filters: {
    postTypes?: string[];
    dateRange?: { from: string; to: string };
    authorId?: string;
    tags?: string[];
    cursor?: string;
    limit?: number;
  } = {}): Promise<{ items: Post[]; nextCursor?: string; hasMore: boolean }> => {
    const params = new URLSearchParams();
    params.append('q', query);
    
    if (filters.postTypes?.length) {
      filters.postTypes.forEach(type => params.append('type', type));
    }
    if (filters.dateRange) {
      params.append('from', filters.dateRange.from);
      params.append('to', filters.dateRange.to);
    }
    if (filters.authorId) params.append('authorId', filters.authorId);
    if (filters.tags?.length) {
      filters.tags.forEach(tag => params.append('tag', tag));
    }
    if (filters.cursor) params.append('cursor', filters.cursor);
    if (filters.limit) params.append('limit', filters.limit.toString());
    
    const response = await httpNetwork.get(`/v1/search/posts?${params}`);
    return response.data;
  }
};
