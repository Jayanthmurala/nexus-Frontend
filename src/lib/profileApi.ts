import http from './http';
import httpProfile from './httpProfile';

// Types matching backend schema
export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon?: string;
  color?: string;
  category?: string;
  rarity: string;
  criteria?: string;
  createdAt: string;
  createdBy?: string;
}

export interface StudentBadgeAward {
  id: string;
  studentId: string;
  badgeId: string;
  reason: string;
  awardedAt: string;
  badge?: BadgeDefinition;
  awardedByName?: string;
  studentName?: string;
  collegeMemberId?: string;
  projectId?: string;
  eventId?: string;
}

export interface CreateBadgeDefinitionPayload {
  name: string;
  description: string;
  criteria?: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  icon?: string;
  color?: string;
  category?: string;
}

export interface UpdateBadgeDefinitionPayload {
  name?: string;
  description?: string;
  criteria?: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  icon?: string;
  color?: string;
  category?: string;
}

export interface AwardBadgePayload {
  badgeDefinitionId: string;
  userId: string;
  reason: string;
  projectId?: string;
  eventId?: string;
  awardedByName?: string;
}

// Badge Definitions API
export const getBadgeDefinitions = async (): Promise<BadgeDefinition[]> => {
  const response = await httpProfile.get('/v1/badge-definitions');
  return response.data.badgeDefinitions;
};

export const createBadgeDefinition = async (data: CreateBadgeDefinitionPayload): Promise<BadgeDefinition> => {
  const response = await httpProfile.post('/v1/badge-definitions', data);
  return response.data.badgeDefinition;
};

export const updateBadgeDefinition = async (id: string, data: UpdateBadgeDefinitionPayload): Promise<BadgeDefinition> => {
  const response = await httpProfile.put(`/v1/badge-definitions/${id}`, data);
  return response.data.badgeDefinition;
};

export const deleteBadgeDefinition = async (id: string): Promise<void> => {
  await httpProfile.delete(`/v1/badge-definitions/${id}`);
};

export const awardBadge = async (payload: AwardBadgePayload): Promise<StudentBadgeAward> => {
  const response = await httpProfile.post('/v1/badges/award', {
    badgeDefinitionId: payload.badgeDefinitionId,
    userId: payload.userId,
    reason: payload.reason,
    projectId: payload.projectId,
    eventId: payload.eventId,
    awardedByName: payload.awardedByName
  });
  return response.data.badge;
};

// Badge Awards API
export const getAwards = async (studentId: string): Promise<StudentBadgeAward[]> => {
  const response = await httpProfile.get(`/v1/profile/badges/${studentId}`);
  return response.data.badges;
};

export const getRecentAwards = async (limit?: number): Promise<StudentBadgeAward[]> => {
  const params = limit ? { limit } : {};
  const response = await httpProfile.get('/v1/badges/recent', { params });
  return response.data.awards;
};

export const getAwardCounts = async (): Promise<Record<string, number>> => {
  const response = await httpProfile.get('/v1/badges/counts');
  return response.data.counts;
};

// Profile API functions
export interface Profile {
  socialLinks: any;
  id: string;
  userId: string;
  displayName: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  coverUrl?: string;
  bio?: string;
  location?: string;
  website?: string;
  phone?: string;
  collegeName?: string;
  college?: string;
  department?: string;
  year?: number;
  collegeMemberId?: string;
  contactInfo?: string;
  phoneNumber?: string;
  alternateEmail?: string;
  roles: string[];
  joinedAt: string;
  skills: string[];
  expertise: string[];
  linkedIn?: string;
  github?: string;
  twitter?: string;
  experience: Experience[];
  experiences?: Experience[];
  education: any[];
  badges: StudentBadgeAward[];
  projects: PersonalProject[];
  publications: Publication[];
  updatedAt?: string;
  isVerified?: boolean;
}

export interface Experience {
  id: string;
  profileId: string;
  area: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  yearsExp?: number;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExperiencePayload {
  area: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  yearsExp?: number;
  description?: string;
}

export interface PersonalProject {
  id: string;
  userId: string;
  title: string;
  description: string;
  github?: string;
  demoLink?: string;
  image?: string;
  technologies?: string[];
  createdAt: string;
}

export interface Publication {
  id: string;
  userId: string;
  title: string;
  link?: string;
  year: number;
  createdAt?: string;
}

export const profileApi = {
  // Profile CRUD - using correct profile service endpoints
  getProfile: async (userId: string): Promise<Profile> => {
    const response = await httpProfile.get(`/v1/profile/user/${userId}`);
    return response.data.profile;
  },

  getMyProfile: async (): Promise<Profile> => {
    const response = await httpProfile.get('/v1/profile/me');
    return response.data.profile;
  },

  updateProfile: async (data: Partial<Profile>): Promise<Profile> => {
    console.log('profileApi: Making PUT request to /v1/profile/me with data:', data);
    const response = await httpProfile.put('/v1/profile/me', data);
    console.log('profileApi: Raw response:', response);
    console.log('profileApi: Response data:', response.data);
    return response.data.profile;
  },

  // Personal Projects - using correct profile service endpoints
  getMyPersonalProjects: async (): Promise<PersonalProject[]> => {
    const response = await httpProfile.get('/v1/profile/me/projects');
    return response.data.projects;
  },

  getPersonalProjects: async (userId: string): Promise<PersonalProject[]> => {
    // For other users, get from their enhanced profile
    const profileResponse = await httpProfile.get(`/v1/profile/user/${userId}`);
    return profileResponse.data.profile?.projects || [];
  },

  createPersonalProject: async (data: Omit<PersonalProject, 'id' | 'userId' | 'createdAt'>): Promise<PersonalProject> => {
    const response = await httpProfile.post('/v1/profiles/me/projects', data);
    return response.data.project;
  },

  updatePersonalProject: async (id: string, data: Partial<PersonalProject>): Promise<PersonalProject> => {
    const response = await httpProfile.put(`/v1/profiles/me/projects/${id}`, data);
    return response.data.project;
  },

  deletePersonalProject: async (id: string): Promise<void> => {
    await httpProfile.delete(`/v1/profiles/me/projects/${id}`);
  },

  // Publications - using correct profile service endpoints
  getMyPublications: async (): Promise<Publication[]> => {
    const response = await httpProfile.get('/v1/profile/me/publications');
    return response.data.publications;
  },

  getPublications: async (userId: string): Promise<Publication[]> => {
    // For other users, get from their enhanced profile
    const profileResponse = await httpProfile.get(`/v1/profile/user/${userId}`);
    return profileResponse.data.profile?.publications || [];
  },

  createPublication: async (data: Omit<Publication, 'id' | 'userId' | 'createdAt'>): Promise<Publication> => {
    const response = await httpProfile.post('/v1/profiles/me/publications', data);
    return response.data.publication;
  },

  updatePublication: async (id: string, data: Partial<Publication>): Promise<Publication> => {
    const response = await httpProfile.put(`/v1/profiles/me/publications/${id}`, data);
    return response.data.publication;
  },

  deletePublication: async (id: string): Promise<void> => {
    await httpProfile.delete(`/v1/profiles/me/publications/${id}`);
  },

  // Badges - using correct backend endpoints
  getBadges: async (userId: string): Promise<StudentBadgeAward[]> => {
    const response = await httpProfile.get(`/v1/profile/badges/${userId}`);
    return response.data.badges;
  },

  // Experiences - using correct profile service endpoints
  getMyExperiences: async (): Promise<Experience[]> => {
    const response = await httpProfile.get('/v1/profile/me/experiences');
    return response.data.experiences;
  },

  getExperiences: async (userId: string): Promise<Experience[]> => {
    // For other users, get from their enhanced profile
    const profileResponse = await httpProfile.get(`/v1/profile/user/${userId}`);
    return profileResponse.data.profile?.experiences || [];
  },

  createExperience: async (data: Omit<Experience, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>): Promise<Experience> => {
    const response = await httpProfile.post('/v1/profile/experiences', data);
    return response.data.experience;
  },

  updateExperience: async (id: string, data: Partial<Experience>): Promise<Experience> => {
    const response = await httpProfile.put(`/v1/profile/experiences/${id}`, data);
    return response.data.experience;
  },

  deleteExperience: async (id: string): Promise<void> => {
    await httpProfile.delete(`/v1/profile/experiences/${id}`);
  },

  // Admin endpoints
  getAllProfiles: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    college?: string;
  }) => {
    const response = await httpProfile.get('/v1/profiles', { params });
    return response.data;
  },

  // Colleges - use auth service for this
  getColleges: async () => {
    const response = await httpProfile.get('/v1/colleges');
    return response.data;
  },

  // Skills CRUD operations
  getMySkills: async (): Promise<string[]> => {
    const response = await httpProfile.get('/v1/profile/me/skills');
    return response.data.skills;
  },

  updateMySkills: async (skills: string[]): Promise<string[]> => {
    const response = await httpProfile.put('/v1/profile/me/skills', { skills });
    return response.data.skills;
  },

  addSkill: async (skill: string): Promise<string[]> => {
    const response = await httpProfile.post('/v1/profile/me/skills', { skill });
    return response.data.skills;
  },

  removeSkill: async (skill: string): Promise<string[]> => {
    const response = await httpProfile.delete(`/v1/profile/me/skills/${encodeURIComponent(skill)}`);
    return response.data.skills;
  }
};
