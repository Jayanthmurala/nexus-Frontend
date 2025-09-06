'use client';

import { useState, useEffect, useCallback } from 'react';
import { Post, BadgeData } from '@/types/post';
import { networkApi } from '@/lib/networkApi';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface BadgeNotification {
  id: string;
  badgeData: BadgeData;
  draftPost: Post;
  timestamp: string;
}

interface UseBadgeNotificationsReturn {
  notifications: BadgeNotification[];
  showNotification: BadgeNotification | null;
  handleBadgeAwarded: (badgeData: BadgeData) => Promise<void>;
  handlePublishPost: (postId: string, customContent?: string) => Promise<void>;
  handleKeepDraft: (notificationId: string) => void;
  dismissNotification: () => void;
  clearAllNotifications: () => void;
}

export const useBadgeNotifications = (): UseBadgeNotificationsReturn => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<BadgeNotification[]>([]);
  const [showNotification, setShowNotification] = useState<BadgeNotification | null>(null);

  // Generate auto-post content for badge awards
  const generateBadgePostContent = (badgeData: BadgeData): string => {
    const achievements = [
      `🎉 Just earned the "${badgeData.name}" badge! ${badgeData.description}`,
      `Excited to share that I've been awarded the ${badgeData.name} badge! 🏆`,
      `Proud to announce I've achieved the "${badgeData.name}" badge! ${badgeData.description}`,
      `Another milestone reached! Just earned the ${badgeData.name} badge 🎯`,
      `Thrilled to have earned the "${badgeData.name}" badge! ${badgeData.description} 🌟`
    ];
    
    return achievements[Math.floor(Math.random() * achievements.length)];
  };

  // Handle badge awarded event (typically triggered by Socket.IO or API)
  const handleBadgeAwarded = useCallback(async (badgeData: BadgeData) => {
    try {
      // Create draft post automatically
      const draftPostData = {
        type: 'badge_award' as const,
        content: generateBadgePostContent(badgeData),
        visibility: 'COLLEGE' as const,
        badgeData: {
          requiredSkills: [],
          capacity: 0,
          deadline: '',
          applyInApp: false
        }
      };

      const draftPost = await networkApi.createPost(draftPostData);
      
      // Create notification
      const notification: BadgeNotification = {
        id: `badge-${badgeData.id}-${Date.now()}`,
        badgeData,
        draftPost,
        timestamp: new Date().toISOString()
      };

      setNotifications(prev => [notification, ...prev]);
      
      // Show notification modal after a brief delay
      setTimeout(() => {
        setShowNotification(notification);
      }, 500);

      // Send telemetry for badge award
      await networkApi.sendTelemetry([{
        postId: draftPost.id,
        eventType: 'viewImpression',
        timestamp: new Date().toISOString()
      }]);

    } catch (error) {
      console.error('Failed to create badge draft post:', error);
      toast.error('Failed to create badge post');
    }
  }, []);

  // Publish the draft post
  const handlePublishPost = useCallback(async (postId: string, customContent?: string) => {
    try {
      const updateData: any = {
        state: 'published'
      };

      if (customContent) {
        updateData.content = customContent;
      }

      await networkApi.updatePost(postId, updateData);
      
      // Remove notification after publishing
      setNotifications(prev => prev.filter(n => n.draftPost.id !== postId));
      
      // Send telemetry for post publication
      await networkApi.sendTelemetry([{
        postId,
        eventType: 'shared',
        timestamp: new Date().toISOString()
      }]);

    } catch (error) {
      console.error('Failed to publish badge post:', error);
      throw error;
    }
  }, []);

  // Keep post as draft
  const handleKeepDraft = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  // Dismiss current notification modal
  const dismissNotification = useCallback(() => {
    setShowNotification(null);
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    setShowNotification(null);
  }, []);

  // Listen for badge events from Socket.IO (if available)
  useEffect(() => {
    // This would be integrated with Socket.IO when implemented
    const handleBadgeEvent = (event: any) => {
      if (event.type === 'badge_awarded' && event.userId === user?.id) {
        handleBadgeAwarded(event.badgeData);
      }
    };

    // Example Socket.IO integration:
    // socket?.on('badge_notification', handleBadgeEvent);
    // return () => socket?.off('badge_notification', handleBadgeEvent);
  }, [user?.id, handleBadgeAwarded]);

  // Auto-dismiss notifications after 24 hours
  useEffect(() => {
    const interval = setInterval(() => {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      setNotifications(prev => prev.filter(n => n.timestamp > oneDayAgo));
    }, 60 * 60 * 1000); // Check every hour

    return () => clearInterval(interval);
  }, []);

  return {
    notifications,
    showNotification,
    handleBadgeAwarded,
    handlePublishPost,
    handleKeepDraft,
    dismissNotification,
    clearAllNotifications
  };
};
