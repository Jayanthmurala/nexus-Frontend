import { CreatePostRequest, Post, PostType } from '@/types/post';
import httpNetwork from '@/lib/httpNetwork';

const API_BASE_URL = process.env.NEXT_PUBLIC_NETWORK_API_BASE_URL || 'http://localhost:4005';

export const feedApi = {
  // Get feed posts
  getFeedPosts: async (page = 1, limit = 10): Promise<{ posts: Post[]; total: number; hasMore: boolean }> => {
    const response = await httpNetwork.get(`/v1/posts/feed`, {
      params: { page, limit }
    });
    return response.data;
  },

  // Create a new post
  createPost: async (postData: CreatePostRequest): Promise<Post> => {
    const response = await httpNetwork.post(`/v1/posts`, postData);
    return response.data;
  },

  // Update a post
  updatePost: async (postId: string, postData: Partial<CreatePostRequest>): Promise<Post> => {
    const response = await httpNetwork.put(`/v1/posts/${postId}`, postData);
    return response.data;
  },

  // Delete a post
  deletePost: async (postId: string): Promise<void> => {
    await httpNetwork.delete(`/v1/posts/${postId}`);
  },

  // Like/unlike a post
  toggleLike: async (postId: string): Promise<{ liked: boolean; likesCount: number }> => {
    const response = await httpNetwork.post(`/v1/posts/${postId}/like`, {});
    return response.data;
  },

  // Get post comments
  getPostComments: async (postId: string): Promise<any[]> => {
    const response = await httpNetwork.get(`/v1/posts/${postId}/comments`);
    return response.data;
  },

  // Add comment to post
  addComment: async (postId: string, content: string): Promise<any> => {
    const response = await httpNetwork.post(`/v1/posts/${postId}/comments`, {
      content
    });
    return response.data;
  },

  // Share a post
  sharePost: async (postId: string, content?: string): Promise<Post> => {
    const response = await httpNetwork.post(`/v1/posts/${postId}/share`, {
      content
    });
    return response.data;
  },

  // Upload media for posts
  uploadMedia: async (files: File[]): Promise<string[]> => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    const response = await httpNetwork.post(`/v1/posts/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data.mediaIds;
  },

  // Get user's posts
  getUserPosts: async (userId: string, page = 1, limit = 10): Promise<{ posts: Post[]; total: number; hasMore: boolean }> => {
    const response = await httpNetwork.get(`/v1/posts/user/${userId}`, {
      params: { page, limit }
    });
    return response.data;
  },

  // Get posts by type
  getPostsByType: async (type: PostType, page = 1, limit = 10): Promise<{ posts: Post[]; total: number; hasMore: boolean }> => {
    const response = await httpNetwork.get(`/v1/posts/type/${type}`, {
      params: { page, limit }
    });
    return response.data;
  },

  // Search posts
  searchPosts: async (query: string, filters?: {
    type?: PostType;
    tags?: string[];
    dateFrom?: string;
    dateTo?: string;
  }): Promise<Post[]> => {
    const response = await httpNetwork.get(`/v1/posts/search`, {
      params: { query, ...filters }
    });
    return response.data;
  },
};
