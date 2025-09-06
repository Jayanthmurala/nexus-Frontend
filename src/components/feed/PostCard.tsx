'use client';

import { 
  Heart, 
  MessageCircle, 
  Share, 
  Bookmark,
  MoreHorizontal,
  Award,
  Trophy,
  Star,
  Clock,
  Edit,
  Trash2,
  Globe,
  Users,
  Flag,
  ExternalLink
} from 'lucide-react';
import { useState } from 'react';
import { networkApi } from '@/lib/networkApi';
import { toast } from 'react-hot-toast';
import CommentsSection from './CommentsSection';
import ReportDialog from './ReportDialog';
import PostEditModal from './PostEditModal';

interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: 'student' | 'faculty' | 'admin';
  authorDepartment: string;
  content: string;
  visibility: 'PUBLIC' | 'COLLEGE';
  type: 'text' | 'project_update' | 'achievement' | 'event' | 'collaboration' | 'badge_award';
  attachments?: Array<{
    type: 'image' | 'document' | 'link';
    url: string;
    title?: string;
  }>;
  tags?: string[];
  likes: number;
  comments: number;
  shares: number;
  timestamp: Date;
  isLiked: boolean;
  isBookmarked: boolean;
  badgeData?: {
    badgeName: string;
    badgeIcon: string;
    badgeColor: string;
    recipientName: string;
    reason: string;
  };
}

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onBookmark?: (postId: string) => void;
  onEdit?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onRefresh?: () => void;
}

export default function PostCard({ post, currentUserId, onLike, onComment, onShare, onBookmark, onEdit, onDelete, onRefresh }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [shareCount, setShareCount] = useState(post.shares);
  const [isLoading, setIsLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Handle like/unlike
  const handleLike = async () => {
    if (isLoading) return;
    setIsLoading(true);
    
    try {
      const result = await networkApi.likePost(post.id);
      setIsLiked(result.liked);
      setLikeCount(result.likeCount);
      onLike?.(post.id);
      toast.success(result.liked ? 'Post liked!' : 'Post unliked!');
    } catch (error) {
      toast.error('Failed to update like status');
      console.error('Like error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle bookmark/unbookmark
  const handleBookmark = async () => {
    if (isLoading) return;
    setIsLoading(true);
    
    try {
      const result = await networkApi.bookmarkPost(post.id);
      setIsBookmarked(result.bookmarked);
      onBookmark?.(post.id);
      toast.success(result.bookmarked ? 'Post bookmarked!' : 'Bookmark removed!');
    } catch (error) {
      toast.error('Failed to update bookmark status');
      console.error('Bookmark error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle share
  const handleShare = async () => {
    if (isLoading) return;
    setIsLoading(true);
    
    try {
      const result = await networkApi.sharePost(post.id);
      setShareCount(result.shareCount);
      onShare?.(post.id);
      toast.success('Post shared successfully!');
    } catch (error) {
      toast.error('Failed to share post');
      console.error('Share error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    if (isLoading) return;
    setIsLoading(true);
    
    try {
      await networkApi.deletePost(post.id);
      onDelete?.(post.id);
      onRefresh?.();
      toast.success('Post deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete post');
      console.error('Delete error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle report
  const handleReport = async (reason: string, description?: string) => {
    if (isLoading) return;
    setIsLoading(true);
    
    try {
      await networkApi.reportPost(post.id, reason, description);
      setShowReportDialog(false);
      toast.success('Post reported successfully!');
    } catch (error) {
      toast.error('Failed to report post');
      console.error('Report error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'achievement': return 'bg-green-100 text-green-800';
      case 'project_update': return 'bg-blue-100 text-blue-800';
      case 'event': return 'bg-purple-100 text-purple-800';
      case 'collaboration': return 'bg-orange-100 text-orange-800';
      case 'badge_award': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'achievement': return <Trophy className="w-4 h-4" />;
      case 'badge_award': return <Award className="w-4 h-4" />;
      case 'project_update': return <Star className="w-4 h-4" />;
      default: return null;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - new Date(timestamp).getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Post Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {post.authorName.charAt(0)}
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900">{post.authorName}</h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPostTypeColor(post.type)} flex items-center space-x-1`}>
                {getPostTypeIcon(post.type)}
                <span>{post.type.replace('_', ' ')}</span>
              </span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>{post.authorRole} • {post.authorDepartment}</span>
              <span>•</span>
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{formatTimestamp(post.timestamp)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {/* Visibility indicator */}
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
            post.visibility === 'PUBLIC' 
              ? 'bg-green-50 text-green-600' 
              : 'bg-blue-50 text-blue-600'
          }`}>
            {post.visibility === 'PUBLIC' ? <Globe className="w-3 h-3" /> : <Users className="w-3 h-3" />}
            <span>{post.visibility === 'PUBLIC' ? 'Public' : 'College'}</span>
          </div>
          
          {/* More actions menu */}
          <PostActionsMenu 
            isOwner={currentUserId === post.authorId}
            onEdit={() => setShowEditModal(true)}
            onDelete={handleDelete}
            onReport={() => setShowReportDialog(true)}
          />
        </div>
      </div>

      {/* Badge Announcement Special Layout */}
      {post.type === 'badge_award' && post.badgeData && (
        <div className="mb-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
          <div className="flex items-center space-x-4">
            <div className={`w-16 h-16 ${post.badgeData.badgeColor} rounded-full flex items-center justify-center text-3xl`}>
              {post.badgeData.badgeIcon}
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-gray-900 mb-1">
                🎉 Badge Awarded: {post.badgeData.badgeName}
              </h4>
              <p className="text-sm text-gray-600">
                Recipient: <span className="font-medium">{post.badgeData.recipientName}</span>
              </p>
              <p className="text-sm text-gray-500 mt-1">{post.badgeData.reason}</p>
            </div>
          </div>
        </div>
      )}

      {/* Post Content */}
      <div className="mb-4">
        <p className="text-gray-800 leading-relaxed">{post.content}</p>
      </div>

      {/* Attachments */}
      {post.attachments && post.attachments.length > 0 && (
        <div className="mb-4">
          {post.attachments.map((attachment, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  {attachment.type === 'image' && <img src="https://picsum.photos/32" alt="" className="w-6 h-6 rounded" />}
                  {attachment.type === 'document' && <div className="w-6 h-6 bg-red-500 rounded text-white text-xs flex items-center justify-center">PDF</div>}
                  {attachment.type === 'link' && <div className="w-6 h-6 bg-green-500 rounded text-white text-xs flex items-center justify-center">🔗</div>}
                </div>
                <span className="text-sm font-medium text-gray-700">{attachment.title || attachment.url}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag, index) => (
              <span key={index} className="px-2 py-1 bg-blue-50 text-blue-600 text-sm font-medium rounded-full hover:bg-blue-100 cursor-pointer transition-colors">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Post Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-6">
          <button
            onClick={handleLike}
            disabled={isLoading}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              isLiked 
                ? 'bg-red-50 text-red-600' 
                : 'hover:bg-gray-100 text-gray-600'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">{likeCount}</span>
          </button>
          <button 
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">{post.comments}</span>
          </button>
          <button 
            onClick={handleShare}
            disabled={isLoading}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Share className="w-5 h-5" />
            <span className="text-sm font-medium">{shareCount}</span>
          </button>
        </div>
        <button
          onClick={handleBookmark}
          disabled={isLoading}
          className={`p-2 rounded-lg transition-colors ${
            isBookmarked 
              ? 'bg-blue-50 text-blue-600' 
              : 'hover:bg-gray-100 text-gray-600'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          aria-label="Bookmark"
        >
          <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <CommentsSection postId={post.id} currentUserId={currentUserId} />
        </div>
      )}

      {/* Report Dialog */}
      {showReportDialog && (
        <ReportDialog 
          onReport={handleReport}
          onClose={() => setShowReportDialog(false)}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <PostEditModal 
          post={{
            id: post.id,
            content: post.content,
            visibility: post.visibility,
            tags: post.tags,
            links: post.attachments?.filter(a => a.type === 'link').map(a => ({ url: a.url, title: a.title }))
          }}
          onClose={() => setShowEditModal(false)}
          onUpdate={(updatedPost) => {
            onRefresh?.();
            setShowEditModal(false);
          }}
        />
      )}
    </div>
  );
}

// Post actions menu component
function PostActionsMenu({ 
  isOwner, 
  onEdit, 
  onDelete, 
  onReport 
}: { 
  isOwner: boolean; 
  onEdit: () => void; 
  onDelete: () => void; 
  onReport: () => void; 
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors" 
        aria-label="More actions"
      >
        <MoreHorizontal className="w-5 h-5 text-gray-400" />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
            {isOwner && (
              <>
                <button
                  onClick={() => { onEdit(); setIsOpen(false); }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit post</span>
                </button>
                <button
                  onClick={() => { onDelete(); setIsOpen(false); }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete post</span>
                </button>
              </>
            )}
            {!isOwner && (
              <button
                onClick={() => { onReport(); setIsOpen(false); }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
              >
                <Flag className="w-4 h-4" />
                <span>Report post</span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
