/**
 * Admin Dashboard Components for Nexus Network Service
 * Components for content moderation and system management
 */

import React, { useState, useEffect } from 'react';
import { PostResponse, PostType } from './api-client';
import { useAdminStats, UseNetworkConfig } from './hooks';
import { PostCard, TimeAgo } from './components';

// =================== ADMIN STATS DASHBOARD ===================

interface AdminStatsProps {
  config: UseNetworkConfig;
}

const AdminStats: React.FC<AdminStatsProps> = ({ config }) => {
  const { stats, loading, error, refresh } = useAdminStats(config);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">Error loading stats: {error}</p>
        <button 
          onClick={refresh}
          className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: 'Total Posts',
      value: stats.totalPosts.toLocaleString(),
      icon: '📝',
      color: 'blue'
    },
    {
      title: 'Posts Today',
      value: stats.postsToday.toLocaleString(),
      icon: '📈',
      color: 'green'
    },
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: '👥',
      color: 'purple'
    },
    {
      title: 'Active Users',
      value: stats.activeUsers.toLocaleString(),
      icon: '🔥',
      color: 'orange'
    }
  ];

  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50 text-blue-600',
    green: 'border-green-200 bg-green-50 text-green-600',
    purple: 'border-purple-200 bg-purple-50 text-purple-600',
    orange: 'border-orange-200 bg-orange-50 text-orange-600'
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className={`p-6 rounded-lg border ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-75">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
              <div className="text-2xl">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Post Types Breakdown */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Posts by Type</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(stats.postsByType).map(([type, count]) => (
            <div key={type} className="text-center p-3 bg-gray-50 rounded">
              <p className="text-2xl font-bold text-gray-700">{count as number}</p>
              <p className="text-xs text-gray-500 mt-1">{type.replace('_', ' ')}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Recent Activity (Last 7 Days)</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.recentActivity.posts}</p>
            <p className="text-sm text-gray-500">New Posts</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats.recentActivity.comments}</p>
            <p className="text-sm text-gray-500">Comments</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{stats.recentActivity.likes}</p>
            <p className="text-sm text-gray-500">Likes</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// =================== CONTENT MODERATION ===================

interface ModerationQueueProps {
  config: UseNetworkConfig;
}

const ModerationQueue: React.FC<ModerationQueueProps> = ({ config }) => {
  const [flaggedPosts, setFlaggedPosts] = useState<PostResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  const [moderating, setModerating] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadFlaggedContent();
  }, []);

  const loadFlaggedContent = async () => {
    try {
      setLoading(true);
      const response = await config.client.getFlaggedContent();
      setFlaggedPosts(response.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load flagged content');
    } finally {
      setLoading(false);
    }
  };

  const moderatePost = async (postId: string, action: 'hide' | 'delete' | 'approve' | 'flag', reason?: string) => {
    try {
      setModerating(prev => ({ ...prev, [postId]: true }));
      await config.client.moderatePost(postId, action, reason);
      
      // Remove from list if deleted or approved
      if (action === 'delete' || action === 'approve') {
        setFlaggedPosts(prev => prev.filter(post => post.id !== postId));
        setSelectedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      }
    } catch (error) {
      console.error(`Failed to ${action} post:`, error);
    } finally {
      setModerating(prev => ({ ...prev, [postId]: false }));
    }
  };

  const togglePostSelection = (postId: string) => {
    setSelectedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const bulkModerate = async (action: 'delete' | 'approve') => {
    if (selectedPosts.size === 0) return;

    const postIds = Array.from(selectedPosts);
    
    try {
      if (action === 'delete') {
        await config.client.bulkDeletePosts(postIds);
      } else {
        // For approve, we'd need to moderate each individually
        await Promise.all(
          postIds.map(id => config.client.moderatePost(id, 'approve'))
        );
      }
      
      setFlaggedPosts(prev => prev.filter(post => !selectedPosts.has(post.id)));
      setSelectedPosts(new Set());
    } catch (error) {
      console.error(`Failed to bulk ${action}:`, error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Content Moderation Queue</h3>
          <button
            onClick={loadFlaggedContent}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh
          </button>
        </div>
        
        {selectedPosts.size > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              {selectedPosts.size} post{selectedPosts.size !== 1 ? 's' : ''} selected
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => bulkModerate('approve')}
                className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
              >
                Bulk Approve
              </button>
              <button
                onClick={() => bulkModerate('delete')}
                className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
              >
                Bulk Delete
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="divide-y max-h-96 overflow-y-auto">
        {flaggedPosts.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>No content requires moderation</p>
          </div>
        ) : (
          flaggedPosts.map((post) => (
            <div key={post.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedPosts.has(post.id)}
                  onChange={() => togglePostSelection(post.id)}
                  className="mt-1"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{post.authorDisplayName}</p>
                      <p className="text-sm text-gray-500">{post.authorRole}</p>
                    </div>
                    <TimeAgo date={post.createdAt} />
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-2 line-clamp-3">
                    {post.content}
                  </p>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <span>❤️ {post.likeCount}</span>
                    <span>💬 {post.commentCount}</span>
                    <span>👁 {post.viewCount}</span>
                    <span className="bg-gray-100 px-2 py-1 rounded">{post.type}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => moderatePost(post.id, 'approve')}
                      disabled={moderating[post.id]}
                      className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => moderatePost(post.id, 'hide')}
                      disabled={moderating[post.id]}
                      className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600 disabled:opacity-50"
                    >
                      Hide
                    </button>
                    <button
                      onClick={() => moderatePost(post.id, 'delete', 'Admin moderation')}
                      disabled={moderating[post.id]}
                      className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// =================== USER MANAGEMENT ===================

interface UserManagementProps {
  config: UseNetworkConfig;
}

const UserManagement: React.FC<UserManagementProps> = ({ config }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userPosts, setUserPosts] = useState<PostResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const searchUsers = async () => {
    // This would be implemented when user search is available
    console.log('Searching users:', searchTerm);
  };

  const loadUserPosts = async (userId: string) => {
    try {
      setLoading(true);
      const response = await config.client.getUserPostsAdmin(userId);
      setUserPosts(response.items);
    } catch (error) {
      console.error('Failed to load user posts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* User Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">User Management</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users by name or email..."
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={searchUsers}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Search
          </button>
        </div>
      </div>

      {/* User Posts */}
      {selectedUser && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">User Posts</h3>
            <button
              onClick={() => {
                setSelectedUser(null);
                setUserPosts([]);
              }}
              className="mt-2 text-sm text-blue-600 hover:underline"
            >
              ← Back to search
            </button>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <p>Loading user posts...</p>
              </div>
            ) : userPosts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No posts found for this user</p>
              </div>
            ) : (
              <div className="space-y-4">
                {userPosts.map((post) => (
                  <div key={post.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm text-gray-500">{post.type}</p>
                        <TimeAgo date={post.createdAt} />
                      </div>
                    </div>
                    <p className="text-sm mb-2">{post.content}</p>
                    <div className="flex gap-2">
                      <span className="text-xs text-gray-500">❤️ {post.likeCount}</span>
                      <span className="text-xs text-gray-500">💬 {post.commentCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// =================== MAIN ADMIN DASHBOARD ===================

interface AdminDashboardProps {
  config: UseNetworkConfig;
  currentUser?: {
    role: string;
    displayName: string;
  };
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ config, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'moderation' | 'users'>('stats');

  const tabs = [
    { id: 'stats', label: 'Dashboard', icon: '📊' },
    { id: 'moderation', label: 'Moderation', icon: '🛡️' },
    { id: 'users', label: 'Users', icon: '👥' }
  ];

  const canAccessTab = (tabId: string) => {
    // Basic role-based tab access
    switch (tabId) {
      case 'stats':
        return true; // All admins can see stats
      case 'moderation':
        return ['DEPT_ADMIN', 'PLACEMENTS_ADMIN', 'HEAD_ADMIN'].includes(currentUser?.role || '');
      case 'users':
        return ['HEAD_ADMIN'].includes(currentUser?.role || '');
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-500">
                Welcome back, {currentUser?.displayName} ({currentUser?.role})
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                disabled={!canAccessTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : canAccessTab(tab.id)
                    ? 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    : 'border-transparent text-gray-300 cursor-not-allowed'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'stats' && <AdminStats config={config} />}
        {activeTab === 'moderation' && canAccessTab('moderation') && (
          <ModerationQueue config={config} />
        )}
        {activeTab === 'users' && canAccessTab('users') && (
          <UserManagement config={config} />
        )}
      </div>
    </div>
  );
};

// =================== EXPORT COMPONENTS ===================

export {
  AdminDashboard,
  AdminStats,
  ModerationQueue,
  UserManagement
};
