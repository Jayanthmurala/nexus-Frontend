'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Linkedin, 
  Github, 
  Twitter,
  Edit3,
  Save,
  X,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import ResumeUpload from './ResumeUpload';

interface ContactTabProps {
  profile: {
    contactInfo?: string;
    phoneNumber?: string;
    alternateEmail?: string;
    linkedIn?: string;
    github?: string;
    twitter?: string;
    website?: string;
    resumeUrl?: string;
    resumeFilename?: string;
  };
  role: 'faculty' | 'student';
  isOwnProfile: boolean;
  onUpdate?: (data: any) => Promise<void>;
}

export default function ContactTab({ profile, role, isOwnProfile, onUpdate }: ContactTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string>('');
  const [formData, setFormData] = useState({
    contactInfo: profile.contactInfo || '',
    phoneNumber: profile.phoneNumber || '',
    alternateEmail: profile.alternateEmail || '',
    linkedIn: profile.linkedIn || '',
    github: profile.github || '',
    twitter: profile.twitter || ''
  });

  const handleSave = async () => {
    if (!onUpdate) return;
    
    setLoading(true);
    try {
      await onUpdate(formData);
      setIsEditing(false);
      toast.success('Contact information updated successfully!');
    } catch (error) {
      toast.error('Failed to update contact information');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      contactInfo: profile.contactInfo || '',
      phoneNumber: profile.phoneNumber || '',
      alternateEmail: profile.alternateEmail || '',
      linkedIn: profile.linkedIn || '',
      github: profile.github || '',
      twitter: profile.twitter || ''
    });
    setIsEditing(false);
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopiedField(''), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const formatUrl = (url: string, platform: string) => {
    if (!url) return '';
    
    const platformUrls = {
      linkedin: 'https://linkedin.com/in/',
      github: 'https://github.com/',
      twitter: 'https://twitter.com/'
    };
    
    if (url.startsWith('http')) return url;
    if (url.startsWith('@')) url = url.substring(1);
    
    const baseUrl = platformUrls[platform as keyof typeof platformUrls];
    return baseUrl ? `${baseUrl}${url}` : `https://${url}`;
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

  const socialLinks = [
    {
      key: 'linkedIn',
      label: 'LinkedIn',
      icon: <Linkedin className="w-5 h-5" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      placeholder: 'your-linkedin-username or full URL'
    },
    {
      key: 'github',
      label: 'GitHub',
      icon: <Github className="w-5 h-5" />,
      color: 'text-gray-800',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      placeholder: 'your-github-username or full URL',
      show: role === 'student' || (role === 'faculty' && profile.github)
    },
    {
      key: 'twitter',
      label: 'Twitter',
      icon: <Twitter className="w-5 h-5" />,
      color: 'text-sky-600',
      bgColor: 'bg-sky-50',
      borderColor: 'border-sky-200',
      placeholder: '@your-twitter-handle or full URL',
      show: role === 'faculty' || (role === 'student' && profile.twitter)
    },
  ].filter(link => link.show !== false && link.key !== 'website');

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Contact Information</h2>
        {isOwnProfile && (
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Changes
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                Edit Contact Info
              </button>
            )}
          </div>
        )}
      </motion.div>

      {/* Basic Contact Information */}
      <motion.div variants={itemVariants} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Mail className="w-5 h-5 text-purple-500" />
          Basic Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Contact Info
            </label>
            {isEditing ? (
              <textarea
                value={formData.contactInfo}
                onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                placeholder="Office hours, preferred contact method, etc."
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
              />
            ) : (
              <div className="p-3 bg-gray-50 rounded-xl min-h-[80px] flex items-center">
                <span className="text-gray-700">
                  {profile.contactInfo || 'No additional contact information provided'}
                </span>
              </div>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="+1 (555) 123-4567"
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Phone className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700 flex-1">
                  {profile.phoneNumber || 'Not provided'}
                </span>
                {profile.phoneNumber && (
                  <button
                    onClick={() => copyToClipboard(profile.phoneNumber!, 'phone')}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {copiedField === 'phone' ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Alternate Email */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alternate Email
            </label>
            {isEditing ? (
              <input
                type="email"
                value={formData.alternateEmail}
                onChange={(e) => setFormData({ ...formData, alternateEmail: e.target.value })}
                placeholder="your.alternate@email.com"
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Mail className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700 flex-1">
                  {profile.alternateEmail || 'Not provided'}
                </span>
                {profile.alternateEmail && (
                  <button
                    onClick={() => copyToClipboard(profile.alternateEmail!, 'email')}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {copiedField === 'email' ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Resume Upload for Students */}
      {role === 'student' && isOwnProfile && (
        <motion.div variants={itemVariants} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <ResumeUpload
            currentResumeUrl={profile.resumeUrl}
            currentResumeFilename={profile.resumeFilename}
            onResumeUpdate={async (url: string, filename?: string) => {
              if (onUpdate) {
                await onUpdate({ 
                  resumeUrl: url,
                  resumeFilename: filename || ''
                });
              }
            }}
            disabled={loading}
          />
        </motion.div>
      )}

      {/* Social Links */}
      <motion.div variants={itemVariants} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Globe className="w-5 h-5 text-emerald-500" />
          Social Links & Online Presence
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {socialLinks.map((social) => {
            const value = profile[social.key as keyof typeof profile] as string;
            const formValue = formData[social.key as keyof typeof formData];
            
            return (
              <div key={social.key}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {social.label}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formValue}
                    onChange={(e) => setFormData({ ...formData, [social.key]: e.target.value })}
                    placeholder={social.placeholder}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <div className={`flex items-center gap-3 p-3 ${social.bgColor} ${social.borderColor} border rounded-xl`}>
                    <div className={social.color}>
                      {social.icon}
                    </div>
                    {value ? (
                      <>
                        <a
                          href={formatUrl(value, social.key)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${social.color} hover:underline flex-1 truncate`}
                        >
                          {value.startsWith('http') ? value : `@${value.replace('@', '')}`}
                        </a>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => copyToClipboard(formatUrl(value, social.key), social.key)}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {copiedField === social.key ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                          <a
                            href={formatUrl(value, social.key)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </>
                    ) : (
                      <span className="text-gray-500 flex-1">Not provided</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Quick Actions */}
      {!isOwnProfile && (
        <motion.div variants={itemVariants} className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            {profile.alternateEmail && (
              <a
                href={`mailto:${profile.alternateEmail}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Mail className="w-4 h-4" />
                Send Email
              </a>
            )}
            {profile.linkedIn && (
              <a
                href={formatUrl(profile.linkedIn, 'linkedin')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-colors"
              >
                <Linkedin className="w-4 h-4" />
                Connect on LinkedIn
              </a>
            )}
            {profile.github && (
              <a
                href={formatUrl(profile.github, 'github')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg transition-colors"
              >
                <Github className="w-4 h-4" />
                View GitHub
              </a>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
