'use client';

import React, { useState, useCallback, useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Bookmark, 
  Share2, 
  Eye, 
  Edit3, 
  Trash2, 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  ExternalLink, 
  Github, 
  Globe, 
  Briefcase, 
  Award, 
  Megaphone,
  Play,
  Image as ImageIcon,
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
  MessageCircle,
  MoreHorizontal
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { PostResponse, PostMedia } from '@/types/post';
import { networkApi } from '@/lib/networkApi';
import { toast } from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store/store';
import { updatePostInFeed, removePostFromFeed } from '@/store/slices/feedSlice';
import CommentSection from './CommentSection';
import PostEditModal from './PostEditModal';

interface PostCardProps {
  post: PostResponse;
  onLike?: (postId: string) => void;
  onBookmark?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onEdit?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  className?: string;
  isOptimized?: boolean;
}

const PostCard: React.FC<PostCardProps> = memo(({
  post,
  onLike,
  onBookmark,
  onShare,
  onEdit,
  onDelete,
  className = '',
  isOptimized = true
}) => {
  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  
  // Optimized state management
  const [showComments, setShowComments] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isApplying, setIsApplying] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);

  // Memoized computed values
  const isAuthor = useMemo(() => user?.id === post.authorId, [user?.id, post.authorId]);
  const isAdmin = useMemo(() => user?.role && ['dept_admin', 'head_admin', 'placements_admin'].includes(user.role), [user?.role]);
  const canEdit = useMemo(() => isAuthor || isAdmin, [isAuthor, isAdmin]);
  const formattedDate = useMemo(() => formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }), [post.createdAt]);

  // Optimized CRUD handlers with performance improvements
  const handleLike = useCallback(async () => {
    if (!user || isLiking) return;
    
    setIsLiking(true);
    const wasLiked = post.likedByMe;
    const newLikeCount = wasLiked ? post.likeCount - 1 : post.likeCount + 1;
    
    // Convert PostResponse to Post format for Redux
    const convertToPost = (postResponse: PostResponse, updates: Partial<PostResponse> = {}) => ({
      ...postResponse,
      ...updates,
      state: postResponse.status,
      author: {
        id: postResponse.authorId,
        displayName: postResponse.authorDisplayName,
        avatarUrl: postResponse.authorAvatarUrl,
        role: postResponse.authorRole as any,
        department: postResponse.authorDepartment,
        college: postResponse.authorCollegeId
      },
      content: postResponse.content || ''
    });
    
    // Optimistic update
    dispatch(updatePostInFeed(convertToPost(post, {
      likedByMe: !wasLiked,
      likeCount: newLikeCount
    })));
    
    try {
      const result = await networkApi.likePost(post.id);
      // Update with actual server response
      dispatch(updatePostInFeed(convertToPost(post, {
        likedByMe: result.liked,
        likeCount: result.likeCount
      })));
      onLike?.(post.id);
    } catch (error) {
      // Revert optimistic update on error
      dispatch(updatePostInFeed(convertToPost(post, {
        likedByMe: wasLiked,
        likeCount: post.likeCount
      })));
      console.error('Failed to like post:', error);
      toast.error('Failed to like post. Please try again.');
    } finally {
      setIsLiking(false);
    }
  }, [user, isLiking, post, dispatch, onLike]);

  const handleBookmark = useCallback(async () => {
    if (!user || isBookmarking) return;
    
    setIsBookmarking(true);
    const wasBookmarked = post.bookmarkedByMe;
    
    // Convert PostResponse to Post format for Redux
    const convertToPost = (postResponse: PostResponse, updates: Partial<PostResponse> = {}) => ({
      ...postResponse,
      ...updates,
      state: postResponse.status,
      author: {
        id: postResponse.authorId,
        displayName: postResponse.authorDisplayName,
        avatarUrl: postResponse.authorAvatarUrl,
        role: postResponse.authorRole as any,
        department: postResponse.authorDepartment,
        college: postResponse.authorCollegeId
      },
      content: postResponse.content || ''
    });
    
    // Optimistic update
    dispatch(updatePostInFeed(convertToPost(post, {
      bookmarkedByMe: !wasBookmarked
    })));
    
    try {
      const result = await networkApi.bookmarkPost(post.id);
      dispatch(updatePostInFeed(convertToPost(post, {
        bookmarkedByMe: result.bookmarked
      })));
      onBookmark?.(post.id);
      toast.success(result.bookmarked ? 'Post bookmarked!' : 'Bookmark removed!');
    } catch (error) {
      // Revert optimistic update
      dispatch(updatePostInFeed(convertToPost(post, {
        bookmarkedByMe: wasBookmarked
      })));
      console.error('Failed to bookmark post:', error);
      toast.error('Failed to bookmark post. Please try again.');
    } finally {
      setIsBookmarking(false);
    }
  }, [user, isBookmarking, post, dispatch, onBookmark]);

  const handleShare = useCallback(async () => {
    if (!user) return;
    
    try {
      const result = await networkApi.sharePost(post.id, 'SHARE');
      
      // Convert PostResponse to Post format for Redux
      const convertToPost = (postResponse: PostResponse, updates: Partial<PostResponse> = {}) => ({
        ...postResponse,
        ...updates,
        state: postResponse.status,
        author: {
          id: postResponse.authorId,
          displayName: postResponse.authorDisplayName,
          avatarUrl: postResponse.authorAvatarUrl,
          role: postResponse.authorRole as any,
          department: postResponse.authorDepartment,
          college: postResponse.authorCollegeId
        },
        content: postResponse.content || ''
      });
      
      dispatch(updatePostInFeed(convertToPost(post, {
        shareCount: result.shareCount
      })));
      onShare?.(post.id);
      toast.success('Post shared successfully!');
    } catch (error) {
      console.error('Failed to share post:', error);
      toast.error('Failed to share post. Please try again.');
    }
  }, [user, post, dispatch, onShare]);

  const handleDelete = useCallback(async () => {
    if (!canEdit || isDeleting) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this post? This action cannot be undone.');
    if (!confirmed) return;
    
    setIsDeleting(true);
    try {
      await networkApi.deletePost(post.id);
      dispatch(removePostFromFeed(post.id));
      onDelete?.(post.id);
      toast.success('Post deleted successfully!');
    } catch (error) {
      console.error('Failed to delete post:', error);
      toast.error('Failed to delete post. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  }, [canEdit, isDeleting, post.id, dispatch, onDelete]);

  const handleEdit = useCallback(() => {
    if (!canEdit) return;
    setShowEditModal(true);
    onEdit?.(post.id);
  }, [canEdit, post.id, onEdit]);

  const handleApplyToCollaboration = useCallback(async () => {
    if (!user || isApplying) return;
    
    setIsApplying(true);
    try {
      await networkApi.applyToCollaboration(post.id);
      toast.success('Application submitted successfully!');
    } catch (error) {
      console.error('Failed to apply to collaboration:', error);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setIsApplying(false);
    }
  }, [user, isApplying, post.id]);

  const handleContactAuthor = useCallback(() => {
    // TODO: Implement messaging functionality
    toast('Messaging feature coming soon!', { icon: 'ℹ️' });
  }, []);

  // Memoized badge computation for performance
  const badge = useMemo(() => {
    const badges = {
      GENERAL: { label: 'General', color: 'bg-gray-100 text-gray-700', icon: null },
      PROJECT_UPDATE: { label: 'Project Update', color: 'bg-green-100 text-green-700', icon: <Github className="w-3 h-3" /> },
      COLLABORATION: { label: 'Collaboration', color: 'bg-blue-100 text-blue-700', icon: <Users className="w-3 h-3" /> },
      EVENT: { label: 'Event', color: 'bg-purple-100 text-purple-700', icon: <Calendar className="w-3 h-3" /> },
      JOB_POSTING: { label: 'Job Posting', color: 'bg-orange-100 text-orange-700', icon: <Briefcase className="w-3 h-3" /> },
      BADGE_AWARD: { label: 'Badge Award', color: 'bg-yellow-100 text-yellow-700', icon: <Award className="w-3 h-3" /> },
      ANNOUNCEMENT: { label: 'Announcement', color: 'bg-red-100 text-red-700', icon: <Megaphone className="w-3 h-3" /> },
      AD_POST: { label: 'Sponsored', color: 'bg-indigo-100 text-indigo-700', icon: <ExternalLink className="w-3 h-3" /> }
    };
    
    return badges[post.type as keyof typeof badges] || badges.GENERAL;
  }, [post.type]);

  // Memoized lightbox handlers
  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  const nextImage = useCallback(() => {
    setLightboxIndex((prev) => (prev + 1) % post.media.length);
  }, [post.media.length]);

  const prevImage = useCallback(() => {
    setLightboxIndex((prev) => (prev - 1 + post.media.length) % post.media.length);
  }, [post.media.length]);

  // Memoized media type detection
  const getMediaType = useCallback((mimeType: string | null | undefined) => {
    if (!mimeType) return 'document';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    return 'document';
  }, []);

  const renderMediaGrid = useCallback(() => {
    if (!post.media || post.media.length === 0) return null;

    console.log('Rendering media grid for post:', post.id, 'Media count:', post.media.length, 'Media:', post.media);

    return (
      <div className="mt-4">
        <div className={`grid gap-2 ${
          post.media.length === 1 ? 'grid-cols-1' :
          post.media.length === 2 ? 'grid-cols-2' :
          post.media.length === 3 ? 'grid-cols-3' :
          'grid-cols-2'
        }`}>
          {post.media?.slice(0, 4).map((media, index) => {
            console.log(`Processing media ${index}:`, media);
            const mediaType = getMediaType(media?.mimeType);
            const isLastItem = index === 3 && post.media.length > 4;
            
            return (
              <div
                key={media?.id || index}
                className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer group"
                onClick={() => openLightbox(index)}
              >
                {/* Always show a placeholder first */}
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"></path>
                  </svg>
                </div>
                
                {/* Overlay the actual image if it's an image type */}
                {mediaType === 'image' && media?.url && (
                  <img
                    src={media.url}
                    alt="Post media"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                    onLoad={(e) => {
                      console.log('Image loaded successfully:', media.url);
                      // Hide the placeholder when image loads
                      const placeholder = e.currentTarget.previousElementSibling as HTMLElement;
                      if (placeholder) placeholder.style.display = 'none';
                    }}
                    onError={(e) => {
                      console.error('Image failed to load:', media.url, 'Media object:', media);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                {mediaType === 'video' && (
                  <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center">
                    <Play className="w-8 h-8 text-white" />
                  </div>
                )}
                {mediaType === 'document' && (
                  <div className="absolute inset-0 w-full h-full bg-gray-200 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-gray-600" />
                  </div>
                )}
                
                {isLastItem && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">+{post.media.length - 4}</span>
                  </div>
                )}
                
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {mediaType === 'image' && <ImageIcon className="w-4 h-4 text-white" />}
                  {mediaType === 'video' && <Play className="w-4 h-4 text-white" />}
                  {mediaType === 'document' && <FileText className="w-4 h-4 text-white" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }, [post.media, getMediaType, openLightbox]);

  const renderTypeSpecificContent = () => {
    switch (post.type) {
      case 'PROJECT_UPDATE':
        if (!post.projectData) return null;
        return (
          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-green-800">{post.projectData.projectTitle}</h4>
              <span className="text-sm text-green-600">{post.projectData.milestone}</span>
            </div>
            
            <div className="mb-3">
              <div className="flex items-center justify-between text-sm text-green-700 mb-1">
                <span>Progress</span>
                <span>{post.projectData.progress}%</span>
              </div>
              <div className="w-full bg-green-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${post.projectData.progress}%` }}
                />
              </div>
            </div>

            {post.projectData.techStack && (
              <div className="mb-3">
                <div className="flex flex-wrap gap-1">
                  {post.projectData?.techStack?.map((tech: string, index: number) => (
                    <span key={index} className="px-2 py-1 bg-green-200 text-green-800 text-xs rounded-full">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {post.projectData.githubUrl && (
                <a
                  href={post.projectData.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1 bg-gray-800 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
                >
                  <Github className="w-3 h-3" />
                  Code
                </a>
              )}
              {post.projectData.demoUrl && (
                <a
                  href={post.projectData.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Globe className="w-3 h-3" />
                  Demo
                </a>
              )}
            </div>
          </div>
        );

      case 'COLLABORATION':
        if (!post.collaborationData) return null;
        return (
          <div className="mt-4 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm">
            <div className="mb-4">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Looking for Collaborators
              </h4>
              <div className="flex flex-wrap gap-2">
                {post.collaborationData?.requiredSkills?.map((skill: string, index: number) => (
                  <span key={index} className="px-3 py-1.5 bg-blue-200 text-blue-900 text-sm font-medium rounded-full border border-blue-300">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-white/60 rounded-lg border border-blue-100">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-blue-700 mb-1">
                  <Users className="w-4 h-4" />
                  <span className="text-xs font-medium">Team Size</span>
                </div>
                <span className="text-lg font-bold text-blue-900">{post.collaborationData.capacity}</span>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-blue-700 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-medium">Deadline</span>
                </div>
                <span className="text-sm font-semibold text-blue-900">
                  {new Date(post.collaborationData.deadline).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              {post.collaborationData.applyInApp ? (
                <button 
                  onClick={handleApplyToCollaboration}
                  disabled={isApplying || isAuthor}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isApplying ? 'Applying...' : isAuthor ? 'Your Post' : 'Apply to Join'}
                </button>
              ) : (
                <a
                  href={post.collaborationData.applyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-md text-center"
                >
                  Apply Externally
                </a>
              )}
              <button 
                onClick={handleContactAuthor}
                disabled={isAuthor}
                className="px-6 py-3 bg-white text-blue-700 border-2 border-blue-300 rounded-lg font-semibold hover:bg-blue-50 hover:border-blue-400 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isAuthor ? 'Your Post' : 'Contact'}
              </button>
            </div>
          </div>
        );

      case 'EVENT':
        if (!post.eventData) return null;
        return (
          <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-purple-800 mb-2">{post.eventData.title}</h4>
            
            <div className="space-y-2 mb-3 text-sm text-purple-700">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(post.eventData.date).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{post.eventData.location}</span>
              </div>
              {post.eventData.capacity && (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>Capacity: {post.eventData.capacity}</span>
                </div>
              )}
            </div>

            {post.eventData.registrationRequired && (
              <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors">
                Register Now
              </button>
            )}
          </div>
        );

      case 'JOB_POSTING':
        if (!post.jobData) return null;
        return (
          <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-orange-800">{post.jobData.title}</h4>
                <p className="text-orange-700">{post.jobData.company}</p>
              </div>
              <span className="px-2 py-1 bg-orange-200 text-orange-800 text-xs rounded-full capitalize">
                {post.jobData.type}
              </span>
            </div>
            
            <div className="space-y-1 mb-3 text-sm text-orange-700">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{post.jobData.location}</span>
              </div>
              {post.jobData.salaryRange && (
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  <span>{post.jobData.salaryRange}</span>
                </div>
              )}
              {post.jobData.deadline && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Apply by: {new Date(post.jobData.deadline).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            <button className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 transition-colors">
              Apply Now
            </button>
          </div>
        );

      case 'BADGE_AWARD':
        if (!post.badgeData) return null;
        const rarityColors = {
          common: 'bg-gray-100 text-gray-800 border-gray-300',
          rare: 'bg-blue-100 text-blue-800 border-blue-300',
          epic: 'bg-purple-100 text-purple-800 border-purple-300',
          legendary: 'bg-yellow-100 text-yellow-800 border-yellow-300'
        };
        return (
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-yellow-800" />
              </div>
              <div>
                <h4 className="font-semibold text-yellow-800">{post.badgeData.badgeName}</h4>
                <span className={`px-2 py-1 text-xs rounded-full border ${rarityColors[post.badgeData.rarity as keyof typeof rarityColors]}`}>
                  {post.badgeData.rarity}
                </span>
              </div>
            </div>
            
            <p className="text-sm text-yellow-700 mb-2">{post.badgeData.description}</p>
            <p className="text-xs text-yellow-600">Criteria: {post.badgeData.criteria}</p>
          </div>
        );

      case 'ANNOUNCEMENT':
        return (
          <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200 border-l-4 border-l-red-500">
            <div className="flex items-center gap-2 mb-2">
              <Megaphone className="w-5 h-5 text-red-600" />
              <span className="font-semibold text-red-800">Important Announcement</span>
            </div>
          </div>
        );

      case 'AD_POST':
        if (!post.adData) return null;
        return (
          <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-indigo-800">{post.adData.title}</h4>
              {post.adData.sponsored && (
                <span className="px-2 py-1 bg-indigo-200 text-indigo-800 text-xs rounded-full">
                  Sponsored
                </span>
              )}
            </div>
            
            {post.adData.bannerUrl && (
              <div className="mb-3 rounded-lg overflow-hidden">
                <img
                  src={post.adData.bannerUrl}
                  alt="Advertisement"
                  className="w-full h-48 object-cover"
                />
              </div>
            )}

            <button className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors">
              {post.adData.ctaText || 'Learn More'}
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  const renderLightbox = () => {
    if (!lightboxOpen || !post.media || post.media.length === 0) return null;

    const currentMedia = post.media[lightboxIndex];
    if (!currentMedia) return null;
    
    const mimeType = currentMedia.mimeType || '';
    const mediaType = mimeType.startsWith('image/') ? 'image' : 
                     mimeType.startsWith('video/') ? 'video' : 'document';

    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
        <div className="relative max-w-4xl max-h-full p-4">
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
          >
            <X className="w-6 h-6" />
          </button>

          {post.media.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          <div className="flex items-center justify-center h-full">
            {mediaType === 'image' && (
              <img
                src={currentMedia.url}
                alt="Lightbox media"
                className="max-w-full max-h-full object-contain"
              />
            )}
            {mediaType === 'video' && (
              <video
                src={currentMedia.url}
                controls
                className="max-w-full max-h-full"
              />
            )}
            {mediaType === 'document' && (
              <div className="bg-white p-8 rounded-lg">
                <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-center">Document preview not available</p>
                <a
                  href={currentMedia.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center mt-4 text-blue-600 hover:text-blue-800"
                >
                  Open Document
                </a>
              </div>
            )}
          </div>

          {post.media.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
              {lightboxIndex + 1} / {post.media.length}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-gray-200 transition-all duration-300 ${className}`}
      >
        {/* Top Section */}
        <div className="p-6 pb-0">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {post.authorAvatarUrl ? (
                    <img 
                      src={post.authorAvatarUrl} 
                      alt={post.authorDisplayName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    post.authorDisplayName.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-1">
                  <h3 className="font-bold text-gray-900 truncate cursor-pointer hover:text-blue-600 transition-colors text-lg">
                    {post.authorDisplayName}
                  </h3>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${badge.color} shadow-sm`}>
                    {badge.icon}
                    {badge.label}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span className="font-medium">{post.authorRole}</span>
                  {post.authorDepartment && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span>{post.authorDepartment}</span>
                    </>
                  )}
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-500">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                </div>
              </div>
            </div>

            {canEdit && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onEdit?.(post.id)}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete?.(post.id)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Section */}
        <div className="p-4">
          {post.content && (
            <div className="mb-4">
              <p className={`text-gray-800 whitespace-pre-wrap ${!showFullContent && post.content.length > 300 ? 'line-clamp-3' : ''}`}>
                {showFullContent ? post.content : post.content.slice(0, 300)}
                {!showFullContent && post.content.length > 300 && '...'}
              </p>
              {post.content.length > 300 && (
                <button
                  onClick={() => setShowFullContent(!showFullContent)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2"
                >
                  {showFullContent ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          )}

          {/* Tags Display */}
          {post.tags && post.tags.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag, index) => {
                  // Handle both string tags and tag objects
                  const tagText = typeof tag === 'string' ? tag : 
                                  typeof tag === 'object' && tag !== null ? 
                                  (tag as any).tag || (tag as any).name || String(tag) : 
                                  String(tag);
                  
                  return (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors cursor-pointer"
                    >
                      #{tagText}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {renderMediaGrid()}
          {renderTypeSpecificContent()}
        </div>

        {/* Bottom Section (Actions) */}
        <div className="px-6 py-4 border-t border-gray-50 bg-gradient-to-r from-gray-50/50 to-blue-50/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <button
                onClick={handleLike}
                disabled={isLiking}
                className={`p-3 rounded-full transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed ${
                  post.likedByMe 
                    ? 'text-red-600 bg-red-50 hover:bg-red-100 shadow-sm' 
                    : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                }`}
              >
                <Heart className={`w-5 h-5 ${post.likedByMe ? 'fill-current' : ''} ${isLiking ? 'animate-pulse' : ''}`} />
              </button>
              <span>{post.likeCount || 0}</span>

              <button
                onClick={() => setShowComments(!showComments)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-semibold transition-all duration-200 hover:scale-105 ${
                  showComments
                    ? 'text-blue-600 bg-blue-50 hover:bg-blue-100 shadow-sm'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <MessageCircle className="w-5 h-5" />
                <span>{post.commentCount || 0}</span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-semibold text-gray-600 hover:text-green-600 hover:bg-green-50 transition-all duration-200 hover:scale-105"
              >
                <Share2 className="w-5 h-5" />
                <span>Share</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              {canEdit && (
                <div className="flex items-center space-x-1">
                  <button
                    onClick={handleEdit}
                    className="p-2 rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                    title="Edit post"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="p-2 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200 disabled:opacity-50"
                    title="Delete post"
                  >
                    <Trash2 className={`w-4 h-4 ${isDeleting ? 'animate-pulse' : ''}`} />
                  </button>
                </div>
              )}
              <button
                onClick={handleBookmark}
                disabled={isBookmarking}
                className={`p-3 rounded-full transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed ${
                  post.bookmarkedByMe 
                    ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100 shadow-sm' 
                    : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
                }`}
              >
                <Bookmark className={`w-5 h-5 ${post.bookmarkedByMe ? 'fill-current' : ''} ${isBookmarking ? 'animate-pulse' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {renderLightbox()}
      
      {/* Comment Section */}
      <CommentSection
        postId={post.id}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        initialCommentCount={post.commentCount}
      />

      {/* Edit Modal */}
      <PostEditModal
        post={post}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onUpdate={(updatedPost) => {
          // Convert PostResponse to Post format for Redux
          const convertedPost = {
            ...updatedPost,
            state: updatedPost.status,
            author: {
              id: updatedPost.authorId,
              displayName: updatedPost.authorDisplayName,
              avatarUrl: updatedPost.authorAvatarUrl,
              role: updatedPost.authorRole as any,
              department: updatedPost.authorDepartment,
              college: updatedPost.authorCollegeId
            },
            content: updatedPost.content || ''
          };
          dispatch(updatePostInFeed(convertedPost));
          setShowEditModal(false);
          toast.success('Post updated successfully!');
        }}
      />
    </>
  );
});

export default PostCard;
