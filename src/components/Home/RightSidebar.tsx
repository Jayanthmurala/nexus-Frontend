'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Hash,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { networkApi } from '@/lib/networkApi';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface TrendingTopic {
  tag: string;
  posts: number;
}


export default function RightSidebar() {
  const { user } = useAuth();
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSidebarData = async () => {
      if (!user?.id) return;
      
      try {
        // Fetch trending topics from backend
        const trending = await networkApi.getTrending();
        setTrendingTopics(trending.items?.map((item: any) => ({
          tag: item.tags?.[0] || 'General',
          posts: (item.likeCount || 0) + (item.commentCount || 0)
        })) || []);
        
      } catch (error) {
        console.error('Failed to fetch sidebar data:', error);
        setTrendingTopics([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSidebarData();
  }, [user?.id]);


  return (
    <div className="space-y-4">
      {/* Trending Topics */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-900 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
            Trending Topics
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            </div>
          ) : trendingTopics.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No trending topics yet</p>
          ) : (
            <>
              <div className="space-y-3">
                {trendingTopics.map((topic, index) => (
                  <div key={topic.tag} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                      <div className="flex items-center space-x-1">
                        <Hash className="w-3 h-3 text-blue-600" />
                        <span className="text-sm font-medium text-blue-600 hover:underline cursor-pointer">
                          {topic.tag}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{topic.posts} interactions</span>
                  </div>
                ))}
              </div>
              
              <Button variant="ghost" className="w-full mt-4 text-sm text-blue-600">
                Show More Topics
              </Button>
            </>
          )}
        </CardContent>
      </Card>




      {/* Footer */}
      <div className="text-center text-xs text-gray-500 space-y-1">
        <div className="flex flex-wrap justify-center gap-2">
          <Link href="/about" className="hover:text-blue-600">About</Link>
          <span>•</span>
          <Link href="/privacy" className="hover:text-blue-600">Privacy</Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-blue-600">Terms</Link>
        </div>
        <p>© 2024 Nexus Platform</p>
      </div>
    </div>
  );
}
