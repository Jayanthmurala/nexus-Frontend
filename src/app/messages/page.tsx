'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MessageSquare, Users, Search, Plus, ArrowLeft } from 'lucide-react';
import { getConversations, searchUsers } from '@/lib/messagingApi';
import MessageInterface from '@/components/messaging/MessageInterface';

interface Conversation {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isOnline: boolean;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  email: string;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchConversations();
    }
  }, [user?.id]);

  const fetchConversations = async () => {
    try {
      const response = await getConversations({ limit: 20 });
      setConversations(response.conversations);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length > 0) {
      try {
        const response = await searchUsers(query.trim(), 10);
        setSearchResults(response.users);
      } catch (error) {
        console.error('Failed to search users:', error);
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
    }
  };

  const startConversation = (userId: string) => {
    setSelectedUserId(userId);
    setShowUserSearch(false);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Please sign in</h2>
          <p className="text-gray-600">You need to be signed in to access messages.</p>
        </div>
      </div>
    );
  }

  if (selectedUserId) {
    return (
      <div className="h-screen flex flex-col">
        <MessageInterface
          initialUserId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      </div>
    );
  }

  if (showUserSearch) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setShowUserSearch(false)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">Start New Conversation</h1>
        </div>

        <div className="bg-white border rounded-xl p-6">
          <div className="relative mb-6">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search for people to message..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-2">
            {searchResults.map((searchUser) => (
              <button
                key={searchUser.id}
                onClick={() => startConversation(searchUser.id)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                {searchUser.avatarUrl ? (
                  <img
                    src={searchUser.avatarUrl}
                    alt={`${searchUser.firstName} ${searchUser.lastName}`}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                    {searchUser.firstName[0]?.toUpperCase()}{searchUser.lastName[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {searchUser.firstName} {searchUser.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{searchUser.email}</p>
                </div>
              </button>
            ))}
            
            {searchQuery && searchResults.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No users found for "{searchQuery}"
              </div>
            )}
            
            {!searchQuery && (
              <div className="text-center py-8 text-gray-500">
                Start typing to search for people to message
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            Messages
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Connect and communicate with your network
          </p>
        </div>
        <button
          onClick={() => setShowUserSearch(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Message
        </button>
      </div>

      {/* Conversations List */}
      <div className="bg-white border rounded-xl">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-900">Conversations</h3>
        </div>
        
        <div className="divide-y">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length > 0 ? (
            conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => startConversation(conversation.userId)}
                className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="relative">
                  {conversation.avatarUrl ? (
                    <img
                      src={conversation.avatarUrl}
                      alt={conversation.displayName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                      {conversation.displayName[0]?.toUpperCase()}
                    </div>
                  )}
                  {conversation.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-gray-900 truncate">{conversation.displayName}</p>
                    {conversation.lastMessageTime && (
                      <span className="text-xs text-gray-500">
                        {new Date(conversation.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 truncate">
                      {conversation.lastMessage || 'No messages yet'}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="p-8 text-center">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
              <p className="text-gray-600 mb-4">Start messaging with your network</p>
              <button
                onClick={() => setShowUserSearch(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Start Conversation
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Find People</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Discover and connect with people in your network.
          </p>
          <button
            onClick={() => setShowUserSearch(true)}
            className="text-green-600 hover:text-green-700 text-sm font-medium"
          >
            Search Users →
          </button>
        </div>

        <div className="bg-white border rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Search className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Search Messages</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Find specific conversations or messages quickly.
          </p>
          <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
            Coming Soon →
          </button>
        </div>
      </div>
    </div>
  );
}
