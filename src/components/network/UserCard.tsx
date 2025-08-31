'use client';

import React from 'react';
import Link from 'next/link';
import { MessageCircle, UserPlus, UserCheck, MapPin, Briefcase } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  followUser,
  unfollowUser,
  selectFollowingMap,
  selectFollowLoadingMap
} from '@/store/slices/networkSlice';
import ConnectionRequestButton from '@/components/connections/ConnectionRequestButton';

interface UserCardProps {
  user: {
    userId: string;
    displayName: string;
    avatarUrl?: string | null;
    collegeName?: string | null;
    department?: string | null;
    year?: number | null;
    bio?: string;
    location?: string;
    followersCount?: number;
  };
  onMessage?: (userId: string) => void;
  variant?: 'default' | 'compact' | 'suggestion';
}

export default function UserCard({ user, onMessage, variant = 'default' }: UserCardProps) {
  const { user: currentUser } = useAuth();
  const dispatch = useAppDispatch();
  
  const followingMap = useAppSelector(selectFollowingMap);
  const followLoadingMap = useAppSelector(selectFollowLoadingMap);
  
  const isOwnProfile = currentUser?.id === user.userId;
  const isFollowing = followingMap[user.userId];
  const isFollowLoading = followLoadingMap[user.userId];

  const handleFollow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isFollowing) {
      dispatch(unfollowUser({ userId: user.userId }));
    } else {
      dispatch(followUser({ userId: user.userId }));
    }
  };

  const handleMessage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onMessage?.(user.userId);
  };

  const details = [
    user.collegeName,
    user.department,
    user.year ? `Year ${user.year}` : undefined
  ].filter(Boolean).join(' • ');

  if (variant === 'compact') {
    return (
      <Link href={`/student/profile/${user.userId}`} className="block">
        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="relative">
            {user.avatarUrl ? (
              <img 
                src={user.avatarUrl} 
                alt={user.displayName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                {user.displayName?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">{user.displayName}</p>
            <p className="text-sm text-gray-500 truncate">{details || 'Student'}</p>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'suggestion') {
    return (
      <div className="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow">
        <Link href={`/student/profile/${user.userId}`} className="block mb-3">
          <div className="text-center">
            {user.avatarUrl ? (
              <img 
                src={user.avatarUrl} 
                alt={user.displayName}
                className="w-16 h-16 rounded-full object-cover mx-auto mb-3"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-medium mx-auto mb-3">
                {user.displayName?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <h3 className="font-medium text-gray-900 mb-1">{user.displayName}</h3>
            <p className="text-sm text-gray-500 mb-2">{details}</p>
            {user.followersCount !== undefined && (
              <p className="text-xs text-gray-400">{user.followersCount} followers</p>
            )}
          </div>
        </Link>
        
        {!isOwnProfile && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                onClick={handleFollow}
                disabled={isFollowLoading}
                className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isFollowing
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } disabled:opacity-50`}
              >
                {isFollowLoading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : isFollowing ? (
                  <UserCheck className="w-4 h-4" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                {isFollowing ? 'Following' : 'Follow'}
              </button>
              <button
                onClick={handleMessage}
                className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
            </div>
            <ConnectionRequestButton userId={user.userId} className="w-full" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border hover:shadow-md transition-all duration-200 overflow-hidden">
      <Link href={`/student/profile/${user.userId}`} className="block">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              {user.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt={user.displayName}
                  className="w-14 h-14 rounded-full object-cover"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-medium">
                  {user.displayName?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 border-2 border-white rounded-full"></div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 mb-1 hover:text-blue-600 transition-colors">
                {user.displayName}
              </h3>
              
              <div className="space-y-1 mb-3">
                {details && (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Briefcase className="w-3 h-3" />
                    <span>{details}</span>
                  </div>
                )}
                {user.location && (
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <MapPin className="w-3 h-3" />
                    <span>{user.location}</span>
                  </div>
                )}
              </div>
              
              {user.bio && (
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                  {user.bio}
                </p>
              )}
              
              {user.followersCount !== undefined && (
                <p className="text-xs text-gray-400 mb-3">
                  {user.followersCount} followers
                </p>
              )}
            </div>
          </div>
        </div>
      </Link>
      
      {!isOwnProfile && (
        <div className="px-6 pb-4 space-y-3">
          <div className="flex gap-3">
            <button
              onClick={handleFollow}
              disabled={isFollowLoading}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isFollowing
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } disabled:opacity-50`}
            >
              {isFollowLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : isFollowing ? (
                <UserCheck className="w-4 h-4" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              {isFollowing ? 'Following' : 'Follow'}
            </button>
            
            <button
              onClick={handleMessage}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Message
            </button>
          </div>
          <ConnectionRequestButton userId={user.userId} className="w-full" />
        </div>
      )}
    </div>
  );
}
