'use client';

import React, { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Heart, 
  Reply, 
  Edit3, 
  Trash2, 
  Send,
  Loader2,
  MoreHorizontal,
  X
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { networkApi, Comment } from '@/lib/networkApi';
import { toast } from 'react-hot-toast';

interface CommentSectionProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  initialCommentCount?: number;
}

interface CommentItemProps {
  comment: Comment;
  onReply: (commentId: string) => void;
  onEdit: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
  onLike: (commentId: string) => void;
  level?: number;
}

const CommentItem: React.FC<CommentItemProps> = memo(({ 
  comment, 
  onReply, 
  onEdit, 
  onDelete, 
  onLike, 
  level = 0 
}) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isLiking, setIsLiking] = useState(false);
  const [showReplies, setShowReplies] = useState(true);

  const isAuthor = user?.id === comment.authorId;
  const canEdit = isAuthor;

  const handleEdit = useCallback(async () => {
    if (!editContent.trim()) return;
    
    try {
      await onEdit(comment.id, editContent.trim());
      setIsEditing(false);
      toast.success('Comment updated!');
    } catch (error) {
      toast.error('Failed to update comment');
    }
  }, [comment.id, editContent, onEdit]);

  const handleLike = useCallback(async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      await onLike(comment.id);
    } catch (error) {
      toast.error('Failed to like comment');
    } finally {
      setIsLiking(false);
    }
  }, [comment.id, onLike, isLiking]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`${level > 0 ? 'ml-8 border-l-2 border-gray-100 pl-4' : ''}`}
    >
      <div className="flex space-x-3 py-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-semibold">
              {comment.authorDisplayName?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="bg-gray-50 rounded-lg px-3 py-2">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-semibold text-gray-900">
                {comment.authorDisplayName}
              </h4>
              <div className="flex items-center space-x-1">
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </span>
                {canEdit && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onDelete(comment.id)}
                      className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-2 text-sm border border-gray-200 rounded resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEdit}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-700">{comment.content}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-4 mt-2">
            <button
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center space-x-1 text-xs ${
                comment.likedByMe 
                  ? 'text-red-600' 
                  : 'text-gray-500 hover:text-red-600'
              }`}
            >
              <Heart className={`w-3 h-3 ${comment.likedByMe ? 'fill-current' : ''} ${isLiking ? 'animate-pulse' : ''}`} />
              <span>{comment.likeCount || 0}</span>
            </button>
            
            <button
              onClick={() => onReply(comment.id)}
              className="text-xs text-gray-500 hover:text-blue-600"
            >
              Reply
            </button>
            
            {comment.replies && comment.replies.length > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {showReplies ? 'Hide' : 'Show'} {comment.replies.length} replies
              </button>
            )}
          </div>
          
          {/* Nested Replies */}
          <AnimatePresence>
            {showReplies && comment.replies && comment.replies.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2"
              >
                {comment.replies.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    onReply={onReply}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onLike={onLike}
                    level={level + 1}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
});

const CommentSection: React.FC<CommentSectionProps> = ({ 
  postId, 
  isOpen, 
  onClose, 
  initialCommentCount = 0 
}) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);

  const fetchComments = useCallback(async (refresh = false) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const result = await networkApi.getComments(
        postId, 
        refresh ? undefined : cursor, 
        20
      );
      
      if (refresh) {
        setComments(result.items);
      } else {
        // Prevent duplicates by checking existing IDs
        setComments(prev => {
          const existingIds = new Set(prev.map(c => c.id));
          const newComments = result.items.filter(c => !existingIds.has(c.id));
          return [...prev, ...newComments];
        });
      }
      
      setCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [postId, cursor, loading]);

  const handleSubmitComment = useCallback(async () => {
    if (!newComment.trim() || submitting) return;
    
    setSubmitting(true);
    try {
      const comment = await networkApi.createComment(
        postId, 
        newComment.trim(), 
        replyingTo || undefined
      );
      
      if (replyingTo) {
        // Add reply to existing comment
        setComments(prev => prev.map(c => 
          c.id === replyingTo 
            ? { ...c, replies: [...(c.replies || []), comment] }
            : c
        ));
      } else {
        // Add new top-level comment
        setComments(prev => [comment, ...prev]);
      }
      
      setNewComment('');
      setReplyingTo(null);
      toast.success('Comment posted!');
    } catch (error) {
      console.error('Failed to post comment:', error);
      toast.error('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  }, [postId, newComment, replyingTo, submitting]);

  const handleEditComment = useCallback(async (commentId: string, content: string) => {
    try {
      const updatedComment = await networkApi.updateComment(commentId, content);
      setComments(prev => prev.map(c => 
        c.id === commentId ? updatedComment : c
      ));
    } catch (error) {
      throw error;
    }
  }, []);

  const handleDeleteComment = useCallback(async (commentId: string) => {
    if (!window.confirm('Delete this comment?')) return;
    
    try {
      await networkApi.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success('Comment deleted');
    } catch (error) {
      console.error('Failed to delete comment:', error);
      toast.error('Failed to delete comment');
    }
  }, []);

  const handleLikeComment = useCallback(async (commentId: string) => {
    try {
      const result = await networkApi.likeComment(commentId);
      setComments(prev => prev.map(c => 
        c.id === commentId 
          ? { ...c, likedByMe: result.liked, likeCount: result.likeCount }
          : c
      ));
    } catch (error) {
      throw error;
    }
  }, []);

  useEffect(() => {
    if (isOpen && comments.length === 0) {
      fetchComments(true);
    }
  }, [isOpen, fetchComments, comments.length]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="border-t border-gray-100 bg-gray-50/50"
    >
      <div className="p-4 space-y-4">
        {/* Comment Input */}
        <div className="flex space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">
                {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
          </div>
          <div className="flex-1">
            <div className="relative">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
                className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
              {replyingTo && (
                <button
                  onClick={() => setReplyingTo(null)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-500">
                {newComment.length}/500 characters
              </span>
              <button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || submitting}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>{submitting ? 'Posting...' : 'Post'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Comments List */}
        <div className="space-y-2">
          <AnimatePresence>
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onReply={setReplyingTo}
                onEdit={handleEditComment}
                onDelete={handleDeleteComment}
                onLike={handleLikeComment}
              />
            ))}
          </AnimatePresence>
          
          {loading && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          )}
          
          {hasMore && !loading && comments.length > 0 && (
            <button
              onClick={() => fetchComments()}
              className="w-full py-2 text-sm text-blue-600 hover:text-blue-800"
            >
              Load more comments
            </button>
          )}
          
          {comments.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No comments yet. Be the first to comment!</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CommentSection;
