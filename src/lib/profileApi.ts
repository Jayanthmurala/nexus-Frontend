"use client";

import httpProfile from "./httpProfile";

// Profile types
export interface Profile {
  id: string;
  userId: string;
  collegeId: string;
  department: string;
  year?: number;
  skills?: string[];
  expertise?: string[];
  linkedIn?: string;
  github?: string;
  twitter?: string;
  resumeUrl?: string;
  bio?: string;
  avatar?: string;
  contactInfo?: string;
  collegeMemberId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProfilePayload {
  collegeId: string;
  department: string;
  year?: number;
  skills?: string[];
  expertise?: string[];
  linkedIn?: string;
  github?: string;
  twitter?: string;
  resumeUrl?: string;
  bio?: string;
  avatar?: string;
  contactInfo?: string;
  collegeMemberId?: string;
}

// Colleges
export interface College {
  id: string;
  name: string;
  createdAt?: string;
}

export async function getColleges(): Promise<College[]> {
  const { data } = await httpProfile.get<{ colleges: College[] }>("/v1/colleges");
  return data.colleges || [];
}

export async function getMyProfile(): Promise<Profile | null> {
  const { data } = await httpProfile.get<{ profile: Profile | null }>("/v1/profile/me");
  return data.profile ?? null;
}

export async function upsertMyProfile(payload: ProfilePayload): Promise<Profile> {
  const { data } = await httpProfile.put<{ profile: Profile }>("/v1/profile/me", payload);
  return data.profile;
}

export async function getProfileByUserId(userId: string): Promise<Profile | null> {
  const { data } = await httpProfile.get<{ profile: Profile | null }>(`/v1/profile/${userId}`);
  return data.profile ?? null;
}

// Personal projects types
export interface PersonalProject {
  id: string;
  userId: string;
  title: string;
  description: string;
  github?: string;
  demoLink?: string;
  image?: string;
  createdAt: string;
  updatedAt?: string;
  // optional tech to keep UI compatibility; backend does not persist this
  tech?: string[];
}

export interface CreateProjectPayload {
  title: string;
  description: string;
  github?: string;
  demoLink?: string;
  image?: string;
}

export interface UpdateProjectPayload {
  title?: string;
  description?: string;
  github?: string;
  demoLink?: string;
  image?: string;
}

export async function getMyProjects(): Promise<PersonalProject[]> {
  const { data } = await httpProfile.get<{ projects: PersonalProject[] }>("/v1/profile/me/projects");
  return data.projects || [];
}

export async function createProject(payload: CreateProjectPayload): Promise<PersonalProject> {
  const { data } = await httpProfile.post<{ project: PersonalProject }>("/v1/profile/me/projects", payload);
  return data.project;
}

export async function updateProject(id: string, changes: UpdateProjectPayload): Promise<PersonalProject> {
  const { data } = await httpProfile.put<{ project: PersonalProject }>(`/v1/profile/me/projects/${id}`, changes);
  return data.project;
}

export async function deleteProject(id: string): Promise<string> {
  await httpProfile.delete(`/v1/profile/me/projects/${id}`);
  return id;
}

// Publications types (FACULTY only)
export interface PublicationRecord {
  id: string;
  userId: string;
  title: string;
  year: number;
  link?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePublicationPayload {
  title: string;
  year: number;
  link?: string;
}

export interface UpdatePublicationPayload {
  title?: string;
  year?: number;
  link?: string;
}

export async function getMyPublications(): Promise<PublicationRecord[]> {
  const { data } = await httpProfile.get<{ publications: PublicationRecord[] }>(
    "/v1/profile/me/publications"
  );
  return data.publications || [];
}

export async function createPublication(
  payload: CreatePublicationPayload
): Promise<PublicationRecord> {
  const { data } = await httpProfile.post<{ publication: PublicationRecord }>(
    "/v1/profile/me/publications",
    payload
  );
  return data.publication;
}

export async function updatePublication(
  id: string,
  changes: UpdatePublicationPayload
): Promise<PublicationRecord> {
  const { data } = await httpProfile.put<{ publication: PublicationRecord }>(
    `/v1/profile/me/publications/${id}`,
    changes
  );
  return data.publication;
}

export async function deletePublication(id: string): Promise<string> {
  await httpProfile.delete(`/v1/profile/me/publications/${id}`);
  return id;
}

// Badges
export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon?: string;
  color?: string;
  category?: string;
  rarity: BadgeRarity;
  criteria?: string;
  createdAt?: string;
  createdBy?: string;
}

export interface CreateBadgeDefinitionPayload {
  name: string;
  description: string;
  icon?: string;
  color?: string;
  category?: string;
  rarity: BadgeRarity;
  criteria?: string;
}

export interface UpdateBadgeDefinitionPayload extends Partial<CreateBadgeDefinitionPayload> {}

export interface StudentBadgeAward {
  id: string;
  studentId: string;
  badgeId: string;
  awardedBy: string;
  awardedByName?: string | null;
  reason: string;
  awardedAt: string;
  projectId?: string;
  eventId?: string;
}

export interface AwardBadgePayload {
  studentId: string;
  badgeId: string;
  reason: string;
  projectId?: string;
  eventId?: string;
}

export async function getBadgeDefinitions(): Promise<BadgeDefinition[]> {
  const { data } = await httpProfile.get<{ definitions: BadgeDefinition[] }>(`/v1/badges/definitions`);
  return data.definitions || [];
}

export async function createBadgeDefinition(payload: CreateBadgeDefinitionPayload): Promise<BadgeDefinition> {
  const { data } = await httpProfile.post<{ definition: BadgeDefinition }>(`/v1/badges/definitions`, payload);
  return data.definition;
}

export async function updateBadgeDefinition(id: string, changes: UpdateBadgeDefinitionPayload): Promise<BadgeDefinition> {
  const { data } = await httpProfile.put<{ definition: BadgeDefinition }>(`/v1/badges/definitions/${id}`, changes);
  return data.definition;
}

export async function deleteBadgeDefinition(id: string): Promise<string> {
  await httpProfile.delete(`/v1/badges/definitions/${id}`);
  return id;
}

export async function awardBadge(payload: AwardBadgePayload): Promise<StudentBadgeAward> {
  const { data } = await httpProfile.post<{ award: StudentBadgeAward }>(`/v1/badges/awards`, payload);
  return data.award;
}

export async function getAwards(studentId?: string): Promise<StudentBadgeAward[]> {
  const { data } = await httpProfile.get<{ awards: StudentBadgeAward[] }>(`/v1/badges/awards`, {
    params: studentId ? { studentId } : undefined,
  });
  return data.awards || [];
}

export async function getRecentAwards(limit?: number): Promise<StudentBadgeAward[]> {
  const { data } = await httpProfile.get<{ awards: StudentBadgeAward[] }>(`/v1/badges/awards/recent`, {
    params: typeof limit === 'number' ? { limit } : undefined,
  });
  return data.awards || [];
}

export async function getAwardCounts(): Promise<Record<string, number>> {
  const { data } = await httpProfile.get<{ counts: Record<string, number> }>(`/v1/badges/stats/award-counts`);
  return data.counts || {};
}
