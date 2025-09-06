'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppDispatch } from '@/store/hooks';
import { createPostThunk, fetchFeedPosts } from '@/store/slices/feedSlice';
import { mediaUploadService, UploadProgress } from '@/lib/mediaUpload';
import toast from 'react-hot-toast';
import { 
  User as UserIcon, 
  Image, 
  Video, 
  Calendar, 
  Award,
  Briefcase,
  Send,
  X,
  Sparkles,
  Globe,
  Users,
  Lock,
  ChevronDown,
  MapPin,
  Clock,
  Link,
  Tag,
  FileText,
  Handshake,
  Upload,
  Trash2,
  Megaphone,
  ExternalLink
} from 'lucide-react';

export default function CreatePost() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const [content, setContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [postType, setPostType] = useState<'GENERAL' | 'PROJECT_UPDATE' | 'COLLABORATION' | 'EVENT' | 'JOB_POSTING' | 'BADGE_AWARD'>('GENERAL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visibility, setVisibility] = useState<'PUBLIC' | 'COLLEGE'>('PUBLIC');
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);
  
  // Post type specific fields
  const [projectData, setProjectData] = useState({
    projectTitle: '',
    milestone: '',
    progress: 0,
    teamMembers: '',
    githubUrl: '',
    demoUrl: '',
    techStack: ''
  });
  
  const [collaborationData, setCollaborationData] = useState({
    requiredSkills: '',
    capacity: 1,
    deadline: '',
    applyInApp: true,
    applyLink: ''
  });
  
  const [eventData, setEventData] = useState({
    title: '',
    date: '',
    location: '',
    type: 'workshop',
    registrationRequired: false,
    capacity: 0,
    registrationUrl: ''
  });
  
  const [jobData, setJobData] = useState({
    title: '',
    company: '',
    location: '',
    type: 'internship',
    deadline: '',
    applyUrl: '',
    salaryRange: ''
  });
  
  const [badgeData, setBadgeData] = useState({
    badgeName: '',
    studentName: '',
    reason: ''
  });
  
  const [tags, setTags] = useState('');
  const [links, setLinks] = useState('');
  const [mediaIds, setMediaIds] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Map<string, UploadProgress>>(new Map());
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const handleFileUpload = async (files: FileList | null, type: 'image' | 'video') => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const fileArray = Array.from(files);
    
    try {
      const uploadedIds = await mediaUploadService.uploadFiles(fileArray, (progress) => {
        setUploadProgress(prev => {
          const newMap = new Map(prev);
          const fileKey = `${progress.file.name}-${progress.file.size}`;
          newMap.set(fileKey, progress);
          return newMap;
        });
      });

      setMediaIds(prev => [...prev, ...uploadedIds]);
      toast.success(`${uploadedIds.length} file(s) uploaded successfully!`);
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload files. Please try again.');
    } finally {
      setIsUploading(false);
      // Clear progress after a delay
      setTimeout(() => {
        setUploadProgress(new Map());
      }, 2000);
    }
  };

  const removeMedia = (mediaId: string) => {
    setMediaIds(prev => prev.filter(id => id !== mediaId));
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    
    setIsSubmitting(true);
    try {
      const postData: any = {
        type: postType,
        content: content.trim(),
        visibility: visibility,
        authorCollegeId: user?.collegeId || undefined,
        authorDepartment: user?.department || undefined,
        authorAvatarUrl: user?.avatar || undefined
      };
      
      console.log('=== FRONTEND POST CREATION DEBUG ===');
      console.log('Full user object:', JSON.stringify(user, null, 2));
      console.log('User collegeId:', user?.collegeId);
      console.log('User department:', user?.department);
      console.log('User avatar:', user?.avatar);
      console.log('Post data being sent:', JSON.stringify(postData, null, 2));
      
      // Add type-specific fields based on backend API
      if (postType === 'PROJECT_UPDATE') {
        postData.projectData = {
          ...projectData,
          teamMembers: projectData.teamMembers.split(',').map(m => m.trim()).filter(m => m),
          techStack: projectData.techStack.split(',').map(t => t.trim()).filter(t => t)
        };
      } else if (postType === 'COLLABORATION') {
        postData.collaborationData = {
          ...collaborationData,
          requiredSkills: collaborationData.requiredSkills.split(',').map(s => s.trim()).filter(s => s)
        };
      } else if (postType === 'EVENT') {
        postData.eventData = eventData;
      } else if (postType === 'JOB_POSTING') {
        postData.jobData = jobData;
      } else if (postType === 'BADGE_AWARD') {
        postData.badgeData = badgeData;
      }
      
      if (tags.trim()) {
        postData.tags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      }
      
      if (links.trim()) {
        postData.links = links.split(',').map((link, index) => ({
          url: link.trim(),
          title: `Link ${index + 1}`,
          order: index
        })).filter(link => link.url);
      }
      
      if (mediaIds.length > 0) {
        postData.mediaIds = mediaIds;
      }
      
      await dispatch(createPostThunk(postData)).unwrap();
      
      // Refresh feed after successful post creation
      dispatch(fetchFeedPosts({ scope: 'global', refresh: true }));
      
      // Reset all fields
      setContent('');
      setPostType('GENERAL');
      setVisibility('PUBLIC');
      setTags('');
      setLinks('');
      setMediaIds([]);
      setProjectData({
        projectTitle: '',
        milestone: '',
        progress: 0,
        teamMembers: '',
        githubUrl: '',
        demoUrl: '',
        techStack: ''
      });
      setJobData({
        title: '',
        company: '',
        location: '',
        type: 'full-time',
        deadline: '',
        applyUrl: '',
        salaryRange: ''
      });
      setBadgeData({
        badgeName: '',
        studentName: '',
        reason: ''
      });
      setMediaIds([]);
      setUploadProgress(new Map());
      toast.success('Post created successfully!');
    } catch (error: any) {
      console.error('Failed to create post:', error);
      toast.error(error.message || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const postTypeOptions = [
    { value: 'GENERAL', label: 'General Update', icon: FileText, description: 'Share thoughts, updates, or general content', color: 'text-blue-600' },
    { value: 'PROJECT_UPDATE', label: 'Project Update', icon: Briefcase, description: 'Share progress on your projects', color: 'text-green-600' },
    { value: 'COLLABORATION', label: 'Collaboration', icon: Handshake, description: 'Find team members or collaborators', color: 'text-purple-600' },
    { value: 'EVENT', label: 'Event', icon: Calendar, description: 'Announce events (Faculty/Admin only)', color: 'text-orange-600' },
    { value: 'JOB_POSTING', label: 'Job Posting', icon: Briefcase, description: 'Post job opportunities (Faculty/Admin only)', color: 'text-indigo-600' },
    { value: 'BADGE_AWARD', label: 'Achievement', icon: Award, description: 'Award badges (Faculty/Admin only)', color: 'text-yellow-600' },
  ];
  
  const visibilityOptions = [
    { value: 'PUBLIC', label: 'Public', icon: Globe, description: 'Anyone can see this post' },
    { value: 'COLLEGE', label: 'College Only', icon: Users, description: 'Only people from your college can see this' },
  ];
  
  const selectedVisibility = visibilityOptions.find(option => option.value === visibility)!;
  
  const renderTypeSpecificFields = () => {
    const inputClass = "w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm";
    
    switch (postType) {
      case 'GENERAL':
        return (
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-800">Additional Links</h4>
            <div className="relative">
              <ExternalLink className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Add links (comma separated URLs)"
                value={links}
                onChange={(e) => setLinks(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <p className="text-xs text-gray-500">Add relevant links to share with your post (e.g., articles, resources, websites)</p>
          </div>
        );
        
      case 'PROJECT_UPDATE':
        return (
          <div className="space-y-3 p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="text-sm font-semibold text-green-800">Project Details</h4>
            <input
              type="text"
              placeholder="Project title *"
              value={projectData.projectTitle}
              onChange={(e) => setProjectData({...projectData, projectTitle: e.target.value})}
              className={inputClass}
              required
            />
            <input
              type="text"
              placeholder="Current milestone"
              value={projectData.milestone}
              onChange={(e) => setProjectData({...projectData, milestone: e.target.value})}
              className={inputClass}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="number"
                placeholder="Progress %"
                min="0"
                max="100"
                value={projectData.progress}
                onChange={(e) => setProjectData({...projectData, progress: parseInt(e.target.value) || 0})}
                className={inputClass}
              />
              <input
                type="text"
                placeholder="Team members (comma separated)"
                value={projectData.teamMembers}
                onChange={(e) => setProjectData({...projectData, teamMembers: e.target.value})}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="url"
                placeholder="GitHub URL"
                value={projectData.githubUrl}
                onChange={(e) => setProjectData({...projectData, githubUrl: e.target.value})}
                className={inputClass}
              />
              <input
                type="url"
                placeholder="Demo URL"
                value={projectData.demoUrl}
                onChange={(e) => setProjectData({...projectData, demoUrl: e.target.value})}
                className={inputClass}
              />
            </div>
            <input
              type="text"
              placeholder="Tech stack (comma separated)"
              value={projectData.techStack}
              onChange={(e) => setProjectData({...projectData, techStack: e.target.value})}
              className={inputClass}
            />
          </div>
        );
        
      case 'COLLABORATION':
        return (
          <div className="space-y-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h4 className="text-sm font-semibold text-purple-800">Collaboration Details</h4>
            <input
              type="text"
              placeholder="Required skills (comma separated) *"
              value={collaborationData.requiredSkills}
              onChange={(e) => setCollaborationData({...collaborationData, requiredSkills: e.target.value})}
              className={inputClass}
              required
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="number"
                placeholder="Team capacity"
                min="1"
                value={collaborationData.capacity}
                onChange={(e) => setCollaborationData({...collaborationData, capacity: parseInt(e.target.value) || 1})}
                className={inputClass}
              />
              <input
                type="datetime-local"
                placeholder="Application deadline"
                value={collaborationData.deadline}
                onChange={(e) => setCollaborationData({...collaborationData, deadline: e.target.value})}
                className={inputClass}
              />
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={collaborationData.applyInApp}
                  onChange={(e) => setCollaborationData({...collaborationData, applyInApp: e.target.checked})}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Apply in app</span>
              </label>
            </div>
            {!collaborationData.applyInApp && (
              <input
                type="url"
                placeholder="External application link"
                value={collaborationData.applyLink}
                onChange={(e) => setCollaborationData({...collaborationData, applyLink: e.target.value})}
                className={inputClass}
              />
            )}
          </div>
        );
        
      case 'EVENT':
        return (
          <div className="space-y-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <h4 className="text-sm font-semibold text-orange-800">Event Details</h4>
            <input
              type="text"
              placeholder="Event title *"
              value={eventData.title}
              onChange={(e) => setEventData({...eventData, title: e.target.value})}
              className={inputClass}
              required
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="datetime-local"
                placeholder="Event date & time *"
                value={eventData.date}
                onChange={(e) => setEventData({...eventData, date: e.target.value})}
                className={inputClass}
                required
              />
              <input
                type="text"
                placeholder="Location"
                value={eventData.location}
                onChange={(e) => setEventData({...eventData, location: e.target.value})}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={eventData.type}
                onChange={(e) => setEventData({...eventData, type: e.target.value})}
                className={inputClass}
              >
                <option value="workshop">Workshop</option>
                <option value="seminar">Seminar</option>
                <option value="hackathon">Hackathon</option>
                <option value="meetup">Meetup</option>
              </select>
              <input
                type="number"
                placeholder="Capacity (optional)"
                min="0"
                value={eventData.capacity}
                onChange={(e) => setEventData({...eventData, capacity: parseInt(e.target.value) || 0})}
                className={inputClass}
              />
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={eventData.registrationRequired}
                  onChange={(e) => setEventData({...eventData, registrationRequired: e.target.checked})}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Registration required</span>
              </label>
            </div>
            {eventData.registrationRequired && (
              <input
                type="url"
                placeholder="Registration URL"
                value={eventData.registrationUrl}
                onChange={(e) => setEventData({...eventData, registrationUrl: e.target.value})}
                className={inputClass}
              />
            )}
          </div>
        );
        
      case 'JOB_POSTING':
        return (
          <div className="space-y-3 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
            <h4 className="text-sm font-semibold text-indigo-800">Job Details</h4>
            <input
              type="text"
              placeholder="Job title *"
              value={jobData.title}
              onChange={(e) => setJobData({...jobData, title: e.target.value})}
              className={inputClass}
              required
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Company *"
                value={jobData.company}
                onChange={(e) => setJobData({...jobData, company: e.target.value})}
                className={inputClass}
                required
              />
              <input
                type="text"
                placeholder="Location"
                value={jobData.location}
                onChange={(e) => setJobData({...jobData, location: e.target.value})}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={jobData.type}
                onChange={(e) => setJobData({...jobData, type: e.target.value})}
                className={inputClass}
              >
                <option value="internship">Internship</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
              </select>
              <input
                type="datetime-local"
                placeholder="Application deadline"
                value={jobData.deadline}
                onChange={(e) => setJobData({...jobData, deadline: e.target.value})}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="url"
                placeholder="Application URL *"
                value={jobData.applyUrl}
                onChange={(e) => setJobData({...jobData, applyUrl: e.target.value})}
                className={inputClass}
                required
              />
              <input
                type="text"
                placeholder="Salary range (optional)"
                value={jobData.salaryRange}
                onChange={(e) => setJobData({...jobData, salaryRange: e.target.value})}
                className={inputClass}
              />
            </div>
          </div>
        );
        
      case 'BADGE_AWARD':
        return (
          <div className="space-y-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h4 className="text-sm font-semibold text-yellow-800">Badge Award Details</h4>
            <input
              type="text"
              placeholder="Badge name *"
              value={badgeData.badgeName}
              onChange={(e) => setBadgeData({...badgeData, badgeName: e.target.value})}
              className={inputClass}
              required
            />
            <input
              type="text"
              placeholder="Student name *"
              value={badgeData.studentName}
              onChange={(e) => setBadgeData({...badgeData, studentName: e.target.value})}
              className={inputClass}
              required
            />
            <textarea
              placeholder="Reason for award *"
              value={badgeData.reason}
              onChange={(e) => setBadgeData({...badgeData, reason: e.target.value})}
              className={`${inputClass} min-h-[80px] resize-none`}
              required
            />
          </div>
        );
        
      default:
        return null;
    }
  };

  // Filter post types based on user role
  const getAvailablePostTypes = () => {
    const userRole = user?.role || 'student';
    
    if (userRole === 'student') {
      return postTypeOptions.filter(option => 
        ['GENERAL', 'PROJECT_UPDATE', 'COLLABORATION'].includes(option.value)
      );
    }
    
    return postTypeOptions; // Faculty and Admin can see all types
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-100">
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-white" />
                </div>
              )}
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{user.displayName}</h3>
            <p className="text-sm text-gray-500">{user.department || 'Student'}</p>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="space-y-4">
          {/* Post Type Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {getAvailablePostTypes().map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setPostType(option.value as any);
                  setIsExpanded(true);
                }}
                className={`p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                  postType === option.value
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                title={option.description}
              >
                <div className="flex flex-col items-center space-y-2">
                  <option.icon className={`w-6 h-6 ${
                    postType === option.value ? 'text-blue-600' : option.color
                  }`} />
                  <span className={`text-xs font-medium ${
                    postType === option.value ? 'text-blue-600' : 'text-gray-700'
                  }`}>
                    {option.label}
                  </span>
                </div>
              </button>
            ))}
          </div>
          
          {/* Content Area */}
          <div className="space-y-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setIsExpanded(true)}
              placeholder={`Share your ${postTypeOptions.find(p => p.value === postType)?.label.toLowerCase()}...`}
              className="w-full p-4 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200"
              rows={isExpanded ? 4 : 2}
            />
            
            {isExpanded && (
              <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                {/* Type-specific fields */}
                {renderTypeSpecificFields()}
                
                {/* Tags field for all post types */}
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Add tags (comma separated)"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Media Upload Progress */}
                {Array.from(uploadProgress.values()).length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Uploading files...</h4>
                    {Array.from(uploadProgress.values()).map((progress, index) => (
                      <div key={`${progress.file.name}-${index}`} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600 truncate">{progress.file.name}</span>
                          <span className="text-xs text-gray-500">
                            {progress.status === 'uploading' && `${progress.progress}%`}
                            {progress.status === 'completed' && '✓'}
                            {progress.status === 'error' && '✗'}
                          </span>
                        </div>
                        {progress.status === 'uploading' && (
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress.progress}%` }}
                            />
                          </div>
                        )}
                        {progress.status === 'error' && (
                          <p className="text-xs text-red-600">{progress.error}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Uploaded Media Display */}
                {mediaIds.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Attached files ({mediaIds.length})</h4>
                    <div className="flex flex-wrap gap-2">
                      {mediaIds.map((mediaId, index) => (
                        <div key={mediaId} className="flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                          <span>File {index + 1}</span>
                          <button
                            onClick={() => removeMedia(mediaId)}
                            className="ml-2 hover:text-red-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hidden file inputs */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileUpload(e.target.files, 'image')}
                  className="hidden"
                />
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={(e) => handleFileUpload(e.target.files, 'video')}
                  className="hidden"
                />

                
                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="flex items-center text-gray-600 hover:text-blue-600 text-sm font-medium transition-colors duration-200 hover:bg-blue-50 px-3 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Image className="w-4 h-4 mr-2" />
                      Photo
                    </button>
                    <button 
                      onClick={() => videoInputRef.current?.click()}
                      disabled={isUploading}
                      className="flex items-center text-gray-600 hover:text-green-600 text-sm font-medium transition-colors duration-200 hover:bg-green-50 px-3 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Video className="w-4 h-4 mr-2" />
                      Video
                    </button>
                    
                    {/* Visibility Selector */}
                    <div className="relative">
                      <button
                        onClick={() => setShowVisibilityMenu(!showVisibilityMenu)}
                        className="flex items-center text-gray-600 hover:text-purple-600 text-sm font-medium transition-colors duration-200 hover:bg-purple-50 px-3 py-2 rounded-lg"
                      >
                        <selectedVisibility.icon className="w-4 h-4 mr-2" />
                        {selectedVisibility.label}
                        <ChevronDown className="w-3 h-3 ml-1" />
                      </button>
                      
                      {showVisibilityMenu && (
                        <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                          <div className="p-2">
                            <div className="text-xs font-semibold text-gray-700 mb-2 px-2">Who can see this?</div>
                            {visibilityOptions.map((option) => (
                              <button
                                key={option.value}
                                onClick={() => {
                                  setVisibility(option.value as any);
                                  setShowVisibilityMenu(false);
                                }}
                                className={`w-full flex items-start p-2 rounded-lg text-left transition-colors duration-200 ${
                                  visibility === option.value
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'hover:bg-gray-50 text-gray-700'
                                }`}
                              >
                                <option.icon className="w-4 h-4 mr-3 mt-0.5 flex-shrink-0" />
                                <div>
                                  <div className="text-sm font-medium">{option.label}</div>
                                  <div className="text-xs text-gray-500">{option.description}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => {
                        setIsExpanded(false);
                        setContent('');
                        setPostType('GENERAL');
                        setVisibility('PUBLIC');
                        // Reset all type-specific data
                        setProjectData({
                          projectTitle: '',
                          milestone: '',
                          progress: 0,
                          teamMembers: '',
                          githubUrl: '',
                          demoUrl: '',
                          techStack: ''
                        });
                        setCollaborationData({
                          requiredSkills: '',
                          capacity: 1,
                          deadline: '',
                          applyInApp: true,
                          applyLink: ''
                        });
                        setEventData({
                          title: '',
                          date: '',
                          location: '',
                          type: 'workshop',
                          registrationRequired: false,
                          capacity: 0,
                          registrationUrl: ''
                        });
                        setJobData({
                          title: '',
                          company: '',
                          location: '',
                          type: 'internship',
                          deadline: '',
                          applyUrl: '',
                          salaryRange: ''
                        });
                        setBadgeData({
                          badgeName: '',
                          studentName: '',
                          reason: ''
                        });
                        setTags('');
                        setMediaIds([]);
                        setUploadProgress(new Map());
                        setShowVisibilityMenu(false);
                      }}
                      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={!content.trim() || isSubmitting || isUploading}
                      className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Posting...
                        </div>
                      ) : (
                        'Post'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
