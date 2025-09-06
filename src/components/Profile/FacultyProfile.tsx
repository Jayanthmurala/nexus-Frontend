'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  MessageCircle, 
  UserPlus, 
  UserX,
  Building2,
  GraduationCap,
  Mail,
  Calendar,
  MapPin,
  Loader2,
  Heart,
  Eye,
  TrendingUp,
  Star,
  BookOpen,
  Award,
  Briefcase
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { networkApi, User, NetworkStats } from '@/lib/networkApi';
import toast from 'react-hot-toast';

interface FacultyProfileProps {
  userId: string;
}

export default function FacultyProfile({ userId }: FacultyProfileProps) {
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [networkStats, setNetworkStats] = useState<NetworkStats>({
    followersCount: 0,
    followingCount: 0,
    profileViews: 0,
    searchAppearances: 0
  });
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        
        // Fetch user directory to get user info
        const directoryData = await networkApi.getUserDirectory();
        const user = directoryData.users.find(u => u.id === userId);
        
        if (user) {
          setProfileUser(user);
          
          // Fetch network stats
          const stats = await networkApi.getNetworkStats(userId);
          setNetworkStats(stats);
          
          // Check if current user is following this user
          if (currentUser) {
            const connections = await networkApi.getConnections(currentUser.id);
            setIsFollowing(connections.users.some(c => c.id === userId));
          }
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchProfileData();
    }
  }, [userId, currentUser]);

  const handleFollow = async () => {
    if (!currentUser || followLoading) return;
    
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await networkApi.unfollowUser(userId);
        setIsFollowing(false);
        setNetworkStats(prev => ({ ...prev, followersCount: prev.followersCount - 1 }));
        toast.success('Unfollowed successfully');
      } else {
        await networkApi.followUser(userId);
        setIsFollowing(true);
        setNetworkStats(prev => ({ ...prev, followersCount: prev.followersCount + 1 }));
        toast.success('Following successfully');
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
      toast.error('Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile not found</h2>
          <p className="text-gray-600">This faculty profile could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
                {/* Avatar and Basic Info */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="w-24 h-24 border-4 border-white shadow-lg ring-4 ring-blue-100">
                      <AvatarImage src={profileUser.avatarUrl} className="object-cover" />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white font-bold text-2xl">
                        {profileUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-400 border-4 border-white rounded-full animate-pulse" />
                  </div>
                  
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{profileUser.name}</h1>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-blue-200">
                        Faculty
                      </Badge>
                      <Badge variant="outline" className="border-gold-200 text-gold-700">
                        <Star className="w-3 h-3 mr-1 fill-current" />
                        Professor
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      {profileUser.college && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <GraduationCap className="w-4 h-4" />
                          <span>{profileUser.college}</span>
                        </div>
                      )}
                      {profileUser.department && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Building2 className="w-4 h-4" />
                          <span>{profileUser.department}</span>
                        </div>
                      )}
                      {profileUser.email && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="w-4 h-4" />
                          <span>{profileUser.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {currentUser && currentUser.id !== userId && (
                  <div className="flex items-center gap-3 lg:ml-auto">
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Message
                    </Button>
                    
                    <Button
                      onClick={handleFollow}
                      disabled={followLoading}
                      className={`flex items-center gap-2 ${
                        isFollowing 
                          ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600' 
                          : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600'
                      }`}
                    >
                      {followLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isFollowing ? (
                        <UserX className="w-4 h-4" />
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )}
                      {isFollowing ? 'Unfollow' : 'Follow'}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <Heart className="w-5 h-5 text-pink-500 mr-2" />
                <div className="text-2xl font-bold text-gray-900">{networkStats.followersCount}</div>
              </div>
              <div className="text-sm text-gray-600">Followers</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-5 h-5 text-blue-500 mr-2" />
                <div className="text-2xl font-bold text-gray-900">{networkStats.followingCount}</div>
              </div>
              <div className="text-sm text-gray-600">Following</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <Eye className="w-5 h-5 text-green-500 mr-2" />
                <div className="text-2xl font-bold text-gray-900">{networkStats.profileViews}</div>
              </div>
              <div className="text-sm text-gray-600">Profile Views</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="w-5 h-5 text-orange-500 mr-2" />
                <div className="text-2xl font-bold text-gray-900">{networkStats.searchAppearances}</div>
              </div>
              <div className="text-sm text-gray-600">Appearances</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Profile Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* About Section */}
          <div className="lg:col-span-2">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  About
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  Experienced faculty member at {profileUser.college || 'University'}, dedicated to education and research. 
                  Passionate about mentoring students and contributing to academic excellence in {profileUser.department || 'the field'}.
                </p>
              </CardContent>
            </Card>

            {/* Professional Info */}
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-indigo-600" />
                  Professional Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-600">Institution</span>
                    <span className="font-medium">{profileUser.college || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-600">Department</span>
                    <span className="font-medium">{profileUser.department || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-600">Position</span>
                    <span className="font-medium">Faculty Member</span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-gray-600">Status</span>
                    <Badge className="bg-blue-100 text-blue-700">Active Faculty</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-orange-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {currentUser && currentUser.id !== userId && (
                  <>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Send Message
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Contact Info
                    </Button>
                  </>
                )}
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.history.back()}
                >
                  ← Back to Network
                </Button>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
