/**
 * React Components for Nexus Network Service
 * Reusable components for displaying and interacting with posts
 */

import React, { useState } from 'react';
import { PostResponse, PostType, CommentResponse, MediaResponse } from './api-client';
import { usePostInteractions, useComments, useCreatePost, useMediaUpload, UseNetworkConfig } from './hooks';

// =================== UTILITY COMPONENTS ===================

interface TimeAgoProps {
  date: string;
}

const TimeAgo: React.FC<TimeAgoProps> = ({ date }) => {
  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffMs = now.getTime() - postDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return postDate.toLocaleDateString();
  };

  return <span className="text-sm text-gray-500">{getTimeAgo(date)}</span>;
};

const UserAvatar: React.FC<{ src?: string; name: string; size?: 'sm' | 'md' | 'lg' }> = ({ 
  src, 
  name, 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  };

  if (src) {
    return (
      <img 
        src={src} 
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover`}
      />
    );
  }

  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-blue-500 text-white flex items-center justify-center font-medium`}>
      {initials}
    </div>
  );
};

// =================== MEDIA COMPONENTS ===================

interface MediaGalleryProps {
  media: MediaResponse[];
}

const MediaGallery: React.FC<MediaGalleryProps> = ({ media }) => {
  if (!media.length) return null;

  return (
    <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg overflow-hidden">
      {media.map((item, index) => (
        <div key={item.id} className="relative">
          {item.mimeType.startsWith('image/') ? (
            <img
              src={item.url}
              alt=""
              className="w-full h-48 object-cover hover:opacity-90 transition-opacity cursor-pointer"
            />
          ) : item.mimeType.startsWith('video/') ? (
            <video
              src={item.url}
              controls
              className="w-full h-48 object-cover"
            />
          ) : null}
        </div>
      ))}
    </div>
  );
};

// =================== POST TYPE-SPECIFIC COMPONENTS ===================

interface ProjectDataProps {
  data: any;
}

const ProjectUpdateDisplay: React.FC<ProjectDataProps> = ({ data }) => (
  <div className="mt-3 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
    <div className="flex justify-between items-start mb-2">
      <h4 className="font-semibold text-blue-900">{data.projectTitle}</h4>
      {data.progress && (
        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
          {data.progress}% Complete
        </span>
      )}
    </div>
    
    {data.milestone && (
      <p className="text-sm text-blue-700 mb-2">
        <strong>Milestone:</strong> {data.milestone}
      </p>
    )}
    
    {data.techStack?.length && (
      <div className="flex flex-wrap gap-1 mb-2">
        {data.techStack.map((tech: string, i: number) => (
          <span key={i} className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">
            {tech}
          </span>
        ))}
      </div>
    )}
    
    <div className="flex gap-3 text-sm">
      {data.githubUrl && (
        <a href={data.githubUrl} target="_blank" rel="noopener noreferrer" 
           className="text-blue-600 hover:underline">
          🔗 GitHub
        </a>
      )}
      {data.demoUrl && (
        <a href={data.demoUrl} target="_blank" rel="noopener noreferrer" 
           className="text-blue-600 hover:underline">
          🚀 Demo
        </a>
      )}
    </div>
  </div>
);

const BadgeAwardDisplay: React.FC<{ data: any }> = ({ data }) => (
  <div className="mt-3 p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
    <div className="flex items-center gap-3">
      <div className="text-2xl">🏆</div>
      <div>
        <h4 className="font-semibold text-yellow-900">{data.badgeName}</h4>
        <p className="text-sm text-yellow-700">{data.description}</p>
        <span className={`text-xs px-2 py-1 rounded mt-1 inline-block ${
          data.rarity === 'legendary' ? 'bg-purple-100 text-purple-800' :
          data.rarity === 'epic' ? 'bg-orange-100 text-orange-800' :
          data.rarity === 'rare' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {data.rarity}
        </span>
      </div>
    </div>
  </div>
);

const CollaborationDisplay: React.FC<{ data: any }> = ({ data }) => (
  <div className="mt-3 p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
    <div className="flex justify-between items-start mb-2">
      <h4 className="font-semibold text-green-900">Looking for Collaborators</h4>
      <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
        {data.capacity} spots
      </span>
    </div>
    
    {data.requiredSkills?.length && (
      <div className="mb-3">
        <p className="text-sm text-green-700 mb-1"><strong>Skills needed:</strong></p>
        <div className="flex flex-wrap gap-1">
          {data.requiredSkills.map((skill: string, i: number) => (
            <span key={i} className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
              {skill}
            </span>
          ))}
        </div>
      </div>
    )}
    
    {data.deadline && (
      <p className="text-sm text-green-700 mb-2">
        <strong>Deadline:</strong> {new Date(data.deadline).toLocaleDateString()}
      </p>
    )}
    
    <button className="bg-green-500 text-white px-4 py-2 rounded text-sm hover:bg-green-600 transition-colors">
      {data.applyInApp ? 'Apply Now' : 'Contact'}
    </button>
  </div>
);

const EventDisplay: React.FC<{ data: any }> = ({ data }) => (
  <div className="mt-3 p-4 bg-purple-50 rounded-lg border-l-4 border-purple-400">
    <div className="flex justify-between items-start mb-2">
      <h4 className="font-semibold text-purple-900">{data.title}</h4>
      <span className="text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded">
        {data.type}
      </span>
    </div>
    
    <div className="text-sm text-purple-700 space-y-1 mb-3">
      <p><strong>📅 Date:</strong> {new Date(data.date).toLocaleString()}</p>
      <p><strong>📍 Location:</strong> {data.location}</p>
      {data.capacity && (
        <p><strong>👥 Capacity:</strong> {data.capacity} attendees</p>
      )}
    </div>
    
    {data.registrationRequired && (
      <button className="bg-purple-500 text-white px-4 py-2 rounded text-sm hover:bg-purple-600 transition-colors">
        Register Now
      </button>
    )}
  </div>
);

const JobPostingDisplay: React.FC<{ data: any }> = ({ data }) => (
  <div className="mt-3 p-4 bg-indigo-50 rounded-lg border-l-4 border-indigo-400">
    <div className="flex justify-between items-start mb-2">
      <div>
        <h4 className="font-semibold text-indigo-900">{data.title}</h4>
        <p className="text-sm text-indigo-700">{data.company} • {data.location}</p>
      </div>
      <span className="text-sm bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
        {data.type}
      </span>
    </div>
    
    {data.salaryRange && (
      <p className="text-sm text-indigo-700 mb-2">
        <strong>💰 Salary:</strong> {data.salaryRange}
      </p>
    )}
    
    {data.deadline && (
      <p className="text-sm text-indigo-700 mb-3">
        <strong>⏰ Apply by:</strong> {new Date(data.deadline).toLocaleDateString()}
      </p>
    )}
    
    {data.applyUrl && (
      <a 
        href={data.applyUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="inline-block bg-indigo-500 text-white px-4 py-2 rounded text-sm hover:bg-indigo-600 transition-colors"
      >
        Apply Now
      </a>
    )}
  </div>
);

// =================== POST INTERACTION COMPONENTS ===================

interface PostActionsProps {
  post: PostResponse;
  config: UseNetworkConfig;
  onUpdate: (updatedPost: Partial<PostResponse>) => void;
}

const PostActions: React.FC<PostActionsProps> = ({ post, config, onUpdate }) => {
  const { toggleLike, toggleBookmark, liking, bookmarking } = usePostInteractions(config);

  const handleLike = async () => {
    try {
      const result = await toggleLike(post.id, post.likedByMe);
      onUpdate({
        likedByMe: 'liked' in result ? result.liked : !result.unliked,
        likeCount: result.likeCount
      });
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const handleBookmark = async () => {
    try {
      const result = await toggleBookmark(post.id, post.bookmarkedByMe);
      onUpdate({
        bookmarkedByMe: 'bookmarked' in result ? result.bookmarked : !result.removed
      });
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    }
  };

  return (
    <div className="flex items-center gap-4 pt-3 border-t">
      <button
        onClick={handleLike}
        disabled={liking[post.id]}
        className={`flex items-center gap-1 px-3 py-2 rounded text-sm transition-colors ${
          post.likedByMe
            ? 'text-red-600 bg-red-50 hover:bg-red-100'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        {post.likedByMe ? '❤️' : '🤍'} {post.likeCount}
      </button>

      <button
        onClick={() => {}} // Handle comment toggle
        className="flex items-center gap-1 px-3 py-2 rounded text-sm text-gray-600 hover:bg-gray-100 transition-colors"
      >
        💬 {post.commentCount}
      </button>

      <button
        onClick={handleBookmark}
        disabled={bookmarking[post.id]}
        className={`flex items-center gap-1 px-3 py-2 rounded text-sm transition-colors ${
          post.bookmarkedByMe
            ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        {post.bookmarkedByMe ? '🔖' : '📎'} Save
      </button>
    </div>
  );
};

// =================== COMMENTS COMPONENT ===================

interface CommentsProps {
  postId: string;
  config: UseNetworkConfig;
}

const Comments: React.FC<CommentsProps> = ({ postId, config }) => {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const { comments, loading, createComment, deleteComment } = useComments(postId, config);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    try {
      await createComment(newComment);
      setNewComment('');
    } catch (error) {
      console.error('Failed to create comment:', error);
    }
  };

  if (!showComments) {
    return (
      <button
        onClick={() => setShowComments(true)}
        className="text-sm text-blue-600 hover:underline"
      >
        View Comments ({comments.length})
      </button>
    );
  }

  return (
    <div className="mt-4 border-t pt-4">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-medium">Comments</h4>
        <button
          onClick={() => setShowComments(false)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Hide
        </button>
      </div>

      <form onSubmit={handleSubmitComment} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Post
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <UserAvatar src={comment.userAvatarUrl} name={comment.userDisplayName} size="sm" />
            <div className="flex-1 bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-sm">{comment.userDisplayName}</p>
                  <p className="text-sm mt-1">{comment.content}</p>
                </div>
                <TimeAgo date={comment.createdAt} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// =================== MAIN POST COMPONENT ===================

interface PostCardProps {
  post: PostResponse;
  config: UseNetworkConfig;
  onUpdate?: (updatedPost: PostResponse) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, config, onUpdate }) => {
  const [currentPost, setCurrentPost] = useState(post);

  const handleUpdate = (updates: Partial<PostResponse>) => {
    const updatedPost = { ...currentPost, ...updates };
    setCurrentPost(updatedPost);
    onUpdate?.(updatedPost);
  };

  const renderTypeSpecificContent = () => {
    switch (post.type) {
      case PostType.PROJECT_UPDATE:
        return post.projectData && <ProjectUpdateDisplay data={post.projectData} />;
      case PostType.BADGE_AWARD:
        return post.badgeData && <BadgeAwardDisplay data={post.badgeData} />;
      case PostType.COLLABORATION:
        return post.collaborationData && <CollaborationDisplay data={post.collaborationData} />;
      case PostType.EVENT:
        return post.eventData && <EventDisplay data={post.eventData} />;
      case PostType.JOB_POSTING:
        return post.jobData && <JobPostingDisplay data={post.jobData} />;
      default:
        return null;
    }
  };

  const getPostTypeIcon = () => {
    const icons = {
      [PostType.GENERAL]: '💬',
      [PostType.PROJECT_UPDATE]: '🚀',
      [PostType.BADGE_AWARD]: '🏆',
      [PostType.COLLABORATION]: '🤝',
      [PostType.JOB_POSTING]: '💼',
      [PostType.EVENT]: '📅',
      [PostType.ANNOUNCEMENT]: '📢',
      [PostType.PROJECT_SHOWCASE]: '🎨',
      [PostType.RESEARCH_PAPER]: '📄',
      [PostType.EVENT_HIGHLIGHT]: '✨',
      [PostType.SHARE]: '🔄',
      [PostType.AD]: '📣'
    };
    return icons[post.type] || '💬';
  };

  return (
    <div className="bg-white rounded-lg shadow border p-6 mb-4">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-3">
          <UserAvatar 
            src={currentPost.authorAvatarUrl} 
            name={currentPost.authorDisplayName} 
          />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{currentPost.authorDisplayName}</h3>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                {currentPost.authorRole}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{getPostTypeIcon()}</span>
              <TimeAgo date={currentPost.createdAt} />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {currentPost.content && (
        <div className="mb-3">
          <p className="text-gray-800 whitespace-pre-wrap">{currentPost.content}</p>
        </div>
      )}

      {/* Tags */}
      {currentPost.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {currentPost.tags.map((tag, index) => (
            <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Type-specific content */}
      {renderTypeSpecificContent()}

      {/* Media */}
      <MediaGallery media={currentPost.media} />

      {/* Links */}
      {currentPost.links.length > 0 && (
        <div className="mt-3 space-y-1">
          {currentPost.links.map((link, index) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-blue-600 hover:underline text-sm"
            >
              🔗 {link.title || link.url}
            </a>
          ))}
        </div>
      )}

      {/* Actions */}
      <PostActions post={currentPost} config={config} onUpdate={handleUpdate} />

      {/* Comments */}
      <Comments postId={currentPost.id} config={config} />
    </div>
  );
};

// =================== FEED COMPONENT ===================

interface FeedProps {
  posts: PostResponse[];
  config: UseNetworkConfig;
  onPostUpdate?: (postId: string, updatedPost: PostResponse) => void;
}

const Feed: React.FC<FeedProps> = ({ posts, config, onPostUpdate }) => {
  return (
    <div className="max-w-2xl mx-auto">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          config={config}
          onUpdate={(updatedPost) => onPostUpdate?.(post.id, updatedPost)}
        />
      ))}
    </div>
  );
};

// =================== EXPORT ALL COMPONENTS ===================

export {
  PostCard,
  Feed,
  Comments,
  PostActions,
  MediaGallery,
  ProjectUpdateDisplay,
  BadgeAwardDisplay,
  CollaborationDisplay,
  EventDisplay,
  JobPostingDisplay,
  TimeAgo,
  UserAvatar
};
