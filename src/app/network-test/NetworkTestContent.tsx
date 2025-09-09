'use client';

import React, { useEffect, useState } from 'react';

interface Post {
  id: string;
  content: string;
  authorDisplayName: string;
  createdAt: string;
}

const NetworkTestContent: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
      setPosts([
        {
          id: '1',
          content: 'Welcome to Nexus Network! This is a test post.',
          authorDisplayName: 'Test User',
          createdAt: new Date().toISOString()
        }
      ]);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setPosts([
        {
          id: '2',
          content: 'Refreshed! Here is another test post.',
          authorDisplayName: 'Another User',
          createdAt: new Date().toISOString()
        }
      ]);
    }, 500);
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Nexus Network Feed</h1>
          <p className="text-gray-600 mt-2">Testing network service integration</p>
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Refresh Feed
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-semibold">Error Loading Feed</h3>
            <p className="text-red-700 mt-1">{error}</p>
            <button
              onClick={() => {
                setError(null);
                handleRefresh();
              }}
              className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm"
            >
              Try Again
            </button>
          </div>
        )}

        {loading ? (
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
                Showing {posts.length} post{posts.length !== 1 ? 's' : ''} from the network
              </p>
            </div>
            
            <div className="space-y-6">
              {posts.map((post) => (
                <div key={post.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {post.authorDisplayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-3">
                      <p className="font-semibold text-gray-900">{post.authorDisplayName}</p>
                      <p className="text-sm text-gray-500">{new Date(post.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <p className="text-gray-800">{post.content}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Debug Panel */}
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
            <span>Test Mode Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkTestContent;
