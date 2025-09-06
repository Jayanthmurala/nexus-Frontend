'use client';

import React, { useEffect, useState } from 'react';
import { Feed } from '@/lib/network-service/components';
import { useFeed } from '@/lib/network-service/hooks';
import { useNetworkClient } from '@/contexts/NetworkContext';
import { PostResponse } from '@/lib/network-service/api-client';

const NetworkTestPage: React.FC = () => {
  const { client } = useNetworkClient();
  const [error, setError] = useState<string | null>(null);
  
  const { posts, loading, error: feedError, hasMore, loadMore, refresh } = useFeed(
    { scope: 'global', limit: 10 },
    { client }
  );

  const handlePostUpdate = (postId: string, updatedPost: PostResponse) => {
    console.log('Post updated:', postId, updatedPost);
  };

  useEffect(() => {
    if (feedError) {
      setError(feedError);
    }
  }, [feedError]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Nexus Network Feed</h1>
          <p className="text-gray-600 mt-2">Testing network service integration</p>
          
          <button
            onClick={refresh}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Refresh Feed
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-semibold">Error Loading Feed</h3>
            <p className="text-red-700 mt-1">{error}</p>
            <button
              onClick={() => {
                setError(null);
                refresh();
              }}
              className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm"
            >
              Retry
            </button>
          </div>
        )}

        {loading && posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading network feed...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No posts found. The feed is empty!</p>
            <p className="text-sm text-gray-500 mt-2">Try creating some posts first.</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-sm text-gray-600">
                Showing {posts.length} posts
                {hasMore && ' • Load more available'}
              </p>
            </div>
            
            <Feed
              posts={posts}
              config={{ client }}
              onPostUpdate={handlePostUpdate}
            />
            
            {hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  {loading ? 'Loading...' : 'Load More Posts'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Backend Service Status */}
      <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
        <h4 className="font-semibold text-sm text-gray-900 mb-2">Backend Services</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
            <span>Network Service (4005)</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
            <span>Auth Service (4001)</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
            <span>All Services Running</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkTestPage;
