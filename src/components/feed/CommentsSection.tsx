'use client';

import { useState, useEffect } from 'react';
import { Heart, Reply, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { networkApi, Comment } from '@/lib/networkApi';
import { toast } from 'react-hot-toast';

interface CommentsSectionProps {
  postId: string;
  currentUserId?: string;
}

export default function CommentsSection({ postId, currentUserId }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Load comments
  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    setIsLoading(true);
    try {
      const response = await networkApi.getComments(postId);
      setComments(response.items);
    } catch (error) {
      toast.error('Failed to load comments');
      console.error('Load comments error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Create comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const comment = await networkApi.createComment(postId, newComment.trim(), replyTo || undefined);
      setComments(prev => [comment, ...prev]);
      setNewComment('');
      setReplyTo(null);
      toast.success('Comment added!');
    } catch (error) {
      toast.error('Failed to add comment');
      console.error('Create comment error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update comment
  const handleUpdateComment = async (commentId: string) => {
    if (!editContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const updatedComment = await networkApi.updateComment(commentId, editContent.trim());
      setComments(prev => prev.map(c => c.id === commentId ? updatedComment : c));
      setEditingComment(null);
      setEditContent('');
      toast.success('Comment updated!');
    } catch (error) {
      toast.error('Failed to update comment');
      console.error('Update comment error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await networkApi.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success('Comment deleted!');
    } catch (error) {
      toast.error('Failed to delete comment');
      console.error('Delete comment error:', error);
    }
  };

  // Like comment
  const handleLikeComment = async (commentId: string) => {
    try {
      const result = await networkApi.likeComment(commentId);
      setComments(prev => prev.map(c => 
        c.id === commentId 
          ? { ...c, likedByMe: result.liked, likeCount: result.likeCount }
          : c
      ));
    } catch (error) {
      toast.error('Failed to update like status');
      console.error('Like comment error:', error);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      {/* Comment Form */}
      <form onSubmit={handleSubmitComment} className="space-y-3">
        <div className="flex space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-medium text-sm">U</span>
          </div>
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={replyTo ? "Write a reply..." : "Write a comment..."}
              className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
            {replyTo && (
              <div className="mt-2 flex items-center space-x-2">
                <span className="text-sm text-gray-500">Replying to comment</span>
                <button
                  type="button"
                  onClick={() => setReplyTo(null)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </form>

      {/* Comments List */}
      {isLoading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              onLike={() => handleLikeComment(comment.id)}
              onReply={() => setReplyTo(comment.id)}
              onEdit={() => {
                setEditingComment(comment.id);
                setEditContent(comment.content);
              }}
              onDelete={() => handleDeleteComment(comment.id)}
              onUpdate={handleUpdateComment}
              isEditing={editingComment === comment.id}
              editContent={editContent}
              setEditContent={setEditContent}
              isSubmitting={isSubmitting}
              formatTimestamp={formatTimestamp}
            />
          ))}
          {comments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No comments yet. Be the first to comment!
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Comment Item Component
function CommentItem({
  comment,
  currentUserId,
  onLike,
  onReply,
  onEdit,
  onDelete,
  onUpdate,
  isEditing,
  editContent,
  setEditContent,
  isSubmitting,
  formatTimestamp
}: {
  comment: Comment;
  currentUserId?: string;
  onLike: () => void;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpdate: (commentId: string) => void;
  isEditing: boolean;
  editContent: string;
  setEditContent: (content: string) => void;
  isSubmitting: boolean;
  formatTimestamp: (timestamp: string) => string;
}) {
  const [showActions, setShowActions] = useState(false);
  const isOwner = currentUserId === comment.authorId;

  return (
    <div className="flex space-x-3">
      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-white font-medium text-xs">
          {comment.authorDisplayName.charAt(0)}
        </span>
      </div>
      <div className="flex-1">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium text-gray-900 text-sm">
                {comment.authorDisplayName}
              </h4>
              <p className="text-xs text-gray-500 mt-1">
                {formatTimestamp(comment.createdAt)}
              </p>
            </div>
            {isOwner && (
              <div className="relative">
                <button
                  onClick={() => setShowActions(!showActions)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                >
                  <MoreHorizontal className="w-4 h-4 text-gray-400" />
                </button>
                {showActions && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowActions(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                      <button
                        onClick={() => { onEdit(); setShowActions(false); }}
                        className="w-full px-3 py-1 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => { onDelete(); setShowActions(false); }}
                        className="w-full px-3 py-1 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          
          {isEditing ? (
            <div className="mt-2 space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
              />
              <div className="flex space-x-2">
                <button
                  onClick={() => onUpdate(comment.id)}
                  disabled={!editContent.trim() || isSubmitting}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditContent('')}
                  className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-800 text-sm mt-2">{comment.content}</p>
          )}
        </div>
        
        {!isEditing && (
          <div className="flex items-center space-x-4 mt-2">
            <button
              onClick={onLike}
              className={`flex items-center space-x-1 text-sm ${
                comment.likedByMe ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
              }`}
            >
              <Heart className={`w-4 h-4 ${comment.likedByMe ? 'fill-current' : ''}`} />
              <span>{comment.likeCount}</span>
            </button>
            <button
              onClick={onReply}
              className="flex items-center space-x-1 text-sm text-gray-500 hover:text-blue-600"
            >
              <Reply className="w-4 h-4" />
              <span>Reply</span>
            </button>
          </div>
        )}

        {/* Nested replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                currentUserId={currentUserId}
                onLike={() => {}} // Handle reply likes
                onReply={() => {}} // Handle reply to reply
                onEdit={() => {}} // Handle reply edit
                onDelete={() => {}} // Handle reply delete
                onUpdate={() => {}} // Handle reply update
                isEditing={false}
                editContent=""
                setEditContent={() => {}}
                isSubmitting={false}
                formatTimestamp={formatTimestamp}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
