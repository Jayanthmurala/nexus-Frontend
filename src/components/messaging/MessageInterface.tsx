'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Phone, Video, MoreVertical, Smile, Paperclip, X, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
// @ts-ignore - Socket.IO types will be available after npm install
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  type: 'text' | 'image' | 'file';
  status: 'sent' | 'delivered' | 'read';
}

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

interface MessageInterfaceProps {
  onClose: () => void;
  initialUserId?: string;
}

export default function MessageInterface({ onClose, initialUserId }: MessageInterfaceProps) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(initialUserId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!user?.id) return;

    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'ws://localhost:3001', {
      auth: {
        userId: user.id,
        token: typeof window !== 'undefined' ? localStorage.getItem('authToken') : undefined
      }
    });

    newSocket.on('connect', () => {
      console.log('Connected to messaging server');
      setSocket(newSocket);
    });

    newSocket.on('message', (message: Message) => {
      setMessages(prev => [...prev, message]);
      // Update conversation last message
      setConversations(prev => prev.map(conv => 
        conv.userId === message.senderId 
          ? { ...conv, lastMessage: message.content, lastMessageTime: message.timestamp, unreadCount: conv.unreadCount + 1 }
          : conv
      ));
    });

    newSocket.on('typing', ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
      setTyping(isTyping ? userId : null);
    });

    newSocket.on('userOnline', ({ userId }: { userId: string }) => {
      setConversations(prev => prev.map(conv => 
        conv.userId === userId ? { ...conv, isOnline: true } : conv
      ));
    });

    newSocket.on('userOffline', ({ userId }: { userId: string }) => {
      setConversations(prev => prev.map(conv => 
        conv.userId === userId ? { ...conv, isOnline: false } : conv
      ));
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user?.id]);

  // Load conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const { getConversations } = await import('@/lib/messagingApi');
        const response = await getConversations({ limit: 20 });
        setConversations(response.conversations);
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
        // Fallback to empty array
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchConversations();
    }
  }, [user?.id]);

  // Load messages for active conversation
  useEffect(() => {
    if (!activeConversation || !user?.id) return;

    const fetchMessages = async () => {
      try {
        const { getMessages, markMessagesAsRead } = await import('@/lib/messagingApi');
        const response = await getMessages(activeConversation, { limit: 50 });
        setMessages(response.messages);
        
        // Mark messages as read
        await markMessagesAsRead(activeConversation);
        
        // Update conversation unread count
        setConversations(prev => prev.map(conv => 
          conv.userId === activeConversation ? { ...conv, unreadCount: 0 } : conv
        ));
      } catch (error) {
        console.error('Failed to fetch messages:', error);
        // Fallback to empty messages
        setMessages([]);
      }
    };

    fetchMessages();
  }, [activeConversation, user?.id]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || !user?.id) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      const { sendMessage } = await import('@/lib/messagingApi');
      const message = await sendMessage({
        receiverId: activeConversation,
        content: messageContent,
        type: 'text'
      });

      // Add message to local state
      setMessages(prev => [...prev, message]);

      // Send via socket for real-time delivery
      if (socket) {
        socket.emit('sendMessage', message);
      }

      // Update conversation
      setConversations(prev => prev.map(conv => 
        conv.userId === activeConversation 
          ? { ...conv, lastMessage: message.content, lastMessageTime: message.timestamp }
          : conv
      ));
    } catch (error) {
      console.error('Failed to send message:', error);
      // Restore message input on error
      setNewMessage(messageContent);
    }
  };

  const handleTyping = (isTyping: boolean) => {
    if (!socket || !activeConversation) return;
    
    socket.emit('typing', { receiverId: activeConversation, isTyping });
    
    if (isTyping) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', { receiverId: activeConversation, isTyping: false });
      }, 3000);
    }
  };

  const activeConv = conversations.find(c => c.userId === activeConversation);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[600px] flex overflow-hidden">
        {/* Conversations Sidebar */}
        <div className="w-80 border-r bg-gray-50 flex flex-col">
          <div className="p-4 border-b bg-white">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Messages</h2>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversation(conv.userId)}
                  className={`w-full p-4 text-left hover:bg-white transition-colors ${
                    activeConversation === conv.userId ? 'bg-white border-r-2 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {conv.avatarUrl ? (
                        <img 
                          src={conv.avatarUrl} 
                          alt={conv.displayName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                          {conv.displayName[0]?.toUpperCase()}
                        </div>
                      )}
                      {conv.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-gray-900 truncate">{conv.displayName}</p>
                        {conv.lastMessageTime && (
                          <span className="text-xs text-gray-500">
                            {new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 truncate">{conv.lastMessage}</p>
                        {conv.unreadCount > 0 && (
                          <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {activeConv ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveConversation(null)}
                    className="md:hidden p-1 hover:bg-gray-100 rounded-full"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="relative">
                    {activeConv.avatarUrl ? (
                      <img 
                        src={activeConv.avatarUrl} 
                        alt={activeConv.displayName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                        {activeConv.displayName[0]?.toUpperCase()}
                      </div>
                    )}
                    {activeConv.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{activeConv.displayName}</h3>
                    <p className="text-sm text-gray-500">
                      {activeConv.isOnline ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <Phone className="w-5 h-5 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <Video className="w-5 h-5 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <MoreVertical className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                        message.senderId === user?.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.senderId === user?.id ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                {typing && typing === activeConversation && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-2xl px-4 py-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t bg-white">
                <div className="flex items-end gap-3">
                  <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <Paperclip className="w-5 h-5 text-gray-600" />
                  </button>
                  <div className="flex-1 relative">
                    <textarea
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTyping(e.target.value.length > 0);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Type a message..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-full resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={1}
                    />
                  </div>
                  <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <Smile className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                <p className="text-gray-500">Choose a conversation from the sidebar to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
