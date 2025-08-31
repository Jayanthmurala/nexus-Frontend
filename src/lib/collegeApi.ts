"use client";

import http from "./http";

// College interface matching auth-service response
export interface College {
  id: string;
  name: string;
  code: string;
  location?: string | null;
  website?: string | null;
  departments: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// List colleges response
export interface CollegesListResponse {
  colleges: College[];
  total: number;
}

// Create college payload (HEAD_ADMIN only)
export interface CreateCollegePayload {
  name: string;
  code: string;
  location?: string;
  website?: string;
  departments: string[];
  isActive?: boolean;
}

// Update college payload (HEAD_ADMIN only)
export interface UpdateCollegePayload {
  name?: string;
  code?: string;
  location?: string;
  website?: string;
  departments?: string[];
  isActive?: boolean;
}

// Get all colleges (public endpoint)
export async function getColleges(params?: {
  active?: boolean;
  limit?: number;
  offset?: number;
}): Promise<CollegesListResponse> {
  const queryParams = new URLSearchParams();
  if (params?.active !== undefined) queryParams.set('active', params.active.toString());
  if (params?.limit) queryParams.set('limit', params.limit.toString());
  if (params?.offset) queryParams.set('offset', params.offset.toString());
  
  const url = `/v1/colleges${queryParams.toString() ? `?${queryParams}` : ''}`;
  const { data } = await http.get<CollegesListResponse>(url);
  return data;
}

// Get college by ID (public endpoint)
export async function getCollegeById(id: string): Promise<College> {
  const { data } = await http.get<College>(`/v1/colleges/${id}`);
  return data;
}

// Get college departments (public endpoint)
export async function getCollegeDepartments(id: string): Promise<{ departments: string[] }> {
  const { data } = await http.get<{ departments: string[] }>(`/v1/colleges/${id}/departments`);
  return data;
}

// Create college (HEAD_ADMIN only)
export async function createCollege(payload: CreateCollegePayload): Promise<College> {
  const { data } = await http.post<College>("/v1/colleges", payload);
  return data;
}

// Update college (HEAD_ADMIN only)
export async function updateCollege(id: string, payload: UpdateCollegePayload): Promise<College> {
  const { data } = await http.put<College>(`/v1/colleges/${id}`, payload);
  return data;
}

// Delete college (HEAD_ADMIN only)
export async function deleteCollege(id: string): Promise<void> {
  await http.delete(`/v1/colleges/${id}`);
}
