'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Calendar, 
  Building, 
  GraduationCap, 
  Hash,
  Mail, 
  Phone, 
  Edit2, 
  Save, 
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import SkillsManager from './SkillsManager';

interface AboutTabProps {
  profile: {
    name?: string;
    bio?: string;
    department?: string;
    college?: string;
    year?: number;
    collegeMemberId?: string;
    contactInfo?: string;
    phoneNumber?: string;
    alternateEmail?: string;
    joinedAt?: string;
    skills?: string[];
    isFaculty?: boolean;
    [key: string]: any;
  };
  isOwnProfile: boolean;
  onUpdate?: (data: any) => Promise<void>;
}

export default function AboutTab({ profile, isOwnProfile, onUpdate }: AboutTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bio: profile.bio || '',
    contactInfo: profile.contactInfo || '',
    phoneNumber: profile.phoneNumber || '',
    alternateEmail: profile.alternateEmail || '',
    year: profile.year || 1,
    skills: profile.skills || []
  });

  const handleSave = async () => {
    if (!onUpdate) return;
    
    setLoading(true);
    try {
      console.log('AboutTab: Saving profile data:', formData);
      await onUpdate(formData);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('AboutTab: Failed to save profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      bio: profile.bio || '',
      contactInfo: profile.contactInfo || '',
      phoneNumber: profile.phoneNumber || '',
      alternateEmail: profile.alternateEmail || '',
      year: profile.year || 1,
      skills: profile.skills || []
    });
    setIsEditing(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Bio Section */}
      <motion.div variants={itemVariants} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-500" />
            About
          </h3>
          {isOwnProfile && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Edit Bio
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell us about yourself, your research interests, background, and achievements..."
              rows={6}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {profile.bio || 'No bio available.'}
          </p>
        )}
      </motion.div>

      {/* Basic Information */}
      <motion.div variants={itemVariants} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Building className="w-5 h-5 text-emerald-500" />
          Basic Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <Building className="w-5 h-5 text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">Department</div>
                <div className="font-medium text-gray-900">{profile.department || 'Not specified'}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <GraduationCap className="w-5 h-5 text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">College</div>
                <div className="font-medium text-gray-900">{profile.college || 'Not specified'}</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
{!profile.isFaculty && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div className="flex-1">
                  <div className="text-sm text-gray-500">Academic Year</div>
                  <div className="font-medium text-gray-900">Year {profile.year || 1}</div>
                </div>
              </div>
            )}

            {profile.collegeMemberId && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Hash className="w-5 h-5 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-500">Member ID</div>
                  <div className="font-medium text-gray-900">{profile.collegeMemberId}</div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <Calendar className="w-5 h-5 text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">Joined</div>
                <div className="font-medium text-gray-900">
                  {profile.joinedAt ? new Date(profile.joinedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long'
                  }) : 'Not available'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Contact Information */}
      <motion.div variants={itemVariants} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Mail className="w-5 h-5 text-purple-500" />
          Contact Information
        </h3>

        <div className="space-y-4">
          {/* Contact Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Information
            </label>
            <div className="p-3 bg-gray-50 rounded-xl">
              <span className="text-gray-700">
                {profile.contactInfo || 'Not provided'}
              </span>
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <Phone className="w-5 h-5 text-gray-500" />
              <span className="text-gray-700">
                {profile.phoneNumber || 'Not provided'}
              </span>
            </div>
          </div>

          {/* Alternate Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alternate Email
            </label>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <Mail className="w-5 h-5 text-gray-500" />
              <span className="text-gray-700">
                {profile.alternateEmail || 'Not provided'}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

{/* Skills Section - Only for Students */}
      {!profile.isFaculty && (
        <motion.div variants={itemVariants} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <SkillsManager
            skills={profile.skills || []}
            isEditable={isOwnProfile}
            onSkillsUpdate={(updatedSkills: string[]) => {
              // Trigger profile refresh
              if (onUpdate) {
                onUpdate({ skills: updatedSkills });
              }
            }}
          />
        </motion.div>
      )}
    </motion.div>
  );
}
