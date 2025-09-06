import httpNetwork from './httpNetwork';

export interface PostType {
  GENERAL: 'GENERAL';
  BADGE_AWARD: 'BADGE_AWARD';
  PROJECT_UPDATE: 'PROJECT_UPDATE';
  COLLABORATION: 'COLLABORATION';
  JOB_POSTING: 'JOB_POSTING';
  EVENT: 'EVENT';
  ANNOUNCEMENT: 'ANNOUNCEMENT';
}

export interface CreatePostRequest {
  type: keyof PostType;
  content: string;
  visibility?: 'PUBLIC' | 'COLLEGE' | 'PRIVATE';
  tags?: string[];
  links?: Array<{
    url: string;
    title: string;
  }>;
  mediaIds?: string[];
  badgeData?: any;
  projectData?: any;
  collaborationData?: any;
  eventData?: any;
  jobData?: any;
}

export interface Post {
  id: string;
  type: string;
  content: string;
  visibility: string;
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
  media?: Array<{
    id: string;
    url: string;
    mimeType: string;
    width?: number;
    height?: number;
  }>;
  tags?: string[];
  links?: Array<{
    url: string;
    title: string;
    order: number;
  }>;
  badgeData?: any;
  collaborationData?: any;
  projectData?: any;
  eventData?: any;
  jobData?: any;
}

export interface FeedResponse {
  items: Post[];
  nextCursor?: string;
  hasMore: boolean;
}

export interface MediaUploadResponse {
  id: string;
  url: string;
  mimeType: string;
  width?: number;
  height?: number;
}

export interface LikeResponse {
  ok: boolean;
  liked: boolean;
  likeCount: number;
}

export interface BookmarkResponse {
  bookmarked: boolean;
  removed?: boolean;
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorDisplayName: string;
  authorAvatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommentsResponse {
  items: Comment[];
  nextCursor?: string;
  hasMore: boolean;
}

class PostsApi {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_NETWORK_API_BASE_URL || 'http://localhost:4005';
  }

  // Feed endpoints
  async getFeed(params: {
    scope?: 'global' | 'college' | 'following';
    cursor?: string;
    limit?: number;
    postTypes?: string[];
  } = {}): Promise<FeedResponse> {
    const searchParams = new URLSearchParams();
    
    if (params.scope) searchParams.append('scope', params.scope);
    if (params.cursor) searchParams.append('cursor', params.cursor);
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.postTypes?.length) {
      params.postTypes.forEach(type => searchParams.append('postTypes', type));
    }

    const response = await httpNetwork.get(`/v1/network/feed?${searchParams.toString()}`);
    return response.data;
  }

  // Post CRUD
  async createPost(data: CreatePostRequest): Promise<Post> {
    const response = await httpNetwork.post('/v1/posts/specialized', data);
    return response.data;
  }

  async getPost(postId: string): Promise<Post> {
    const response = await httpNetwork.get(`/v1/posts/${postId}`);
    return response.data;
  }

  async updatePost(postId: string, data: Partial<CreatePostRequest>): Promise<Post> {
    const response = await httpNetwork.put(`/v1/posts/${postId}`, data);
    return response.data;
  }

  async deletePost(postId: string): Promise<{ deleted: boolean }> {
    const response = await httpNetwork.delete(`/v1/posts/${postId}`);
    return response.data;
  }

  // Post interactions
  async likePost(postId: string): Promise<LikeResponse> {
    const response = await httpNetwork.post(`/v1/posts/${postId}/like`);
    return response.data;
  }

  async bookmarkPost(postId: string): Promise<BookmarkResponse> {
    const response = await httpNetwork.post(`/v1/posts/${postId}/bookmark`);
    return response.data;
  }

  async removeBookmark(postId: string): Promise<BookmarkResponse> {
    const response = await httpNetwork.delete(`/v1/posts/${postId}/bookmark`);
    return response.data;
  }

  async getUserBookmarks(params: {
    cursor?: string;
    limit?: number;
  } = {}): Promise<FeedResponse> {
    const searchParams = new URLSearchParams();
    if (params.cursor) searchParams.append('cursor', params.cursor);
    if (params.limit) searchParams.append('limit', params.limit.toString());

    const response = await httpNetwork.get(`/v1/user/bookmarks?${searchParams.toString()}`);
    return response.data;
  }

  // Comments
  async createComment(postId: string, content: string): Promise<Comment> {
    const response = await httpNetwork.post(`/v1/posts/${postId}/comments`, { content });
    return response.data;
  }

  async getComments(postId: string, params: {
    cursor?: string;
    limit?: number;
  } = {}): Promise<CommentsResponse> {
    const searchParams = new URLSearchParams();
    if (params.cursor) searchParams.append('cursor', params.cursor);
    if (params.limit) searchParams.append('limit', params.limit.toString());

    const response = await httpNetwork.get(`/v1/posts/${postId}/comments?${searchParams.toString()}`);
    return response.data;
  }

  async updateComment(commentId: string, content: string): Promise<Comment> {
    const response = await httpNetwork.put(`/v1/comments/${commentId}`, { content });
    return response.data;
  }

  async deleteComment(commentId: string): Promise<{ deleted: boolean }> {
    const response = await httpNetwork.delete(`/v1/comments/${commentId}`);
    return response.data;
  }

  // Media upload
  async uploadMedia(file: File): Promise<MediaUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await httpNetwork.post('/v1/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async associateMediaWithPost(postId: string, mediaIds: string[]): Promise<void> {
    await httpNetwork.post(`/v1/posts/${postId}/media`, { mediaIds });
  }

  // User posts
  async getUserPosts(params: {
    cursor?: string;
    limit?: number;
  } = {}): Promise<FeedResponse> {
    const searchParams = new URLSearchParams();
    if (params.cursor) searchParams.append('cursor', params.cursor);
    if (params.limit) searchParams.append('limit', params.limit.toString());

    const response = await httpNetwork.get(`/v1/user/posts?${searchParams.toString()}`);
    return response.data;
  }

  async getUserPostsById(userId: string, params: {
    cursor?: string;
    limit?: number;
  } = {}): Promise<FeedResponse> {
    const searchParams = new URLSearchParams();
    if (params.cursor) searchParams.append('cursor', params.cursor);
    if (params.limit) searchParams.append('limit', params.limit.toString());

    const response = await httpNetwork.get(`/v1/users/${userId}/posts?${searchParams.toString()}`);
    return response.data;
  }

  // Specialized post creation
  async createAnnouncement(data: Omit<CreatePostRequest, 'type'>): Promise<Post> {
    const response = await httpNetwork.post('/v1/posts/announcement', data);
    return response.data;
  }

  async createJobPosting(data: Omit<CreatePostRequest, 'type'> & { jobData: any }): Promise<Post> {
    const response = await httpNetwork.post('/v1/posts/job', data);
    return response.data;
  }
}

export const postsApi = new PostsApi();
