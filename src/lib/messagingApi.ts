'use client';

import { httpMessaging } from './httpNetwork';

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  type: 'text' | 'image' | 'file';
  status: 'sent' | 'delivered' | 'read';
}

export interface Conversation {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isOnline: boolean;
}

export interface CreateMessagePayload {
  receiverId: string;
  content: string;
  type?: 'text' | 'image' | 'file';
}

export interface ListMessagesResponse {
  messages: Message[];
  nextCursor?: string;
  hasMore: boolean;
}

export interface ListConversationsResponse {
  conversations: Conversation[];
  nextCursor?: string;
  hasMore: boolean;
}

// Get all conversations for current user
export async function getConversations(params?: {
  cursor?: string;
  limit?: number;
}): Promise<ListConversationsResponse> {
  const { data } = await httpMessaging.get('/v1/messages/conversations', { params });
  return data;
}

// Get messages for a specific conversation
export async function getMessages(userId: string, params?: {
  cursor?: string;
  limit?: number;
}): Promise<ListMessagesResponse> {
  const { data } = await httpMessaging.get(`/v1/messages/${userId}`, { params });
  return data;
}

// Send a message
export async function sendMessage(payload: CreateMessagePayload): Promise<Message> {
  const { data } = await httpMessaging.post('/v1/messages', payload);
  return data.message;
}

// Mark messages as read
export async function markMessagesAsRead(userId: string): Promise<{ success: boolean }> {
  const { data } = await httpMessaging.put(`/v1/messages/${userId}/read`);
  return data;
}

// Get online users
export async function getOnlineUsers(): Promise<{ users: string[] }> {
  const { data } = await httpMessaging.get('/v1/messages/online');
  return data;
}

// Search users for new conversations
export async function searchUsers(query: string, limit?: number): Promise<{ users: any[] }> {
  const { data } = await httpMessaging.get('/v1/messages/users/search', {
    params: { q: query, limit }
  });
  return data;
}

// Get user profile
export async function getUserProfile(userId: string): Promise<{ user: any }> {
  const { data } = await httpMessaging.get(`/v1/messages/users/${userId}`);
  return data;
}

// Upload file for messages
export async function uploadMessageFile(file: File): Promise<{ fileUrl: string }> {
  const formData = new FormData();
  formData.append('file', file);
  
  const { data } = await httpMessaging.post('/v1/messages/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return data;
}

export default {
  getConversations,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  getOnlineUsers,
  searchUsers,
  getUserProfile,
  uploadMessageFile
};
