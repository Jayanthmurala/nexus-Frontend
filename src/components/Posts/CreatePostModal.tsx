'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Upload, 
  Image as ImageIcon, 
  Video, 
  FileText, 
  Plus, 
  Minus, 
  Calendar, 
  MapPin, 
  Users, 
  Github, 
  Globe, 
  Briefcase, 
  Award, 
  Megaphone, 
  ExternalLink,
  Search,
  Clock,
  DollarSign
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { CreatePostRequest, PostType, PostVisibility } from '@/types/post';
import { networkApi } from '@/lib/networkApi';
import { toast } from 'react-hot-toast';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePostRequest) => Promise<void>;
  editData?: Partial<CreatePostRequest> & { id?: string };
  className?: string;
}

interface MediaFile {
  id: string;
  file: File;
  preview: string;
  type: 'image' | 'video' | 'document';
  uploaded?: boolean;
  uploadedId?: string;
}

interface TeamMember {
  id: string;
  name: string;
  isUser: boolean;
  userId?: string;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editData,
  className = ''
}) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // Form data
  const [postType, setPostType] = useState<PostType>('GENERAL');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<PostVisibility>('PUBLIC');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [links, setLinks] = useState<Array<{ url: string; title: string }>>([]);

  // Type-specific data
  const [projectData, setProjectData] = useState({
    projectTitle: '',
    milestone: '',
    progress: 0,
    teamMembers: [] as TeamMember[],
    githubUrl: '',
    demoUrl: '',
    techStack: [] as string[]
  });

  const [collaborationData, setCollaborationData] = useState({
    requiredSkills: [] as string[],
    capacity: 1,
    deadline: '',
    applyInApp: true,
    applyLink: ''
  });

  const [eventData, setEventData] = useState({
    title: '',
    date: '',
    location: '',
    type: 'workshop' as 'workshop' | 'seminar' | 'conference' | 'competition',
    registrationRequired: false,
    capacity: undefined as number | undefined,
    registrationUrl: '',
    showMap: false
  });

  const [jobData, setJobData] = useState({
    title: '',
    company: '',
    location: '',
    type: 'full-time' as 'full-time' | 'part-time' | 'internship' | 'contract',
    deadline: '',
    applyUrl: '',
    salaryRange: ''
  });

  const [badgeData, setBadgeData] = useState({
    badgeId: '',
    badgeName: '',
    description: '',
    criteria: '',
    rarity: 'common' as 'common' | 'rare' | 'epic' | 'legendary',
    isCustom: false
  });

  const [adData, setAdData] = useState({
    title: '',
    bannerUrl: '',
    ctaText: 'Learn More',
    ctaUrl: '',
    sponsored: true,
    impressionGoal: 1000,
    targetAudience: ['student'] as string[]
  });

  // Available post types based on user role
  const getAvailablePostTypes = () => {
    const baseTypes = [
      { value: 'GENERAL', label: 'General', icon: <FileText className="w-4 h-4" />, description: 'Share thoughts, updates, or media' },
      { value: 'PROJECT_UPDATE', label: 'Project Update', icon: <Github className="w-4 h-4" />, description: 'Share project progress and milestones' },
      { value: 'COLLABORATION', label: 'Collaboration', icon: <Users className="w-4 h-4" />, description: 'Find team members or collaborators' }
    ];

    if (user?.role === 'student') {
      return baseTypes;
    }

    const facultyTypes = [
      { value: 'EVENT', label: 'Event', icon: <Calendar className="w-4 h-4" />, description: 'Announce events and workshops' },
      { value: 'JOB_POSTING', label: 'Job Posting', icon: <Briefcase className="w-4 h-4" />, description: 'Share job opportunities' },
      { value: 'BADGE_AWARD', label: 'Badge Award', icon: <Award className="w-4 h-4" />, description: 'Award badges to students' },
      { value: 'ANNOUNCEMENT', label: 'Announcement', icon: <Megaphone className="w-4 h-4" />, description: 'Make official announcements' }
    ];

    if (user?.role === 'head_admin') {
      facultyTypes.push({
        value: 'AD_POST',
        label: 'Advertisement',
        icon: <ExternalLink className="w-4 h-4" />,
        description: 'Create sponsored content'
      });
    }

    return [...baseTypes, ...facultyTypes];
  };

  const availablePostTypes = getAvailablePostTypes();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (editData) {
        // Populate form with edit data
        setPostType(editData.type || 'GENERAL');
        setContent(editData.content || '');
        setVisibility(editData.visibility || 'PUBLIC');
        // TODO: Populate type-specific data
      } else {
        // Reset form for new post
        setCurrentStep(1);
        setPostType('GENERAL');
        setContent('');
        setVisibility('PUBLIC');
        setMediaFiles([]);
        setTags([]);
        setLinks([]);
        // Reset type-specific data
        setProjectData({
          projectTitle: '',
          milestone: '',
          progress: 0,
          teamMembers: [],
          githubUrl: '',
          demoUrl: '',
          techStack: []
        });
        // Reset other type-specific data similarly...
      }
    }
  }, [isOpen, editData]);

  const handleFileUpload = async (files: FileList) => {
    setUploadingMedia(true);
    const newMediaFiles: MediaFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const mediaFile: MediaFile = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file),
        type: file.type.startsWith('image/') ? 'image' : 
              file.type.startsWith('video/') ? 'video' : 'document'
      };
      newMediaFiles.push(mediaFile);
    }

    setMediaFiles(prev => [...prev, ...newMediaFiles]);

    // TODO: Upload files to backend
    // For now, simulate upload
    setTimeout(() => {
      setMediaFiles(prev => prev.map(media => ({
        ...media,
        uploaded: true,
        uploadedId: `uploaded_${media.id}`
      })));
      setUploadingMedia(false);
    }, 2000);
  };

  const removeMediaFile = (id: string) => {
    setMediaFiles(prev => prev.filter(media => media.id !== id));
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !tags.includes(tag.trim())) {
      setTags(prev => [...prev, tag.trim()]);
    }
  };

  const removeTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  };

  const addLink = () => {
    setLinks(prev => [...prev, { url: '', title: '' }]);
  };

  const updateLink = (index: number, field: 'url' | 'title', value: string) => {
    setLinks(prev => prev.map((link, i) => 
      i === index ? { ...link, [field]: value } : link
    ));
  };

  const removeLink = (index: number) => {
    setLinks(prev => prev.filter((_, i) => i !== index));
  };

  const addTechStack = (tech: string) => {
    if (tech.trim() && !projectData.techStack.includes(tech.trim())) {
      setProjectData(prev => ({
        ...prev,
        techStack: [...prev.techStack, tech.trim()]
      }));
    }
  };

  const removeTechStack = (tech: string) => {
    setProjectData(prev => ({
      ...prev,
      techStack: prev.techStack.filter(t => t !== tech)
    }));
  };

  const addSkill = (skill: string) => {
    if (skill.trim() && !collaborationData.requiredSkills.includes(skill.trim())) {
      setCollaborationData(prev => ({
        ...prev,
        requiredSkills: [...prev.requiredSkills, skill.trim()]
      }));
    }
  };

  const removeSkill = (skill: string) => {
    setCollaborationData(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter(s => s !== skill)
    }));
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return postType !== null && postType !== undefined;
      case 2:
        return content.trim() !== '' || mediaFiles.length > 0;
      case 3:
        return validateTypeSpecificData();
      case 4:
        return true; // Visibility step is always valid
      default:
        return false;
    }
  };

  const validateTypeSpecificData = () => {
    switch (postType) {
      case 'GENERAL':
        return true;
      case 'PROJECT_UPDATE':
        return projectData.projectTitle.trim() !== '' && projectData.milestone.trim() !== '';
      case 'COLLABORATION':
        return collaborationData.requiredSkills.length > 0 && collaborationData.capacity > 0;
      case 'EVENT':
        return eventData.title.trim() !== '' && eventData.date !== '' && eventData.location.trim() !== '';
      case 'JOB_POSTING':
        return jobData.title.trim() !== '' && jobData.company.trim() !== '' && jobData.location.trim() !== '';
      case 'BADGE_AWARD':
        return badgeData.badgeName.trim() !== '' && badgeData.description.trim() !== '';
      case 'ANNOUNCEMENT':
        return true;
      case 'AD_POST':
        return adData.title.trim() !== '' && adData.ctaUrl.trim() !== '';
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!canProceedToNextStep()) return;

    setLoading(true);
    try {
      // Upload media files first if any
      const uploadedMediaIds: string[] = [];
      for (const mediaFile of mediaFiles) {
        if (!mediaFile.uploaded && mediaFile.file) {
          try {
            const uploadResult = await networkApi.uploadMedia(mediaFile.file);
            uploadedMediaIds.push(uploadResult.id);
            mediaFile.uploaded = true;
            mediaFile.uploadedId = uploadResult.id;
          } catch (error) {
            console.error('Failed to upload media:', error);
            toast.error(`Failed to upload ${mediaFile.file.name}`);
            throw error;
          }
        } else if (mediaFile.uploaded && mediaFile.uploadedId) {
          uploadedMediaIds.push(mediaFile.uploadedId);
        }
      }

      const postData: CreatePostRequest = {
        type: postType,
        content: content.trim(),
        visibility: visibility === 'DEPARTMENT' ? 'COLLEGE' : (visibility === 'PRIVATE' ? 'COLLEGE' : visibility),
        tags: tags.length > 0 ? tags : undefined,
        links: links.filter(link => link.url.trim()).length > 0 ? 
               links.filter(link => link.url.trim()) : undefined,
        mediaIds: uploadedMediaIds,
      };

      // Add type-specific data
      switch (postType) {
        case 'PROJECT_UPDATE':
          postData.projectData = {
            projectTitle: projectData.projectTitle,
            milestone: projectData.milestone,
            progress: projectData.progress,
            teamMembers: projectData.teamMembers.map(tm => tm.name),
            githubUrl: projectData.githubUrl || undefined,
            demoUrl: projectData.demoUrl || undefined,
            techStack: projectData.techStack
          };
          break;
        case 'COLLABORATION':
          postData.collaborationData = {
            requiredSkills: collaborationData.requiredSkills,
            capacity: collaborationData.capacity,
            deadline: collaborationData.deadline,
            applyInApp: collaborationData.applyInApp,
            applyLink: collaborationData.applyLink || undefined
          };
          break;
        case 'EVENT':
          postData.eventData = {
            title: eventData.title,
            date: eventData.date,
            location: eventData.location,
            type: eventData.type,
            registrationRequired: eventData.registrationRequired,
            capacity: eventData.capacity,
            registrationUrl: eventData.registrationUrl || undefined
          };
          break;
        case 'JOB_POSTING':
          postData.jobData = {
            title: jobData.title,
            company: jobData.company,
            location: jobData.location,
            type: jobData.type,
            deadline: jobData.deadline || undefined,
            applyUrl: jobData.applyUrl || undefined,
            salaryRange: jobData.salaryRange || undefined
          };
          break;
        case 'BADGE_AWARD':
          postData.badgeData = {
            badgeId: badgeData.badgeId || `custom_${Date.now()}`,
            badgeName: badgeData.badgeName,
            description: badgeData.description,
            criteria: badgeData.criteria,
            rarity: badgeData.rarity
          };
          break;
        case 'AD_POST':
          // AD_POST not supported in CreatePostRequest interface
          break;
      }

      // Create the post using networkApi directly
      const createdPost = await networkApi.createPost(postData);
      toast.success('Post created successfully!');
      onClose();
    } catch (error: any) {
      console.error('Failed to create post:', error);
      if (error.response?.status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else if (error.response?.status === 404) {
        toast.error('API endpoint not found. Please check your configuration.');
      } else {
        toast.error(error.message || 'Failed to create post. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Choose Post Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availablePostTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setPostType(type.value as PostType)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    postType === type.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    {type.icon}
                    <span className="font-medium">{type.label}</span>
                  </div>
                  <p className="text-sm text-gray-600">{type.description}</p>
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Content & Media</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Media Files
              </label>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Click to upload or drag and drop</p>
                <p className="text-sm text-gray-500">Images, videos, or documents</p>
              </div>
              <input
                id="file-upload"
                type="file"
                multiple
                accept="image/*,video/*,.pdf,.doc,.docx"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                className="hidden"
              />

              {mediaFiles.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {mediaFiles.map((media) => (
                    <div key={media.id} className="relative group">
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        {media.type === 'image' && (
                          <img
                            src={media.preview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        )}
                        {media.type === 'video' && (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <Video className="w-8 h-8 text-gray-600" />
                          </div>
                        )}
                        {media.type === 'document' && (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <FileText className="w-8 h-8 text-gray-600" />
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removeMediaFile(media.id)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      {!media.uploaded && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    #{tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Add tags (press Enter)"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
            </div>
          </div>
        );

      case 3:
        return renderTypeSpecificFields();

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Visibility & Permissions</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Who can see this post?
              </label>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    value="PUBLIC"
                    checked={visibility === 'PUBLIC'}
                    onChange={(e) => setVisibility(e.target.value as PostVisibility)}
                    className="text-blue-600"
                  />
                  <div>
                    <div className="font-medium">Public</div>
                    <div className="text-sm text-gray-600">Anyone can see this post</div>
                  </div>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    value="COLLEGE"
                    checked={visibility === 'COLLEGE'}
                    onChange={(e) => setVisibility(e.target.value as PostVisibility)}
                    className="text-blue-600"
                  />
                  <div>
                    <div className="font-medium">College Only</div>
                    <div className="text-sm text-gray-600">Only people from your college</div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderTypeSpecificFields = () => {
    switch (postType) {
      case 'GENERAL':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Additional Details</h3>
            <p className="text-gray-600">No additional fields required for general posts.</p>
          </div>
        );

      case 'PROJECT_UPDATE':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Project Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Title *
                </label>
                <input
                  type="text"
                  value={projectData.projectTitle}
                  onChange={(e) => setProjectData(prev => ({ ...prev, projectTitle: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter project title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Milestone *
                </label>
                <input
                  type="text"
                  value={projectData.milestone}
                  onChange={(e) => setProjectData(prev => ({ ...prev, milestone: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., MVP Complete, Beta Release"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Progress: {projectData.progress}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={projectData.progress}
                onChange={(e) => setProjectData(prev => ({ ...prev, progress: parseInt(e.target.value) }))}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GitHub URL
                </label>
                <input
                  type="url"
                  value={projectData.githubUrl}
                  onChange={(e) => setProjectData(prev => ({ ...prev, githubUrl: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://github.com/..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Demo URL
                </label>
                <input
                  type="url"
                  value={projectData.demoUrl}
                  onChange={(e) => setProjectData(prev => ({ ...prev, demoUrl: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://demo.example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tech Stack
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {projectData.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                  >
                    {tech}
                    <button
                      onClick={() => removeTechStack(tech)}
                      className="text-green-600 hover:text-green-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Add technology (press Enter)"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTechStack(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
            </div>
          </div>
        );

      case 'COLLABORATION':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Collaboration Details</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Required Skills *
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {collaborationData.requiredSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {skill}
                    <button
                      onClick={() => removeSkill(skill)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Add required skill (press Enter)"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkill(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Capacity *
                </label>
                <input
                  type="number"
                  min="1"
                  value={collaborationData.capacity}
                  onChange={(e) => setCollaborationData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 1 }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deadline
                </label>
                <input
                  type="datetime-local"
                  value={collaborationData.deadline}
                  onChange={(e) => setCollaborationData(prev => ({ ...prev, deadline: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={collaborationData.applyInApp}
                  onChange={(e) => setCollaborationData(prev => ({ ...prev, applyInApp: e.target.checked }))}
                  className="text-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">Accept applications in-app</span>
              </label>
              
              {!collaborationData.applyInApp && (
                <div className="mt-2">
                  <input
                    type="url"
                    value={collaborationData.applyLink}
                    onChange={(e) => setCollaborationData(prev => ({ ...prev, applyLink: e.target.value }))}
                    placeholder="External application link"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>
          </div>
        );

      case 'EVENT':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Event Details</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Title *
              </label>
              <input
                type="text"
                value={eventData.title}
                onChange={(e) => setEventData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter event title"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={eventData.date}
                  onChange={(e) => setEventData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Type
                </label>
                <select
                  value={eventData.type}
                  onChange={(e) => setEventData(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                Location *
              </label>
              <input
                type="text"
                value={eventData.location}
                onChange={(e) => setEventData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter event location"
              />
              <label className="flex items-center space-x-2 mt-2">
                <input
                  type="checkbox"
                  checked={eventData.showMap}
                  onChange={(e) => setEventData(prev => ({ ...prev, showMap: e.target.checked }))}
                  className="text-blue-600"
                />
                <span className="text-sm text-gray-700">Show map preview</span>
              </label>
            </div>

            <div>
              <label className="flex items-center space-x-2 mb-3">
                <input
                  type="checkbox"
                  checked={eventData.registrationRequired}
                  onChange={(e) => setEventData(prev => ({ ...prev, registrationRequired: e.target.checked }))}
                  className="text-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">Registration required</span>
              </label>
              
              {eventData.registrationRequired && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Capacity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={eventData.capacity || ''}
                      onChange={(e) => setEventData(prev => ({ ...prev, capacity: parseInt(e.target.value) || undefined }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Maximum attendees"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Registration URL
                    </label>
                    <input
                      type="url"
                      value={eventData.registrationUrl}
                      onChange={(e) => setEventData(prev => ({ ...prev, registrationUrl: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://registration.example.com"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'JOB_POSTING':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Job Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title *
                </label>
                <input
                  type="text"
                  value={jobData.title}
                  onChange={(e) => setJobData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Software Engineer"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company *
                </label>
                <input
                  type="text"
                  value={jobData.company}
                  onChange={(e) => setJobData(prev => ({ ...prev, company: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Company name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  value={jobData.location}
                  onChange={(e) => setJobData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., San Francisco, CA"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Type
                </label>
                <select
                  value={jobData.type}
                  onChange={(e) => setJobData(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="internship">Internship</option>
                  <option value="contract">Contract</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salary Range
                </label>
                <input
                  type="text"
                  value={jobData.salaryRange}
                  onChange={(e) => setJobData(prev => ({ ...prev, salaryRange: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., $80k - $120k"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Application Deadline
                </label>
                <input
                  type="date"
                  value={jobData.deadline}
                  onChange={(e) => setJobData(prev => ({ ...prev, deadline: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Application URL
              </label>
              <input
                type="url"
                value={jobData.applyUrl}
                onChange={(e) => setJobData(prev => ({ ...prev, applyUrl: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://company.com/careers/apply"
              />
            </div>
          </div>
        );

      case 'BADGE_AWARD':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Badge Details</h3>
            
            <div>
              <label className="flex items-center space-x-2 mb-3">
                <input
                  type="checkbox"
                  checked={badgeData.isCustom}
                  onChange={(e) => setBadgeData(prev => ({ ...prev, isCustom: e.target.checked }))}
                  className="text-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">Create custom badge</span>
              </label>
            </div>

            {!badgeData.isCustom && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Badge
                </label>
                <select
                  value={badgeData.badgeId}
                  onChange={(e) => setBadgeData(prev => ({ ...prev, badgeId: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose from catalog...</option>
                  <option value="code_master">Code Master</option>
                  <option value="team_player">Team Player</option>
                  <option value="innovator">Innovator</option>
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Badge Name *
                </label>
                <input
                  type="text"
                  value={badgeData.badgeName}
                  onChange={(e) => setBadgeData(prev => ({ ...prev, badgeName: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter badge name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rarity
                </label>
                <select
                  value={badgeData.rarity}
                  onChange={(e) => setBadgeData(prev => ({ ...prev, rarity: e.target.value as any }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="common">Common</option>
                  <option value="rare">Rare</option>
                  <option value="epic">Epic</option>
                  <option value="legendary">Legendary</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={badgeData.description}
                onChange={(e) => setBadgeData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full h-24 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Describe what this badge represents"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Criteria
              </label>
              <input
                type="text"
                value={badgeData.criteria}
                onChange={(e) => setBadgeData(prev => ({ ...prev, criteria: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="What did they do to earn this?"
              />
            </div>
          </div>
        );

      case 'AD_POST':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Advertisement Details</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ad Title *
              </label>
              <input
                type="text"
                value={adData.title}
                onChange={(e) => setAdData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter advertisement title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Banner Image URL
              </label>
              <input
                type="url"
                value={adData.bannerUrl}
                onChange={(e) => setAdData(prev => ({ ...prev, bannerUrl: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/banner.jpg"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CTA Button Text
                </label>
                <input
                  type="text"
                  value={adData.ctaText}
                  onChange={(e) => setAdData(prev => ({ ...prev, ctaText: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Learn More, Sign Up"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CTA URL *
                </label>
                <input
                  type="url"
                  value={adData.ctaUrl}
                  onChange={(e) => setAdData(prev => ({ ...prev, ctaUrl: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Impression Goal
              </label>
              <input
                type="number"
                min="100"
                value={adData.impressionGoal}
                onChange={(e) => setAdData(prev => ({ ...prev, impressionGoal: parseInt(e.target.value) || 1000 }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={adData.sponsored}
                  onChange={(e) => setAdData(prev => ({ ...prev, sponsored: e.target.checked }))}
                  className="text-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">Mark as sponsored content</span>
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden ${className}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              {currentStep > 1 && (
                <button
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {editData ? 'Edit Post' : 'Create Post'}
                </h2>
                <div className="flex items-center space-x-2 mt-1">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`w-2 h-2 rounded-full ${
                        step <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                  <span className="text-sm text-gray-500 ml-2">
                    Step {currentStep} of 4
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {renderStepContent()}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-500">
              {currentStep === 4 && (
                <span>Ready to publish your {postType.toLowerCase().replace('_', ' ')} post</span>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              {currentStep < 4 ? (
                <button
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  disabled={!canProceedToNextStep()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading || !canProceedToNextStep()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {loading && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>{editData ? 'Update' : 'Publish'}</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CreatePostModal;
