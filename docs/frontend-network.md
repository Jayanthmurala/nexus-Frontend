# Nexus Frontend Network Guide

Fast reference for integrating the Network service for social features.

- Base URL: `NEXT_PUBLIC_NETWORK_API_BASE_URL`
- Client: `src/lib/httpNetwork.ts` (Axios with auth + refresh)
- API wrapper: `src/lib/networkApi.ts`
- Redux integration: `src/store/slices/networkSlice.ts`
- Real-time WebSocket integration for live updates
- Social feed with college and following scopes
- Comprehensive messaging system with typing indicators

## TL;DR Quick Start
1) Set `NEXT_PUBLIC_NETWORK_API_BASE_URL` in `.env.local`.
2) Import `networkApi` and call typed methods.

```ts
import networkApi from '@/lib/networkApi';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createPost, followUser, fetchFeed } from '@/store/slices/networkSlice';

// Redux-integrated social features
const dispatch = useAppDispatch();
const feed = useAppSelector(state => state.network.feed.items);

// Create a post
await dispatch(createPost({
  content: 'Excited to share my latest project!',
  visibility: 'PUBLIC',
  mediaUrls: ['https://example.com/image.jpg'],
  tags: ['#project', '#ai']
}));

// Follow/unfollow users
await dispatch(followUser(userId));
await networkApi.unfollowUser(userId);

// Fetch social feed
await dispatch(fetchFeed({ scope: 'college', limit: 20 }));
```

## Concepts and data model
- __Post__: social media content with `content`, `visibility` (PUBLIC/COLLEGE), `mediaUrls`, `tags`, `likes`, `bookmarks`. See `Post` in `src/lib/networkApi.ts`.
- __Follow__: user relationship for following other users. Creates following/followers lists.
- __Feed__: aggregated posts based on scope (following, college, global) with cursor pagination.
- __Message__: private messaging between users with real-time delivery and typing indicators.
- __Conversation__: message thread between users with online status and unread counts.
- __Visibility Scopes__:
  - `PUBLIC`: visible to all users across colleges
  - `COLLEGE`: visible only to users in the same college
- __Feed Scopes**:
  - `following`: posts from followed users (requires authentication)
  - `college`: posts from same college with COLLEGE visibility
  - `global`: all PUBLIC posts across the platform

## Roles and authorization
- __Post Creation__: all authenticated users can create posts
- __Post Management__: users can edit/delete their own posts only
- __Following__: all users can follow/unfollow others (no restrictions)
- __Messaging__: all users can send messages to others
- __Feed Access__:
  - Following feed: requires authentication
  - College feed: requires college affiliation
  - Global feed: public access
- __Moderation__: admins can moderate posts and manage reported content

## Request semantics
- Posts use `POST /v1/posts` for creation, `PUT /v1/posts/:id` for updates, `DELETE /v1/posts/:id` for deletion
- Follow relationships use `POST /v1/network/follow/:userId` and `DELETE /v1/network/unfollow/:userId`
- Messages use WebSocket for real-time delivery with fallback to REST API
- Feed uses cursor-based pagination with `nextCursor` for infinite scroll
- All timestamps are ISO strings; treat as UTC in UI

## Pagination and filters
- Feed pagination uses cursor-based approach: `{ items, nextCursor, hasMore }`
- Supported feed filters: `scope`, `limit`, `cursor`
- Message history supports pagination with `before` cursor
- User directory supports filters: `role`, `department`, `year`, `q` (search)
- Always render from backend response; implement infinite scroll for feeds

## Error handling
- `401` auto-refreshes once via Axios interceptors
- `403` indicates insufficient privileges (e.g., private profiles, blocked users)
- `404` for missing posts, users, or conversations
- `429` for rate limiting on posts/messages; show cooldown timer
- WebSocket disconnections trigger automatic reconnection with exponential backoff

## CSR vs SSR
- Social feeds benefit from CSR for real-time updates and infinite scroll
- User profiles can be SSR for SEO and initial load performance
- Messages require CSR for real-time functionality
- Use `getServerSession(authOptions)` for SSR and attach `Authorization` header

## Quick recipes

### Social Feed Management (Redux integrated)
```ts
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchFeed, createPost, likePost, bookmarkPost } from '@/store/slices/networkSlice';

const dispatch = useAppDispatch();
const feed = useAppSelector(state => state.network.feed);

// Fetch different feed scopes
await dispatch(fetchFeed({ scope: 'following', limit: 20 }));
await dispatch(fetchFeed({ scope: 'college', limit: 20 }));
await dispatch(fetchFeed({ scope: 'global', limit: 20 }));

// Create post with media upload
const handleCreatePost = async (content: string, files: File[]) => {
  const mediaUrls = [];
  
  // Upload files if any
  for (const file of files) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await uploadMedia(formData);
    mediaUrls.push(response.data.url);
  }
  
  await dispatch(createPost({
    content,
    visibility: 'PUBLIC', // or 'COLLEGE'
    mediaUrls,
    tags: extractHashtags(content) // ['#ai', '#project']
  }));
  
  toast.success('Post created successfully!');
};

// Update existing post
await networkApi.updatePost(postId, {
  content: 'Updated: Excited about my AI research progress! 🚀',
  visibility: 'COLLEGE'
});
```

### Post Interactions (Redux integrated)
```ts
import { useAppDispatch } from '@/store/hooks';
import { likePost, unlikePost, bookmarkPost } from '@/store/slices/networkSlice';

const dispatch = useAppDispatch();

// Like/unlike with optimistic updates
const handleLike = async (postId: string, isLiked: boolean) => {
  try {
    if (isLiked) {
      await dispatch(unlikePost(postId));
    } else {
      await dispatch(likePost(postId));
    }
  } catch (error) {
    toast.error('Failed to update like status');
  }
};

// Bookmark posts
await dispatch(bookmarkPost(postId));

// Get user's bookmarked posts
const bookmarks = await networkApi.getBookmarks({ limit: 50 });
```

### Following System (Redux integrated)
```ts
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { followUser, unfollowUser, fetchSuggestions } from '@/store/slices/networkSlice';

const dispatch = useAppDispatch();
const suggestions = useAppSelector(state => state.network.suggestions);

// Follow/unfollow users
await dispatch(followUser(userId));
await dispatch(unfollowUser(userId));

// Get follow suggestions
await dispatch(fetchSuggestions());

// Get followers/following lists
const followers = await networkApi.getFollowers(userId, { limit: 100 });
const following = await networkApi.getFollowing(userId, { limit: 100 });

// Check if following a user
const isFollowing = await networkApi.isFollowing(userId);
```

## Messaging Features

### Real-time Messaging
```ts
import { useWebSocket } from '@/contexts/WebSocketContext';

// Send message
const { sendMessage } = useWebSocket();
await sendMessage({
  conversationId,
  content: 'Hello!',
  type: 'text'
});

// Listen for messages
useEffect(() => {
  const handleMessage = (message) => {
    // Update conversation state
    updateConversation(message);
  };
  
  socket.on('message', handleMessage);
  return () => socket.off('message', handleMessage);
}, []);
```

### Conversation Management
```ts
// Get conversations list
const conversations = await networkApi.getConversations();

// Get conversation messages
const messages = await networkApi.getMessages(conversationId, {
  limit: 50,
  before: cursor
});

// Mark conversation as read
await networkApi.markAsRead(conversationId);

// Get unread count
const unreadCount = await networkApi.getUnreadCount();
```

### Typing Indicators
```ts
// Send typing indicator
const handleTyping = () => {
  socket.emit('typing', { conversationId, userId });
};

// Listen for typing
useEffect(() => {
  const handleTyping = ({ userId, conversationId }) => {
    setTypingUsers(prev => [...prev, userId]);
    
    // Clear typing after 3 seconds
    setTimeout(() => {
      setTypingUsers(prev => prev.filter(id => id !== userId));
    }, 3000);
  };
  
  socket.on('typing', handleTyping);
  return () => socket.off('typing', handleTyping);
}, []);
```

## User Directory and Search

### User Discovery
```ts
// Search users with filters
const users = await networkApi.searchUsers({
  q: 'john',
  role: 'student',
  department: 'Computer Science',
  year: 3
});

// Get user profile
const profile = await networkApi.getUserProfile(userId);

// Check follow status
const isFollowing = await networkApi.isFollowing(userId);
```

### Network Statistics
```ts
// Get user's network stats
const stats = await networkApi.getNetworkStats(userId);
// Returns: { followersCount, followingCount, postsCount, likesReceived }

// Get trending posts
const trending = await networkApi.getTrendingPosts({
  timeframe: '24h', // 24h, 7d, 30d
  limit: 10
});
```

## WebSocket Integration

### Connection Management
```ts
import { WebSocketProvider, useWebSocket } from '@/contexts/WebSocketContext';

// In app root
<WebSocketProvider>
  <App />
</WebSocketProvider>

// In components
const { socket, isConnected, sendMessage } = useWebSocket();

// Connection status
if (!isConnected) {
  return <div>Connecting to real-time services...</div>;
}
```

### Event Handling
```ts
// Listen for various events
useEffect(() => {
  if (!socket) return;
  
  const handlers = {
    'post-update': handlePostUpdate,
    'follow-update': handleFollowUpdate,
    'message': handleNewMessage,
    'typing': handleTyping,
    'user-online': handleUserOnline,
    'user-offline': handleUserOffline
  };
  
  Object.entries(handlers).forEach(([event, handler]) => {
    socket.on(event, handler);
  });
  
  return () => {
    Object.keys(handlers).forEach(event => {
      socket.off(event);
    });
  };
}, [socket]);
```

## Redux Integration

### Network State Management
```ts
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { 
  fetchFeed, 
  createPost, 
  followUser, 
  fetchSuggestions 
} from '@/store/slices/networkSlice';

// Access state
const feed = useAppSelector(state => state.network.feed);
const suggestions = useAppSelector(state => state.network.suggestions);
const following = useAppSelector(state => state.network.following);

// Dispatch actions
const dispatch = useAppDispatch();
await dispatch(fetchFeed({ scope: 'following' }));
await dispatch(fetchSuggestions());
```

### Optimistic Updates
```ts
// Like post with optimistic update
const handleLike = async (postId: string) => {
  // Optimistic update
  dispatch(optimisticLikePost(postId));
  
  try {
    await networkApi.likePost(postId);
  } catch (error) {
    // Revert on error
    dispatch(revertLikePost(postId));
    toast.error('Failed to like post');
  }
};
```

## UI Components

### Feed Components
- `Feed.tsx`: Main feed container with infinite scroll
- `PostCard.tsx`: Individual post display with actions
- `CreatePost.tsx`: Post creation modal with media upload
- `PostActions.tsx`: Like, bookmark, share buttons

### Messaging Components
- `MessageInterface.tsx`: Full messaging interface
- `ConversationList.tsx`: List of conversations with unread indicators
- `MessageBubble.tsx`: Individual message display
- `TypingIndicator.tsx`: Shows who's typing

### Network Components
- `Network.tsx`: User directory and search
- `UserCard.tsx`: User profile card with follow button
- `FollowButton.tsx`: Follow/unfollow action button
- `SuggestedUsers.tsx`: User suggestions carousel

## SSR usage
- Use `getServerSession(authOptions)` and attach `Authorization` header
- Initial feed data can be fetched server-side for faster page loads
- Real-time features require client-side hydration
- User profiles benefit from SSR for SEO

## Troubleshooting
- WebSocket connection issues: check network configuration and authentication
- Feed not updating: verify WebSocket events are being received
- Message delivery failures: check conversation permissions and user blocks
- Follow/unfollow not working: ensure proper authentication and rate limiting
- Media upload failures: check file size limits and supported formats
- Real-time updates not working: verify WebSocket connection and event subscriptions
