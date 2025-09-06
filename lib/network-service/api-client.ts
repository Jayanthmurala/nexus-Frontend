/**
 * Nexus Network Service API Client
 * Frontend integration utilities for the network service
 */

export interface ApiClientConfig {
  baseUrl?: string;
  getAuthToken?: () => string | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor?: string;
  hasMore: boolean;
}

export interface PostResponse {
  id: string;
  type: PostType;
  content?: string;
  visibility: PostVisibility;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  authorDisplayName: string;
  authorAvatarUrl?: string;
  authorRole: string;
  authorDepartment?: string;
  authorCollegeId: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewCount: number;
  likedByMe: boolean;
  bookmarkedByMe: boolean;
  media: MediaResponse[];
  tags: string[];
  links: Array<{
    url: string;
    title?: string;
    order: number;
  }>;
  badgeData?: any;
  collaborationData?: any;
  projectData?: any;
  eventData?: any;
  jobData?: any;
}

export interface MediaResponse {
  id: string;
  url: string;
  mimeType: string;
  width?: number;
  height?: number;
}

export interface CommentResponse {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  userDisplayName: string;
  userAvatarUrl?: string;
}

export enum PostType {
  GENERAL = 'GENERAL',
  BADGE_AWARD = 'BADGE_AWARD',
  PROJECT_UPDATE = 'PROJECT_UPDATE',
  COLLABORATION = 'COLLABORATION',
  JOB_POSTING = 'JOB_POSTING',
  EVENT = 'EVENT',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  SHARE = 'SHARE',
  PROJECT_SHOWCASE = 'PROJECT_SHOWCASE',
  RESEARCH_PAPER = 'RESEARCH_PAPER',
  EVENT_HIGHLIGHT = 'EVENT_HIGHLIGHT',
  AD = 'AD'
}

export enum PostVisibility {
  PUBLIC = 'PUBLIC',
  COLLEGE = 'COLLEGE',
  DEPARTMENT = 'DEPARTMENT',
  PRIVATE = 'PRIVATE'
}

export interface CreatePostRequest {
  type: PostType;
  content?: string;
  visibility?: PostVisibility;
  tags?: string[];
  links?: Array<{
    url: string;
    title?: string;
  }>;
  mediaIds?: string[];
  badgeData?: any;
  collaborationData?: any;
  projectData?: any;
  eventData?: any;
  jobData?: any;
}

export interface FeedParams {
  scope?: 'global' | 'college' | 'following';
  cursor?: string;
  limit?: number;
  postTypes?: PostType[];
}

export class NetworkApiClient {
  private baseUrl: string;
  private getAuthToken?: () => string | null;

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = config.baseUrl || 'http://localhost:4005';
    this.getAuthToken = config.getAuthToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getAuthToken?.();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: 'Unknown Error',
        message: response.statusText,
      }));
      throw new Error(`API Error: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  // =================== FEED METHODS ===================

  async getFeed(params: FeedParams = {}): Promise<PaginatedResponse<PostResponse>> {
    const searchParams = new URLSearchParams();
    
    if (params.scope) searchParams.append('scope', params.scope);
    if (params.cursor) searchParams.append('cursor', params.cursor);
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.postTypes?.length) {
      params.postTypes.forEach(type => searchParams.append('postTypes', type));
    }

    return this.request(`/v1/network/feed?${searchParams}`);
  }

  // =================== POST METHODS ===================

  async createPost(postData: CreatePostRequest): Promise<PostResponse> {
    return this.request('/v1/posts/specialized', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  }

  async getPost(postId: string): Promise<PostResponse> {
    return this.request(`/v1/posts/${postId}`);
  }

  async updatePost(postId: string, postData: Partial<CreatePostRequest>): Promise<PostResponse> {
    return this.request(`/v1/posts/${postId}`, {
      method: 'PUT',
      body: JSON.stringify(postData),
    });
  }

  async deletePost(postId: string): Promise<{ deleted: boolean }> {
    return this.request(`/v1/posts/${postId}`, {
      method: 'DELETE',
    });
  }

  async getUserPosts(cursor?: string, limit?: number): Promise<PaginatedResponse<PostResponse>> {
    const searchParams = new URLSearchParams();
    if (cursor) searchParams.append('cursor', cursor);
    if (limit) searchParams.append('limit', limit.toString());

    return this.request(`/v1/user/posts?${searchParams}`);
  }

  // =================== POST INTERACTIONS ===================

  async likePost(postId: string): Promise<{ ok: boolean; liked: boolean; likeCount: number }> {
    return this.request(`/v1/posts/${postId}/like`, {
      method: 'POST',
    });
  }

  async unlikePost(postId: string): Promise<{ ok: boolean; unliked: boolean; likeCount: number }> {
    return this.request(`/v1/posts/${postId}/like`, {
      method: 'DELETE',
    });
  }

  async bookmarkPost(postId: string): Promise<{ bookmarked: boolean }> {
    return this.request(`/v1/posts/${postId}/bookmark`, {
      method: 'POST',
    });
  }

  async unbookmarkPost(postId: string): Promise<{ removed: boolean }> {
    return this.request(`/v1/posts/${postId}/bookmark`, {
      method: 'DELETE',
    });
  }

  async getUserBookmarks(cursor?: string, limit?: number): Promise<PaginatedResponse<PostResponse>> {
    const searchParams = new URLSearchParams();
    if (cursor) searchParams.append('cursor', cursor);
    if (limit) searchParams.append('limit', limit.toString());

    return this.request(`/v1/user/bookmarks?${searchParams}`);
  }

  // =================== COMMENTS METHODS ===================

  async getComments(postId: string, cursor?: string, limit?: number): Promise<PaginatedResponse<CommentResponse>> {
    const searchParams = new URLSearchParams();
    if (cursor) searchParams.append('cursor', cursor);
    if (limit) searchParams.append('limit', limit.toString());

    return this.request(`/v1/posts/${postId}/comments?${searchParams}`);
  }

  async createComment(postId: string, content: string): Promise<CommentResponse> {
    return this.request(`/v1/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async updateComment(commentId: string, content: string): Promise<CommentResponse> {
    return this.request(`/v1/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  }

  async deleteComment(commentId: string): Promise<{ deleted: boolean }> {
    return this.request(`/v1/comments/${commentId}`, {
      method: 'DELETE',
    });
  }

  // =================== MEDIA METHODS ===================

  async uploadMedia(file: File): Promise<MediaResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const token = this.getAuthToken?.();
    const headers: HeadersInit = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}/v1/media/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: 'Upload Error',
        message: response.statusText,
      }));
      throw new Error(`Media Upload Error: ${error.message}`);
    }

    return response.json();
  }

  async associateMediaWithPost(postId: string, mediaIds: string[]): Promise<any> {
    return this.request(`/v1/posts/${postId}/media`, {
      method: 'POST',
      body: JSON.stringify({ mediaIds }),
    });
  }

  // =================== FACULTY METHODS ===================

  async createAnnouncement(postData: Omit<CreatePostRequest, 'type'>): Promise<PostResponse> {
    return this.request('/v1/posts/announcement', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  }

  async createJobPosting(postData: Omit<CreatePostRequest, 'type'>): Promise<PostResponse> {
    return this.request('/v1/posts/job', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  }

  // =================== ADMIN METHODS ===================

  async getAdminStats(): Promise<{
    totalPosts: number;
    postsToday: number;
    totalUsers: number;
    activeUsers: number;
    postsByType: Record<PostType, number>;
    recentActivity: {
      posts: number;
      comments: number;
      likes: number;
    };
  }> {
    return this.request('/v1/admin/stats');
  }

  async getFlaggedContent(cursor?: string, limit?: number): Promise<PaginatedResponse<PostResponse>> {
    const searchParams = new URLSearchParams();
    if (cursor) searchParams.append('cursor', cursor);
    if (limit) searchParams.append('limit', limit.toString());

    return this.request(`/v1/admin/flagged?${searchParams}`);
  }

  async moderatePost(
    postId: string, 
    action: 'hide' | 'delete' | 'approve' | 'flag', 
    reason?: string
  ): Promise<{ success: boolean; action: string }> {
    return this.request(`/v1/admin/moderate/${postId}`, {
      method: 'POST',
      body: JSON.stringify({ action, reason }),
    });
  }

  async getUserPostsAdmin(userId: string, cursor?: string, limit?: number): Promise<PaginatedResponse<PostResponse>> {
    const searchParams = new URLSearchParams();
    if (cursor) searchParams.append('cursor', cursor);
    if (limit) searchParams.append('limit', limit.toString());

    return this.request(`/v1/admin/users/${userId}/posts?${searchParams}`);
  }

  async bulkDeletePosts(postIds: string[]): Promise<{ deleted: number }> {
    return this.request('/v1/admin/posts/bulk', {
      method: 'DELETE',
      body: JSON.stringify({ postIds }),
    });
  }

  // =================== SEARCH METHODS ===================

  async searchPosts(query: string, filters?: {
    type?: string;
    tags?: string;
    dateRange?: string;
  }): Promise<any> {
    const searchParams = new URLSearchParams();
    searchParams.append('q', query);
    
    if (filters?.type) searchParams.append('type', filters.type);
    if (filters?.tags) searchParams.append('tags', filters.tags);
    if (filters?.dateRange) searchParams.append('dateRange', filters.dateRange);

    return this.request(`/v1/search/posts?${searchParams}`);
  }
}

// Factory function for easy setup
export function createNetworkClient(config: ApiClientConfig = {}): NetworkApiClient {
  return new NetworkApiClient(config);
}
