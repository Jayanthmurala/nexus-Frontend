'use client';

import React, { createContext, useContext } from 'react';
import { useBadgeNotifications } from '@/hooks/useBadgeNotifications';
import BadgeNotificationModal from '@/components/feed/BadgeNotificationModal';
import { BadgeData } from '@/types/post';

interface BadgeNotificationContextType {
  handleBadgeAwarded: (badgeData: BadgeData) => Promise<void>;
  clearAllNotifications: () => void;
  notificationCount: number;
}

const BadgeNotificationContext = createContext<BadgeNotificationContextType | undefined>(undefined);

export const useBadgeNotificationContext = () => {
  const context = useContext(BadgeNotificationContext);
  if (!context) {
    throw new Error('useBadgeNotificationContext must be used within BadgeNotificationProvider');
  }
  return context;
};

interface BadgeNotificationProviderProps {
  children: React.ReactNode;
}

export const BadgeNotificationProvider: React.FC<BadgeNotificationProviderProps> = ({ children }) => {
  const {
    notifications,
    showNotification,
    handleBadgeAwarded,
    handlePublishPost,
    handleKeepDraft,
    dismissNotification,
    clearAllNotifications
  } = useBadgeNotifications();

  const contextValue: BadgeNotificationContextType = {
    handleBadgeAwarded,
    clearAllNotifications,
    notificationCount: notifications.length
  };

  return (
    <BadgeNotificationContext.Provider value={contextValue}>
      {children}
      
      {/* Badge Notification Modal */}
      {showNotification && (
        <BadgeNotificationModal
          badgeData={showNotification.badgeData}
          draftPost={showNotification.draftPost}
          onClose={dismissNotification}
          onPublish={handlePublishPost}
          onKeepDraft={() => handleKeepDraft(showNotification.id)}
        />
      )}
    </BadgeNotificationContext.Provider>
  );
};
