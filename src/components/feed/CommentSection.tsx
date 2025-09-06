import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, Heart, MoreHorizontal, Trash2, Edit3 } from 'lucide-react';
import { networkApi, Comment } from '../../lib/networkApi';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface CommentItem {
  id: string;
  content: string;
  userId: string;
  userDisplayName: string;
  userAvatarUrl?: string;
  createdAt: string;
}

interface CommentSectionProps {
  postId: string;
  commentCount: number;
  onCommentCountChange: (count: number) => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId, commentCount, onCommentCountChange }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>();

  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    try {
      setIsLoading(true);
      const response = await networkApi.getComments(postId, undefined, 10);
      const commentItems: CommentItem[] = response.items.map(comment => ({
        id: comment.id,
        content: comment.content,
        userId: comment.authorId,
        userDisplayName: comment.authorDisplayName,
        userAvatarUrl: comment.authorAvatarUrl,
        createdAt: comment.createdAt
      }));
      setComments(commentItems);
      setCursor(response.nextCursor);
    } catch (error) {
      console.error('Failed to load comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const comment = await networkApi.createComment(postId, newComment);
      
      // Map Comment to CommentItem
      const commentItem: CommentItem = {
        id: comment.id,
        content: comment.content,
        userId: comment.authorId,
        userDisplayName: comment.authorDisplayName,
        userAvatarUrl: comment.authorAvatarUrl,
        createdAt: comment.createdAt
      };
      
      setComments(prev => [commentItem, ...prev]);
      setNewComment('');
      onCommentCountChange(commentCount + 1);
      toast.success('Comment posted!');
    } catch (error) {
      console.error('Failed to post comment:', error);
      toast.error('Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await networkApi.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      onCommentCountChange(commentCount - 1);
      toast.success('Comment deleted');
    } catch (error) {
      console.error('Failed to delete comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200">
      {/* Comment Form */}
      <div className="p-4 bg-gray-50">
        <form onSubmit={handleSubmitComment} className="flex gap-3">
          <div className="flex-shrink-0">
            <img
              src={user?.avatar || '/default-avatar.png'}
              alt={user?.displayName || 'User'}
              className="w-8 h-8 rounded-full object-cover"
            />
          </div>
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
            />
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmitting}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Comments List */}
      <div className="divide-y divide-gray-200">
        {comments.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <img
                    src={comment.userAvatarUrl || '/default-avatar.png'}
                    alt={comment.userDisplayName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900 text-sm">
                        {comment.userDisplayName}
                      </h4>
                      <span className="text-xs text-gray-500">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    {comment.userId === user?.id && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete comment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-gray-700 text-sm mt-1 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection;
