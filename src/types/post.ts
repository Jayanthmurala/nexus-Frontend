export interface PostAuthor {
  id: string;
  displayName: string;
  avatarUrl?: string;
  role: 'student' | 'faculty' | 'dept_admin' | 'head_admin';
  department?: string;
  college?: string;
}

export interface BadgeData {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  awardedAt: string;
  criteria?: string;
}

export interface CollaborationData {
  requiredSkills: string[];
  capacity: number;
  currentApplicants: number;
  deadline: string;
  applyInApp: boolean;
  applyLink?: string;
  status: 'open' | 'closed' | 'full';
}

export interface ProjectUpdateData {
  projectId: string;
  projectTitle: string;
  milestone: string;
  progress: number;
  teamMembers: string[];
}

export interface EventData {
  eventId?: string;
  title: string;
  date: string;
  location: string;
  type: 'workshop' | 'seminar' | 'conference' | 'competition';
  registrationRequired: boolean;
  capacity?: number;
  registrationUrl?: string;
}

export interface JobData {
  title: string;
  company: string;
  location: string;
  type: 'full-time' | 'part-time' | 'internship' | 'contract';
  deadline?: string;
  applyUrl?: string;
  salaryRange?: string;
}

export interface ProjectData {
  projectId?: string;
  projectTitle: string;
  milestone?: string;
  progress?: number;
  teamMembers?: string[];
  githubUrl?: string;
  demoUrl?: string;
  techStack?: string[];
}

export interface PostMedia {
  id: string;
  url: string;
  mimeType: string;
  width?: number;
  height?: number;
}

export interface PostLink {
  url: string;
  title?: string;
  order: number;
}

export type PostType = 
  | 'GENERAL' 
  | 'BADGE_AWARD' 
  | 'PROJECT_UPDATE' 
  | 'COLLABORATION' 
  | 'JOB_POSTING'
  | 'EVENT'
  | 'ANNOUNCEMENT'
  | 'AD_POST';

export type PostStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type PostVisibility = 'PUBLIC' | 'COLLEGE' | 'DEPARTMENT' | 'PRIVATE';

export interface PostResponse {
  id: string;
  type: PostType;
  content?: string;
  visibility: PostVisibility;
  status: PostStatus;
  createdAt: string;
  updatedAt: string;
  
  // Author info
  authorId: string;
  authorDisplayName: string;
  authorAvatarUrl?: string;
  authorRole: string;
  authorDepartment?: string;
  authorCollegeId: string;
  
  // Engagement
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewCount: number;
  
  // User interactions
  likedByMe: boolean;
  bookmarkedByMe: boolean;
  
  // Content
  media: PostMedia[];
  tags: string[];
  links: PostLink[];
  
  // Type-specific data
  badgeData?: any;
  collaborationData?: any;
  projectData?: any;
  eventData?: any;
  jobData?: any;
  adData?: any;
}

// Legacy interface for backward compatibility
export interface Post {
  id: string;
  type: PostType;
  state: PostStatus;
  verificationStatus?: 'verified' | 'unverified' | 'pending';
  author: PostAuthor;
  content: string;
  visibility: PostVisibility;
  createdAt: string;
  updatedAt?: string;
  
  // Engagement metrics
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewCount?: number;
  
  // User interactions
  likedByMe: boolean;
  bookmarkedByMe: boolean;
  
  // Media and links
  media: PostMedia[];
  links: PostLink[];
  tags: string[];
  
  // Type-specific data (backend sends as JSON)
  badgeData?: any;
  collaborationData?: any;
  projectData?: any;
  eventData?: any;
  jobData?: any;
  
  // Algorithm ranking
  rankingScore?: number;
  departmentBoost?: number;
  collegeBoost?: number;
  tagOverlapScore?: number;
}

export interface CreatePostRequest {
  type: PostType;
  content: string;
  visibility?: 'PUBLIC' | 'COLLEGE';
  mediaIds?: string[];
  tags?: string[];
  links?: Array<{ url: string; title?: string }>;
  
  // Author fields from frontend
  authorCollegeId?: string;
  authorDepartment?: string;
  authorAvatarUrl?: string;
  
  // Type-specific data
  collaborationData?: Omit<CollaborationData, 'currentApplicants' | 'status'>;
  eventData?: Omit<EventData, 'eventId'>;
  projectData?: Omit<ProjectData, 'projectId'>;
  badgeData?: {
    badgeId: string;
    badgeName: string;
    description: string;
    criteria: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  };
  jobData?: JobData;
}

export interface TelemetryEvent {
  postId: string;
  eventType: 'viewImpression' | 'dwellMs' | 'expanded' | 'liked' | 'commented' | 'shared' | 'followedAuthor';
  value?: number;
  timestamp: string;
}

export type FeedScope = 'global' | 'college' | 'following';

export interface FeedParams {
  scope?: FeedScope;
  enableDeptBoost?: boolean;
  enableCollegeBoost?: boolean;
}

export interface PostPermissions {
  canCreate: PostType[];
  canPin: boolean;
  canVerify: boolean;
  canModerate: boolean;
}

export const POST_PERMISSIONS: Record<string, PostPermissions> = {
  student: {
    canCreate: ['GENERAL', 'PROJECT_UPDATE', 'COLLABORATION'],
    canPin: false,
    canVerify: false,
    canModerate: false,
  },
  faculty: {
    canCreate: ['GENERAL', 'PROJECT_UPDATE', 'COLLABORATION', 'JOB_POSTING', 'EVENT', 'ANNOUNCEMENT'],
    canPin: false,
    canVerify: true,
    canModerate: true,
  },
  dept_admin: {
    canCreate: ['GENERAL', 'PROJECT_UPDATE', 'COLLABORATION', 'JOB_POSTING', 'EVENT', 'ANNOUNCEMENT'],
    canPin: true,
    canVerify: true,
    canModerate: true,
  },
  head_admin: {
    canCreate: ['GENERAL', 'PROJECT_UPDATE', 'COLLABORATION', 'JOB_POSTING', 'EVENT', 'ANNOUNCEMENT', 'AD_POST'],
    canPin: true,
    canVerify: true,
    canModerate: true,
  },
};
