'use client';

import React, { useState, useRef } from 'react';
import { 
  X, 
  Image, 
  Link, 
  Hash, 
  Globe, 
  Users, 
  Building,
  Award,
  Trophy,
  FileText,
  Calendar,
  Briefcase,
  Megaphone,
  UserPlus,
  Upload,
  Plus,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PostType, CreatePostRequest, POST_PERMISSIONS, Post } from '@/types/post';
import { useAuth } from '@/contexts/AuthContext';
import { networkApi } from '@/lib/networkApi';
import { mediaUploadService } from '@/lib/mediaUpload';
import toast from 'react-hot-toast';

interface CreatePostModalProps {
  onClose: () => void;
  onSubmit: (postData: CreatePostRequest) => Promise<Post>;
  editingPost?: Post; // Post being edited
}

interface PostTypeOption {
  id: PostType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({
  onClose,
  onSubmit,
  editingPost
}) => {
  const { user } = useAuth();
  const [postType, setPostType] = useState<PostType>(editingPost?.type || 'GENERAL');
  const [content, setContent] = useState(editingPost?.content || '');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'COLLEGE'>(editingPost?.visibility === 'DEPARTMENT' ? 'COLLEGE' : (editingPost?.visibility as 'PUBLIC' | 'COLLEGE') || 'COLLEGE');
  const [tags, setTags] = useState<string[]>(editingPost?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [links, setLinks] = useState<Array<{ url: string; title?: string }>>(
    editingPost?.links?.map((link: any) => ({ url: link.url, title: link.title })) || []
  );
  const [linkInput, setLinkInput] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [uploadedMediaIds, setUploadedMediaIds] = useState<string[]>([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Collaboration-specific fields
  const [requiredSkills, setRequiredSkills] = useState<string[]>(
    editingPost?.collaborationData?.requiredSkills || []
  );
  const [skillInput, setSkillInput] = useState('');
  const [capacity, setCapacity] = useState(editingPost?.collaborationData?.capacity || 1);
  const [deadline, setDeadline] = useState(editingPost?.collaborationData?.deadline || '');
  const [applyInApp, setApplyInApp] = useState(editingPost?.collaborationData?.applyInApp ?? true);
  const [applyLink, setApplyLink] = useState(editingPost?.collaborationData?.applyLink || '');

  // Project update fields
  const [projectTitle, setProjectTitle] = useState(editingPost?.projectData?.projectTitle || '');
  const [milestone, setMilestone] = useState(editingPost?.projectData?.milestone || '');
  const [progress, setProgress] = useState(editingPost?.projectData?.progress || 0);
  const [teamMembers, setTeamMembers] = useState<string[]>(editingPost?.projectData?.teamMembers || []);
  const [memberInput, setMemberInput] = useState('');

  // Mentions functionality
  const [mentions, setMentions] = useState<string[]>([]);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionSuggestions, setMentionSuggestions] = useState<Array<{id: string; name: string; avatar?: string}>>([]);

  // Event-specific fields
  const [eventTitle, setEventTitle] = useState(editingPost?.eventData?.title || '');
  const [eventDate, setEventDate] = useState(editingPost?.eventData?.date || '');
  const [eventLocation, setEventLocation] = useState(editingPost?.eventData?.location || '');
  const [eventType, setEventType] = useState<'workshop' | 'seminar' | 'conference' | 'competition'>(editingPost?.eventData?.type || 'workshop');
  const [registrationRequired, setRegistrationRequired] = useState(editingPost?.eventData?.registrationRequired || false);
  const [eventCapacity, setEventCapacity] = useState<number | undefined>(editingPost?.eventData?.capacity);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const userRole = user?.role || 'student';
  const permissions = POST_PERMISSIONS[userRole];

  const postTypeOptions: PostTypeOption[] = [
    {
      id: 'general' as PostType,
      label: 'General Post',
      description: 'Share thoughts, updates, or general content',
      icon: <FileText className="w-5 h-5" />,
      color: 'text-gray-700',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    },
    {
      id: 'project_update' as PostType,
      label: 'Project Update',
      description: 'Share progress on your projects',
      icon: <FileText className="w-5 h-5" />,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'collaboration' as PostType,
      label: 'Collaboration',
      description: 'Find teammates for projects or research',
      icon: <UserPlus className="w-5 h-5" />,
      color: 'text-green-700',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      id: 'event' as PostType,
      label: 'Event',
      description: 'Announce workshops, seminars, or conferences',
      icon: <Calendar className="w-5 h-5" />,
      color: 'text-orange-700',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      id: 'job_posting' as PostType,
      label: 'Job Posting',
      description: 'Share job opportunities or internships',
      icon: <Briefcase className="w-5 h-5" />,
      color: 'text-indigo-700',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200'
    },
    {
      id: 'announcement' as PostType,
      label: 'Announcement',
      description: 'Make official announcements',
      icon: <Megaphone className="w-5 h-5" />,
      color: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    }
  ].filter(option => permissions.canCreate.includes(option.id));

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleAddLink = () => {
    if (linkInput.trim()) {
      setLinks([...links, { url: linkInput.trim(), title: linkTitle.trim() || undefined }]);
      setLinkInput('');
      setLinkTitle('');
    }
  };

  const handleRemoveLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !requiredSkills.includes(skillInput.trim())) {
      setRequiredSkills([...requiredSkills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setRequiredSkills(requiredSkills.filter(skill => skill !== skillToRemove));
  };

  const handleAddMember = () => {
    if (memberInput.trim() && !teamMembers.includes(memberInput.trim())) {
      setTeamMembers([...teamMembers, memberInput.trim()]);
      setMemberInput('');
    }
  };

  const handleRemoveMember = (memberToRemove: string) => {
    setTeamMembers(teamMembers.filter(member => member !== memberToRemove));
  };

  // Handle mentions in content
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);
    
    // Check for @ mentions
    const mentionMatch = value.match(/@(\w*)$/);
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowMentionSuggestions(true);
      // TODO: Fetch user suggestions based on query
      // For now, mock some suggestions
      setMentionSuggestions([
        { id: '1', name: 'John Doe', avatar: '' },
        { id: '2', name: 'Jane Smith', avatar: '' },
        { id: '3', name: 'Mike Johnson', avatar: '' }
      ].filter(user => user.name.toLowerCase().includes(mentionQuery.toLowerCase())));
    } else {
      setShowMentionSuggestions(false);
    }
  };

  const handleMentionSelect = (user: {id: string; name: string}) => {
    const newContent = content.replace(/@\w*$/, `@${user.name} `);
    setContent(newContent);
    setMentions(prev => [...prev, user.id]);
    setShowMentionSuggestions(false);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setMediaFiles(prev => [...prev, ...files]);
    
    // Auto-upload files when selected
    await uploadMediaFiles(files);
  };

  const uploadMediaFiles = async (files: File[]) => {
    if (files.length === 0) return;
    
    setIsUploadingMedia(true);
    try {
      const mediaIds = await mediaUploadService.uploadFiles(files, (progress) => {
        // Update UI based on upload progress if needed
        console.log('Upload progress:', progress);
      });
      
      setUploadedMediaIds(prev => [...prev, ...mediaIds]);
      toast.success(`Uploaded ${files.length} file(s) successfully`);
    } catch (error) {
      console.error('Media upload failed:', error);
      toast.error('Failed to upload media files');
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleRemoveFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    if (!content.trim()) {
      toast.error('Please enter some content for your post');
      return false;
    }

    if (postType === 'COLLABORATION') {
      if (capacity < 1) {
        toast.error('Collaboration capacity must be at least 1');
        return false;
      }
      if (!deadline) {
        toast.error('Please set a deadline for the collaboration');
        return false;
      }
      if (!applyInApp && !applyLink.trim()) {
        toast.error('Please provide an application link or enable in-app applications');
        return false;
      }
    }

    if (postType === 'PROJECT_UPDATE') {
      if (!projectTitle.trim()) {
        toast.error('Please enter a project title');
        return false;
      }
      if (!milestone.trim()) {
        toast.error('Please enter a milestone description');
        return false;
      }
    }

    if (postType === 'EVENT') {
      if (!eventTitle.trim()) {
        toast.error('Please enter an event title');
        return false;
      }
      if (!eventDate) {
        toast.error('Please set an event date');
        return false;
      }
      if (!eventLocation.trim()) {
        toast.error('Please enter an event location');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const postData: CreatePostRequest = {
        type: postType,
        content: content.trim(),
        visibility,
        tags,
        links: links.length > 0 ? links : undefined,
        mediaIds: uploadedMediaIds.length > 0 ? uploadedMediaIds : undefined
      };

      // Add type-specific data
      if (postType === 'COLLABORATION') {
        postData.collaborationData = {
          requiredSkills,
          capacity,
          deadline,
          applyInApp,
          applyLink: applyInApp ? undefined : applyLink
        };
      }

      if (postType === 'EVENT') {
        postData.eventData = {
          title: eventTitle,
          date: eventDate,
          location: eventLocation,
          type: eventType,
          registrationRequired,
          capacity: eventCapacity
        };
      }

      if (postType === 'PROJECT_UPDATE') {
        postData.projectData = {
          projectTitle,
          milestone,
          progress,
          teamMembers
        };
      }

      // If editing, call update instead of create
      if (editingPost) {
        await networkApi.updatePost(editingPost.id, postData);
        
        // Associate media with existing post if any
        if (uploadedMediaIds.length > 0) {
          try {
            await networkApi.associateMediaWithPost(editingPost.id, uploadedMediaIds);
            console.log('Media associated with updated post');
          } catch (error) {
            console.error('Failed to associate media with updated post:', error);
            toast.error('Post updated but media association failed');
          }
        }
        
        toast.success('Post updated successfully!');
      } else {
        // Create post first, then associate media separately
        const createdPost = await onSubmit({
          ...postData,
          mediaIds: undefined // Don't include mediaIds in initial post creation
        });
        
        // Associate media with the newly created post
        if (uploadedMediaIds.length > 0 && createdPost.id) {
          try {
            await networkApi.associateMediaWithPost(createdPost.id, uploadedMediaIds);
            console.log('Media associated with new post');
          } catch (error) {
            console.error('Failed to associate media with new post:', error);
            toast.error('Post created but media association failed');
          }
        }
      }
      
      onClose();
    } catch (error) {
      toast.error('Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCollaborationFields = () => {
    if (postType !== 'COLLABORATION') return null;

    return (
      <div className="space-y-4 p-4 bg-green-50 border border-green-200 rounded-lg">
        <h4 className="font-medium text-green-800">Collaboration Details</h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Required Skills
          </label>
          <div className="flex space-x-2 mb-2">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
              placeholder="Enter a skill"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {requiredSkills.map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="ml-2 text-green-600 hover:text-green-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Team Capacity
            </label>
            <input
              type="number"
              min="1"
              value={capacity}
              onChange={(e) => setCapacity(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Application Deadline
            </label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={applyInApp}
              onChange={(e) => setApplyInApp(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Allow in-app applications</span>
          </label>
        </div>

        {!applyInApp && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              External Application Link
            </label>
            <input
              type="url"
              value={applyLink}
              onChange={(e) => setApplyLink(e.target.value)}
              placeholder="https://example.com/apply"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}
      </div>
    );
  };

  const renderProjectUpdateFields = () => {
    if (postType !== 'PROJECT_UPDATE') return null;

    return (
      <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-800">Project Update Details</h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project Title
          </label>
          <input
            type="text"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            placeholder="Enter project title"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Milestone Description
          </label>
          <input
            type="text"
            value={milestone}
            onChange={(e) => setMilestone(e.target.value)}
            placeholder="What milestone did you achieve?"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Progress ({progress}%)
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={(e) => setProgress(parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Team Members
          </label>
          <div className="flex space-x-2 mb-2">
            <input
              type="text"
              value={memberInput}
              onChange={(e) => setMemberInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMember())}
              placeholder="Enter team member name"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={handleAddMember}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {teamMembers.map((member, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
              >
                {member}
                <button
                  type="button"
                  onClick={() => handleRemoveMember(member)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderEventFields = () => {
    if (postType !== 'EVENT') return null;

    return (
      <div className="space-y-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
        <h4 className="font-medium text-orange-800">Event Details</h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Event Title
          </label>
          <input
            type="text"
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            placeholder="Enter event title"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date & Time
            </label>
            <input
              type="datetime-local"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Type
            </label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="workshop">Workshop</option>
              <option value="seminar">Seminar</option>
              <option value="conference">Conference</option>
              <option value="competition">Competition</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <input
            type="text"
            value={eventLocation}
            onChange={(e) => setEventLocation(e.target.value)}
            placeholder="Enter event location"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={registrationRequired}
              onChange={(e) => setRegistrationRequired(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Registration required</span>
          </label>

          {registrationRequired && (
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-700">Capacity:</label>
              <input
                type="number"
                min="1"
                value={eventCapacity || ''}
                onChange={(e) => setEventCapacity(parseInt(e.target.value) || undefined)}
                placeholder="Optional"
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingPost ? 'Edit Post' : 'Create New Post'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Post Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Post Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {postTypeOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setPostType(option.id)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    postType === option.id
                      ? `${option.borderColor} ${option.bgColor}`
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={option.color}>{option.icon}</span>
                    <span className="font-medium text-gray-900">{option.label}</span>
                  </div>
                  <p className="text-sm text-gray-600">{option.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content
            </label>
            <div className="relative">
              <textarea
                value={content}
                onChange={handleContentChange}
                placeholder="What would you like to share? Use @ to mention users"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              {showMentionSuggestions && mentionSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                  {mentionSuggestions.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleMentionSelect(user)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                      <span className="text-sm">{user.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Type-specific fields */}
          {renderCollaborationFields()}
          {renderProjectUpdateFields()}
          {renderEventFields()}

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Visibility
            </label>
            <div className="flex space-x-3">
              {[
                { value: 'PUBLIC', label: 'Public', icon: <Globe className="w-4 h-4" />, desc: 'Everyone can see' },
                { value: 'COLLEGE', label: 'College', icon: <Building className="w-4 h-4" />, desc: 'College members only' }
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setVisibility(option.value as any)}
                  className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                    visibility === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    {option.icon}
                    <span className="font-medium">{option.label}</span>
                  </div>
                  <p className="text-xs text-gray-600">{option.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Options */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
            >
              <span className="text-sm font-medium">Advanced Options</span>
              <motion.div
                animate={{ rotate: showAdvanced ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <Plus className="w-4 h-4" />
              </motion.div>
            </button>

            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 space-y-4"
                >
                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags
                    </label>
                    <div className="flex space-x-2 mb-2">
                      <div className="relative flex-1">
                        <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                          placeholder="Add a tag"
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                        >
                          #{tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Links */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Links
                    </label>
                    <div className="space-y-2 mb-2">
                      <div className="flex space-x-2">
                        <div className="relative flex-1">
                          <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="url"
                            value={linkInput}
                            onChange={(e) => setLinkInput(e.target.value)}
                            placeholder="https://example.com"
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <input
                          type="text"
                          value={linkTitle}
                          onChange={(e) => setLinkTitle(e.target.value)}
                          placeholder="Link title (optional)"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={handleAddLink}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {links.map((link, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-gray-900">{link.title || 'Link'}</p>
                            <p className="text-sm text-gray-600">{link.url}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveLink(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Media Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Media
                    </label>
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors"
                      onDrop={(e) => {
                        e.preventDefault();
                        const files = Array.from(e.dataTransfer.files);
                        setMediaFiles(prev => [...prev, ...files]);
                        uploadMediaFiles(files);
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDragEnter={(e) => e.preventDefault()}
                    >
                      <Upload className={`w-8 h-8 mx-auto mb-2 ${
                        isUploadingMedia ? 'text-blue-500 animate-pulse' : 'text-gray-400'
                      }`} />
                      <p className="text-sm text-gray-600 mb-2">
                        {isUploadingMedia ? 'Uploading...' : 'Drag and drop files here, or click to select'}
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,video/*,.pdf,.doc,.docx,.txt,.ppt,.pptx"
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={isUploadingMedia}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingMedia}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUploadingMedia ? 'Uploading...' : 'Select Files'}
                      </button>
                    </div>
                    {mediaFiles.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {mediaFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <Image className="w-5 h-5 text-gray-500" />
                              <div>
                                <p className="font-medium text-gray-900">{file.name}</p>
                                <p className="text-sm text-gray-600">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {uploadedMediaIds[index] && (
                                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                                  Uploaded
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveFile(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !content.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Creating...' : editingPost ? 'Update Post' : 'Create Post'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default CreatePostModal;
