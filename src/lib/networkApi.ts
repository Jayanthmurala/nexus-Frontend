import httpNetwork from './httpNetwork';

export type FeedScope = 'following' | 'college' | 'global';

export interface ListFeedParams {
  scope?: FeedScope;
  cursor?: string;
  limit?: number; // 1-50 (backend default 20)
}

export interface ListFeedResponse<T = any> {
  items: T[];
  nextCursor?: string;
}

export interface CreatePostBody {
  content: string;
  visibility?: 'PUBLIC' | 'COLLEGE';
  type?: 'STANDARD' | 'BADGE_AWARD' | 'SHARE';
  mediaIds?: string[];
  tags?: string[];
  links?: Array<{ url: string; title?: string }>;
}

export interface PostItem {
  id: string;
  authorId: string;
  authorDisplayName: string;
  authorAvatarUrl?: string | null;
  content?: string | null;
  createdAt: string;
  visibility: 'PUBLIC' | 'COLLEGE';
  type: 'STANDARD' | 'BADGE_AWARD' | 'SHARE' | 'AD';
  likeCount: number;
  commentCount: number;
  shareCount: number;
  likedByMe?: boolean;
  bookmarkedByMe?: boolean;
  media?: MediaItem[];
  tags?: string[];
  links?: Array<{ url: string; title?: string; order: number }>;
}

export interface MediaItem {
  id: string;
  url: string;
  mimeType: string;
  width?: number | null;
  height?: number | null;
}

export interface FollowerStats {
  followers: number;
  following: number;
  isFollowing: boolean;
  followsMe: boolean;
}

export interface CreateMediaBody {
  storageKey: string; // e.g., Cloudinary public_id
  url: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
}

export interface CreateMediaResponse {
  id: string;
  url: string;
  mimeType: string;
  width?: number | null;
  height?: number | null;
}

export interface CommentItem {
  id: string;
  postId: string;
  userId: string;
  userDisplayName: string;
  userAvatarUrl?: string | null;
  content: string;
  createdAt: string;
}

export interface UserEdgeItem {
  userId: string;
  followedAt: string;
  iFollow: boolean;
  followsMe: boolean;
}

export interface SuggestionItem {
  userId: string;
  displayName?: string | null;
  avatarUrl?: string | null;
}

export const networkApi = {
  async health(): Promise<{ status: 'ok' }> {
    const res = await httpNetwork.get('/v1/network/health');
    return res.data;
  },

  async listFeed<T = any>(params?: ListFeedParams): Promise<ListFeedResponse<T>> {
    const res = await httpNetwork.get('/v1/network/feed', { params });
    return res.data;
  },

  async follow(userId: string): Promise<{ ok: true; followed: boolean }> {
    const res = await httpNetwork.post('/v1/network/follow', { userId });
    return res.data;
  },

  async unfollow(userId: string): Promise<{ ok: true; deleted: boolean }> {
    const res = await httpNetwork.delete(`/v1/network/follow/${encodeURIComponent(userId)}`);
    return res.data;
  },

  async createPost(body: CreatePostBody): Promise<PostItem> {
    const res = await httpNetwork.post('/v1/posts', body);
    return res.data;
  },

  async createMedia(body: CreateMediaBody): Promise<CreateMediaResponse> {
    const res = await httpNetwork.post('/v1/media', body);
    return res.data;
  },

  async likePost(postId: string): Promise<{ ok: true; liked: boolean; likeCount: number }> {
    const res = await httpNetwork.post(`/v1/posts/${encodeURIComponent(postId)}/like`);
    return res.data;
  },

  async unlikePost(postId: string): Promise<{ ok: true; unliked: boolean; likeCount: number }> {
    const res = await httpNetwork.delete(`/v1/posts/${encodeURIComponent(postId)}/like`);
    return res.data;
  },

  async listComments(postId: string, params?: { cursor?: string; limit?: number }): Promise<ListFeedResponse<CommentItem>> {
    const res = await httpNetwork.get(`/v1/posts/${encodeURIComponent(postId)}/comments`, { params });
    return res.data;
  },

  async createComment(postId: string, content: string): Promise<CommentItem> {
    const res = await httpNetwork.post(`/v1/posts/${encodeURIComponent(postId)}/comments`, { content });
    return res.data;
  },

  async deleteComment(commentId: string): Promise<{ ok: true; deleted: boolean }> {
    const res = await httpNetwork.delete(`/v1/comments/${encodeURIComponent(commentId)}`);
    return res.data;
  },

  async bookmarkPost(postId: string): Promise<{ ok: true; bookmarked: boolean }> {
    const res = await httpNetwork.post(`/v1/posts/${encodeURIComponent(postId)}/bookmark`);
    return res.data;
  },

  async unbookmarkPost(postId: string): Promise<{ ok: true; unbookmarked: boolean }> {
    const res = await httpNetwork.delete(`/v1/posts/${encodeURIComponent(postId)}/bookmark`);
    return res.data;
  },

  async fetchFollowerStats(userId: string): Promise<FollowerStats> {
    const res = await httpNetwork.get(`/v1/network/followers/${encodeURIComponent(userId)}/stats`);
    return res.data as FollowerStats;
  },

  async listFollowers(userId: string, params?: { cursor?: string; limit?: number }): Promise<ListFeedResponse<UserEdgeItem>> {
    const res = await httpNetwork.get(`/v1/network/followers/${encodeURIComponent(userId)}`, { params });
    return res.data as ListFeedResponse<UserEdgeItem>;
  },

  async listFollowing(userId: string, params?: { cursor?: string; limit?: number }): Promise<ListFeedResponse<UserEdgeItem>> {
    const res = await httpNetwork.get(`/v1/network/following/${encodeURIComponent(userId)}`, { params });
    return res.data as ListFeedResponse<UserEdgeItem>;
  },

  async listSuggestions(params?: { limit?: number }): Promise<{ items: SuggestionItem[] }> {
    const res = await httpNetwork.get('/v1/network/suggestions', { params });
    return res.data as { items: SuggestionItem[] };
  },

  async listBookmarks(params?: { cursor?: string; limit?: number }): Promise<ListFeedResponse<PostItem>> {
    const res = await httpNetwork.get('/v1/network/bookmarks', { params });
    return res.data as ListFeedResponse<PostItem>;
  },

  async listTrending(params?: { sinceDays?: number; cursor?: string; limit?: number }): Promise<ListFeedResponse<PostItem>> {
    const res = await httpNetwork.get('/v1/network/trending', { params });
    return res.data as ListFeedResponse<PostItem>;
  },

  async updatePost(postId: string, body: { content: string; visibility?: 'PUBLIC' | 'COLLEGE'; type?: 'STANDARD' | 'BADGE_AWARD' | 'SHARE' }): Promise<{ id: string; content: string; visibility: string; type: string; updatedAt: string }> {
    const res = await httpNetwork.put(`/v1/posts/${encodeURIComponent(postId)}`, body);
    return res.data;
  },

  async deletePost(postId: string): Promise<{ ok: true; deleted: boolean }> {
    const res = await httpNetwork.delete(`/v1/posts/${encodeURIComponent(postId)}`);
    return res.data;
  },
};

export default networkApi;
