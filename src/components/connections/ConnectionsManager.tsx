'use client';

import React, { useState, useEffect } from 'react';
import { Users, UserPlus, UserCheck, UserX, Search, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getConnections,
  getReceivedRequests,
  getSentRequests,
  acceptConnectionRequest,
  rejectConnectionRequest,
  removeConnection,
  sendConnectionRequest,
  type Connection,
  type ConnectionRequest
} from '@/lib/connectionsApi';
import { toast } from 'react-hot-toast';

interface ConnectionsManagerProps {
  onClose: () => void;
}

type Tab = 'connections' | 'received' | 'sent';

export default function ConnectionsManager({ onClose }: ConnectionsManagerProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('connections');
  const [connections, setConnections] = useState<Connection[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<ConnectionRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'connections':
          const connectionsData = await getConnections({ limit: 50 });
          setConnections(connectionsData.items);
          break;
        case 'received':
          const receivedData = await getReceivedRequests({ limit: 50 });
          setReceivedRequests(receivedData.items);
          break;
        case 'sent':
          const sentData = await getSentRequests({ limit: 50 });
          setSentRequests(sentData.items);
          break;
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load connections data');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await acceptConnectionRequest(requestId);
      toast.success('Connection request accepted!');
      setReceivedRequests(prev => prev.filter(req => req.id !== requestId));
      // Refresh connections if on that tab
      if (activeTab === 'connections') {
        loadData();
      }
    } catch (error) {
      console.error('Failed to accept request:', error);
      toast.error('Failed to accept connection request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await rejectConnectionRequest(requestId);
      toast.success('Connection request rejected');
      setReceivedRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error) {
      console.error('Failed to reject request:', error);
      toast.error('Failed to reject connection request');
    }
  };

  const handleRemoveConnection = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this connection?')) return;
    
    try {
      await removeConnection(userId);
      toast.success('Connection removed');
      setConnections(prev => prev.filter(conn => conn.userId !== userId));
    } catch (error) {
      console.error('Failed to remove connection:', error);
      toast.error('Failed to remove connection');
    }
  };

  const getTabCount = () => {
    switch (activeTab) {
      case 'connections': return connections.length;
      case 'received': return receivedRequests.length;
      case 'sent': return sentRequests.length;
      default: return 0;
    }
  };

  const filteredConnections = () => {
    const query = searchQuery.toLowerCase();
    return connections.filter(conn => 
      conn.userId.toLowerCase().includes(query)
    );
  };

  const filteredReceivedRequests = () => {
    const query = searchQuery.toLowerCase();
    return receivedRequests.filter(req => 
      req.requesterId.toLowerCase().includes(query)
    );
  };

  const filteredSentRequests = () => {
    const query = searchQuery.toLowerCase();
    return sentRequests.filter(req => 
      req.addresseeId.toLowerCase().includes(query)
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[600px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Connections</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('connections')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'connections'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              My Connections
            </button>
            <button
              onClick={() => setActiveTab('received')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'received'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <UserPlus className="w-4 h-4 inline mr-2" />
              Received ({receivedRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'sent'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <UserCheck className="w-4 h-4 inline mr-2" />
              Sent ({sentRequests.length})
            </button>
          </div>

          {/* Search */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search connections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                  </div>
                  <div className="w-20 h-8 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            activeTab === 'connections' ? filteredConnections().length === 0 :
            activeTab === 'received' ? filteredReceivedRequests().length === 0 :
            filteredSentRequests().length === 0
          ) ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {activeTab === 'connections' && 'No connections yet'}
                {activeTab === 'received' && 'No pending requests'}
                {activeTab === 'sent' && 'No sent requests'}
              </h3>
              <p className="text-gray-500">
                {activeTab === 'connections' && 'Start connecting with people in your network'}
                {activeTab === 'received' && 'Connection requests will appear here'}
                {activeTab === 'sent' && 'Your sent requests will appear here'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Connections Tab */}
              {activeTab === 'connections' && filteredConnections().map((connection: Connection) => (
                <div key={connection.userId} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                    {connection.userId[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{connection.userId}</h4>
                    <p className="text-sm text-gray-500">
                      Connected {new Date(connection.connectedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveConnection(connection.userId)}
                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}

              {/* Received Requests Tab */}
              {activeTab === 'received' && filteredReceivedRequests().map((request: ConnectionRequest) => (
                <div key={request.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white font-medium">
                    {request.requesterId[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{request.requesterId}</h4>
                    <p className="text-sm text-gray-500">
                      Sent {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                    {request.note && (
                      <p className="text-sm text-gray-600 mt-1">"{request.note}"</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptRequest(request.id)}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRejectRequest(request.id)}
                      className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-200 rounded-md transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}

              {/* Sent Requests Tab */}
              {activeTab === 'sent' && filteredSentRequests().map((request: ConnectionRequest) => (
                <div key={request.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-medium">
                    {request.addresseeId[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{request.addresseeId}</h4>
                    <p className="text-sm text-gray-500">
                      Sent {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                    {request.note && (
                      <p className="text-sm text-gray-600 mt-1">"{request.note}"</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      request.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      request.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                      request.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {request.status.toLowerCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
