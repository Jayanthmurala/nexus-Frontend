'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Camera, 
  Edit3, 
  MapPin, 
  Calendar, 
  Mail, 
  UserPlus, 
  MessageCircle,
  Star,
  Award,
  Verified,
  Github,
  Linkedin,
  Twitter,
  Globe
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { uploadAvatar, CloudinaryUploadError } from '@/lib/uploadUtils';
import toast from 'react-hot-toast';

interface ProfileHeroProps {
  profile: {
    id: string;
    name: string;
    bio?: string;
    avatar?: string;
    avatarUrl?: string;
    department: string;
    college: string;
    role: 'faculty' | 'student';
    year?: number;
    collegeMemberId?: string;
    joinedAt: string;
    isVerified?: boolean;
    linkedin?: string;
    github?: string;
    twitter?: string;
    website?: string;
  };
  stats: {
    projects?: number;
    publications?: number;
    badges?: number;
    followers?: number;
    following?: number;
    skills?: number;
  };
  isOwnProfile: boolean;
  isFollowing?: boolean;
  onFollow?: () => void;
  onMessage?: () => void;
  onEditProfile?: () => void;
  onAvatarUpdate?: (url: string) => void;
  onNavigateToContact?: () => void;
}

export default function ProfileHero({ 
  profile, 
  stats, 
  isOwnProfile, 
  isFollowing, 
  onFollow, 
  onMessage, 
  onEditProfile,
  onAvatarUpdate,
  onNavigateToContact
}: ProfileHeroProps) {
  const { user } = useAuth();
  const [imageLoading, setImageLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const roleColors = {
    faculty: {
      gradient: 'from-purple-600 via-blue-600 to-indigo-600',
      accent: 'purple-500',
      badge: 'bg-purple-100 text-purple-800',
      button: 'bg-purple-600 hover:bg-purple-700'
    },
    student: {
      gradient: 'from-emerald-500 via-blue-500 to-cyan-600',
      accent: 'emerald-500',
      badge: 'bg-emerald-100 text-emerald-800',
      button: 'bg-emerald-600 hover:bg-emerald-700'
    }
  };

  const colors = roleColors[profile.role];

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageLoading(true);
    try {
      const avatarUrl = await uploadAvatar(file);
      if (onAvatarUpdate) {
        await onAvatarUpdate(avatarUrl);
      }
      toast.success('Profile picture updated!');
    } catch (error) {
      if (error instanceof CloudinaryUploadError) {
        toast.error(error.message);
      } else {
        toast.error('Failed to upload image');
      }
      console.error('Avatar upload error:', error);
    } finally {
      setImageLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!onFollow) return;
    setFollowLoading(true);
    try {
      await onFollow();
      toast.success(isFollowing ? 'Unfollowed successfully' : 'Following now!');
    } catch (error) {
      toast.error('Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative overflow-hidden"
    >
      {/* Background with animated gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-95`}>
        <div className="absolute inset-0 bg-black/10"></div>
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-white rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 py-12 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center lg:items-end gap-8">
            {/* Avatar Section */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="relative group"
            >
              <div className="relative">
                <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-full overflow-hidden ring-4 ring-white/20 shadow-2xl">
                  {(profile.avatarUrl || profile.avatar) ? (
                    <img
                      src={profile.avatarUrl || profile.avatar}
                      alt={profile.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center">
                      <span className="text-4xl lg:text-5xl font-bold text-white">
                        {profile.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  
                  {/* Loading overlay */}
                  {imageLoading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>

                {/* Camera overlay for own profile */}
                {isOwnProfile && (
                  <label className="absolute inset-0 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}

                {/* Verification badge */}
                {profile.isVerified && (
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center ring-4 ring-white shadow-lg">
                    <Verified className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            </motion.div>

            {/* Profile Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex-1 text-center lg:text-left"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-4">
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2 flex items-center justify-center lg:justify-start gap-2">
                    {profile.name}
                    {profile.isVerified && (
                      <Verified className="w-6 h-6 text-blue-300" />
                    )}
                  </h1>
                  
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 text-white/90">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors.badge} backdrop-blur-sm`}>
                      {profile.role === 'faculty' ? 'Faculty' : `Student ${profile.year ? `• Year ${profile.year}` : ''}`}
                    </span>
                    
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{profile.department}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">Joined {new Date(profile.joinedAt).getFullYear()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio */}
              {profile.bio && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="text-white/90 text-lg mb-6 max-w-2xl"
                >
                  {profile.bio}
                </motion.p>
              )}

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="flex flex-wrap justify-center lg:justify-start gap-6 mb-6"
              >
                {/* Show different stats based on role */}
                {profile.role === 'student' && (
                  <>
                    {stats.projects !== undefined && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{stats.projects}</div>
                        <div className="text-sm text-white/70">Projects</div>
                      </div>
                    )}
                    {stats.badges !== undefined && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white flex items-center justify-center gap-1">
                          <Award className="w-5 h-5" />
                          {stats.badges}
                        </div>
                        <div className="text-sm text-white/70">Badges</div>
                      </div>
                    )}
                    {stats.skills !== undefined && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{stats.skills}</div>
                        <div className="text-sm text-white/70">Skills</div>
                      </div>
                    )}
                    {profile.year && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{profile.year}</div>
                        <div className="text-sm text-white/70">Year</div>
                      </div>
                    )}
                  </>
                )}
                
                {/* Common stats for both roles */}
                {stats.followers !== undefined && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{stats.followers}</div>
                    <div className="text-sm text-white/70">Followers</div>
                  </div>
                )}
                {stats.following !== undefined && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{stats.following}</div>
                    <div className="text-sm text-white/70">Following</div>
                  </div>
                )}
              </motion.div>

              {/* Social Links */}
              {(profile.linkedin || profile.github || profile.twitter || profile.website) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55, duration: 0.5 }}
                  className="flex justify-center lg:justify-start gap-4 mb-6"
                >
                  {profile.linkedin && (
                    <a
                      href={profile.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-all duration-200 hover:scale-110 backdrop-blur-sm"
                    >
                      <Linkedin className="w-5 h-5 text-white" />
                    </a>
                  )}
                  {profile.github && (
                    <a
                      href={profile.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-all duration-200 hover:scale-110 backdrop-blur-sm"
                    >
                      <Github className="w-5 h-5 text-white" />
                    </a>
                  )}
                  {profile.twitter && (
                    <a
                      href={profile.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-all duration-200 hover:scale-110 backdrop-blur-sm"
                    >
                      <Twitter className="w-5 h-5 text-white" />
                    </a>
                  )}
                  {profile.website && (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-all duration-200 hover:scale-110 backdrop-blur-sm"
                    >
                      <Globe className="w-5 h-5 text-white" />
                    </a>
                  )}
                </motion.div>
              )}

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="flex flex-wrap justify-center lg:justify-start gap-3"
              >
                {isOwnProfile ? (
                  <button
                    onClick={onNavigateToContact || onEditProfile}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-medium rounded-xl transition-all duration-200 backdrop-blur-sm border border-white/20 hover:border-white/40 hover:scale-105"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleFollow}
                      disabled={followLoading}
                      className={`inline-flex items-center gap-2 px-6 py-3 font-medium rounded-xl transition-all duration-200 hover:scale-105 ${
                        isFollowing
                          ? 'bg-white/20 hover:bg-white/30 text-white border border-white/20 hover:border-white/40'
                          : `${colors.button} text-white shadow-lg hover:shadow-xl`
                      }`}
                    >
                      {followLoading ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )}
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                    
                    <button
                      onClick={onMessage}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-medium rounded-xl transition-all duration-200 backdrop-blur-sm border border-white/20 hover:border-white/40 hover:scale-105"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Message
                    </button>
                  </>
                )}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent"></div>
    </motion.div>
  );
}

// CSS for blob animation (add to globals.css)
const styles = `
@keyframes blob {
  0% {
    transform: translate(0px, 0px) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
  100% {
    transform: translate(0px, 0px) scale(1);
  }
}

.animate-blob {
  animation: blob 7s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}
`;
