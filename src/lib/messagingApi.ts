'use client';

import httpNetwork from './httpNetwork';

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
  const { data } = await httpNetwork.get('/v1/messages/conversations', { params });
  return data;
}

// Get messages for a specific conversation
export async function getMessages(userId: string, params?: {
  cursor?: string;
  limit?: number;
}): Promise<ListMessagesResponse> {
  const { data } = await httpNetwork.get(`/v1/messages/${userId}`, { params });
  return data;
}

// Send a message
export async function sendMessage(payload: CreateMessagePayload): Promise<Message> {
  const { data } = await httpNetwork.post('/v1/messages', payload);
  return data.message;
}

// Mark messages as read
export async function markMessagesAsRead(userId: string): Promise<{ success: boolean }> {
  const { data } = await httpNetwork.put(`/v1/messages/${userId}/read`);
  return data;
}

// Get online users
export async function getOnlineUsers(): Promise<{ users: string[] }> {
  const { data } = await httpNetwork.get('/v1/messages/online');
  return data;
}

export default {
  getConversations,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  getOnlineUsers
};
