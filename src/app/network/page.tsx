'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  Search, 
  Filter, 
  UserPlus, 
  UserX, 
  Loader2, 
  RefreshCw,
  Network,
  Mail,
  Building2, 
  Settings,
  MoreHorizontal
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { networkApi, NetworkStats, User } from '../../lib/networkApi';
import toast from 'react-hot-toast';

export default function NetworkPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'discover' | 'connections' | 'suggestions'>('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [collegeFilter, setCollegeFilter] = useState<string>('all');
  
  // State management
  const [users, setUsers] = useState<User[]>([]);
  const [connections, setConnections] = useState<User[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [followLoading, setFollowLoading] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
  const [colleges, setColleges] = useState<Array<{id: string, name: string}>>([]);

  // Fetch data functions
  const fetchNetworkStats = useCallback(async () => {
    if (!user?.id) return;
    try {
      const networkStats = await networkApi.getNetworkStats(user.id);
      setStats(networkStats);
    } catch (error) {
      console.error('Failed to fetch network stats:', error);
    }
  }, [user?.id]);

  const fetchUsers = useCallback(async (pageNum = 0, append = false) => {
    if (pageNum === 0) setLoading(true);
    else setLoadingMore(true);
    
    try {
      const response = await networkApi.getUserDirectory(50, pageNum * 50, collegeFilter);
      if (append) {
        setUsers(prev => [...prev, ...response.users]);
      } else {
        setUsers(response.users);
      }
      setHasMore(response.users.length === 50);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [collegeFilter]);

  const fetchConnections = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await networkApi.getConnections(user.id);
      setConnections(response.users);
      // Update following users set
      const followingIds = new Set(response.users.map((u: User) => u.id));
      setFollowingUsers(followingIds);
    } catch (error) {
      console.error('Failed to fetch connections:', error);
    }
  }, [user?.id]);

  const fetchSuggestions = useCallback(async () => {
    try {
      const response = await networkApi.getFollowSuggestions(12);
      setSuggestions(response.suggestions);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    }
  }, []);

  const fetchColleges = useCallback(async () => {
    try {
      const response = await networkApi.getColleges();
      setColleges(response.colleges);
    } catch (error) {
      console.error('Failed to fetch colleges:', error);
    }
  }, []);

  // Follow/Unfollow handlers
  const handleFollow = useCallback(async (userId: string) => {
    setFollowLoading(prev => ({ ...prev, [userId]: true }));
    try {
      await networkApi.followUser(userId);
      toast.success('Connected successfully!');
      // Update local state immediately
      setFollowingUsers(prev => new Set([...prev, userId]));
      await fetchNetworkStats();
      await fetchConnections();
    } catch (error) {
      console.error('Failed to follow user:', error);
      toast.error('Failed to connect');
    } finally {
      setFollowLoading(prev => ({ ...prev, [userId]: false }));
    }
  }, [fetchNetworkStats, fetchConnections]);

  const handleUnfollow = useCallback(async (userId: string) => {
    setFollowLoading(prev => ({ ...prev, [userId]: true }));
    try {
      await networkApi.unfollowUser(userId);
      toast.success('Disconnected successfully!');
      // Update local state immediately
      setFollowingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
      await fetchNetworkStats();
      await fetchConnections();
    } catch (error) {
      console.error('Failed to unfollow user:', error);
      toast.error('Failed to disconnect');
    } finally {
      setFollowLoading(prev => ({ ...prev, [userId]: false }));
    }
  }, [fetchNetworkStats, fetchConnections]);

  // Load more users
  const loadMoreUsers = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchUsers(page + 1, true);
    }
  }, [fetchUsers, page, loadingMore, hasMore]);

  // Remove client-side filtering since we're now filtering on backend
  const filteredUsers = users;

  // Initialize data
  useEffect(() => {
    if (user) {
      fetchNetworkStats();
      fetchUsers();
      fetchConnections();
      fetchSuggestions();
      fetchColleges();
    }
  }, [user, fetchNetworkStats, fetchUsers, fetchConnections, fetchSuggestions, fetchColleges]);

  // Refetch users when college filter changes
  useEffect(() => {
    if (user && collegeFilter !== undefined) {
      fetchUsers(0, false);
    }
  }, [collegeFilter, fetchUsers, user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-bold mb-4">Please log in</h2>
            <p className="text-gray-600 mb-4">You need to be logged in to access your network.</p>
            <Button onClick={() => window.location.href = '/login'} className="w-full">
              Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* LinkedIn-style Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-semibold text-gray-900">My network</h1>
              <span className="text-sm text-gray-500">Manage your network and grow your connections</span>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - LinkedIn Style */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              {/* Network Stats Card */}
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Users className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Your network</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Connections</span>
                        <span className="font-medium text-blue-600">{stats?.followingCount || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Followers</span>
                        <span className="font-medium">{stats?.followersCount || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Profile views</span>
                        <span className="font-medium">{stats?.profileViews || 0}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Manage my network</h3>
                  <div className="space-y-2">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-sm font-normal"
                      onClick={() => setActiveTab('connections')}
                    >
                      <Users className="w-4 h-4 mr-3" />
                      Connections
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-sm font-normal"
                      onClick={() => setActiveTab('suggestions')}
                    >
                      <UserPlus className="w-4 h-4 mr-3" />
                      People you may know
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-sm font-normal"
                    >
                      <Building2 className="w-4 h-4 mr-3" />
                      Colleagues
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* Search and Filter Bar */}
            <Card className="bg-white border border-gray-200 shadow-sm mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search by name, title, company..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <Select value={collegeFilter} onValueChange={setCollegeFilter}>
                    <SelectTrigger className="w-full sm:w-48 border-gray-300">
                      <SelectValue placeholder="All colleges" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All colleges</SelectItem>
                      {colleges.map((college) => (
                        <SelectItem key={college.id} value={college.name}>
                          {college.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Content Tabs */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('discover')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'discover'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Discover
                  </button>
                  <button
                    onClick={() => setActiveTab('connections')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'connections'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Connections ({connections.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('suggestions')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'suggestions'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    People you may know
                  </button>
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'discover' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {loading ? (
                    <div className="col-span-2 flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                  ) : (
                    filteredUsers.map((user, index) => (
                      <LinkedInUserCard
                        key={user.id}
                        user={user}
                        onConnect={followingUsers.has(user.id) ? handleUnfollow : handleFollow}
                        onMessage={() => {}}
                        isLoading={followLoading[user.id]}
                        isFollowing={followingUsers.has(user.id)}
                        index={index}
                      />
                    ))
                  )}
                </div>
                
                {/* Load More Button */}
                {!loading && hasMore && (
                  <div className="flex justify-center">
                    <Button 
                      onClick={loadMoreUsers}
                      disabled={loadingMore}
                      variant="outline"
                      className="px-8 py-2"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Loading more...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Load More Users
                        </>
                      )}
                    </Button>
                  </div>
                )}
                
                {!hasMore && filteredUsers.length > 0 && (
                  <div className="text-center text-gray-500 py-4">
                    <p>You've reached the end of the user directory</p>
                  </div>
                )}
                
                {filteredUsers.length === 0 && !loading && (
                  <div className="text-center text-gray-500 py-12">
                    <p>No users found for the selected college</p>
                    <Button 
                      variant="outline" 
                      onClick={() => setCollegeFilter('all')}
                      className="mt-2"
                    >
                      Show all users
                    </Button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'connections' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {connections && connections.length > 0 ? (
                  connections.map((user, index) => (
                    <LinkedInUserCard
                      key={user?.id || index}
                      user={user}
                      onConnect={handleUnfollow}
                      onMessage={() => {}}
                      isLoading={followLoading[user?.id]}
                      isConnection={true}
                      index={index}
                    />
                  ))
                ) : (
                  <div className="col-span-2 text-center py-12 text-gray-500">
                    <p>No connections yet. Start connecting with people!</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'suggestions' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suggestions && suggestions.length > 0 ? (
                  suggestions.map((suggestion, index) => (
                    <LinkedInUserCard
                      key={suggestion?.id || index}
                      user={suggestion}
                      onConnect={handleFollow}
                      onMessage={() => {}}
                      isLoading={followLoading[suggestion?.id]}
                      suggestion={suggestion}
                      index={index}
                    />
                  ))
                ) : (
                  <div className="col-span-2 text-center py-12 text-gray-500">
                    <p>No suggestions available. Check back later!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// LinkedIn-style User Card Component
function LinkedInUserCard({ 
  user, 
  onConnect, 
  onMessage, 
  isLoading,
  isConnection = false,
  isFollowing = false,
  index = 0,
  suggestion
}: { 
  user: User; 
  onConnect: (id: string) => void;
  onMessage: (id: string) => void;
  isLoading?: boolean;
  isConnection?: boolean;
  isFollowing?: boolean;
  index?: number;
  suggestion?: any;
}) {
  const handleProfileClick = () => {
    window.location.href = `/profile/${user.id}`;
  };

  const getReasonBadge = (reason: string) => {
    const reasonConfig = {
      'same_college': { text: 'Same College', color: 'bg-green-100 text-green-700', icon: '🎓' },
      'same_department': { text: 'Same Department', color: 'bg-blue-100 text-blue-700', icon: '🏢' },
      'mutual_connections': { text: 'Mutual Connections', color: 'bg-purple-100 text-purple-700', icon: '👥' },
      'popular': { text: 'Popular', color: 'bg-orange-100 text-orange-700', icon: '⭐' }
    };
    return reasonConfig[reason as keyof typeof reasonConfig] || reasonConfig.popular;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
    >
      <div className="p-4">
        {/* Header with Avatar and Basic Info */}
        <div className="flex items-start space-x-3 mb-3">
          <div className="relative">
            <Avatar className="w-14 h-14 cursor-pointer" onClick={handleProfileClick}>
              <AvatarImage src={user.avatarUrl} className="object-cover" />
              <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                {user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 
              className="font-semibold text-gray-900 hover:text-blue-600 cursor-pointer truncate"
              onClick={handleProfileClick}
            >
              {user.name || 'Unknown User'}
            </h3>
            <p className="text-sm text-gray-600 truncate">
              {user.department || 'Student'} {user.collegeName && `at ${user.collegeName}`}
            </p>
            {user.collegeMemberId && (
              <p className="text-xs text-gray-500">ID: {user.collegeMemberId}</p>
            )}
          </div>
          
          <Button variant="ghost" size="sm" className="p-1">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>

        {/* Bio */}
        {user.bio && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{user.bio}</p>
        )}

        {/* Tags and Info */}
        <div className="flex flex-wrap gap-2 mb-3">
          {user.roles && user.roles.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {user.roles.includes('FACULTY') ? 'Faculty' : 'Student'}
            </Badge>
          )}
          {user.year && (
            <Badge variant="outline" className="text-xs">
              Year {user.year}
            </Badge>
          )}
          {suggestion?.reason && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs ${getReasonBadge(suggestion.reason).color}`}>
              <span>{getReasonBadge(suggestion.reason).icon}</span>
              <span>{getReasonBadge(suggestion.reason).text}</span>
            </div>
          )}
        </div>

        {/* Mutual Connections */}
        {suggestion?.mutualFollowersCount > 0 && (
          <div className="flex items-center text-xs text-gray-500 mb-3">
            <Users className="w-3 h-3 mr-1" />
            {suggestion.mutualFollowersCount} mutual connection{suggestion.mutualFollowersCount !== 1 ? 's' : ''}
          </div>
        )}

        <Separator className="my-3" />

        {/* Action Buttons */}
        <div className="flex space-x-2">
          {isConnection || isFollowing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onConnect(user.id)}
              disabled={isLoading}
              className="flex-1 text-sm"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <UserX className="w-4 h-4 mr-2" />
              )}
              {isConnection ? 'Remove' : 'Unfollow'}
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => onConnect(user.id)}
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-sm"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              Connect
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMessage(user.id)}
            className="flex-1 text-sm"
          >
            <Mail className="w-4 h-4 mr-2" />
            Message
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
