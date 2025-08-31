"use client";

import http from "./http";
import httpEvents from "./httpEvents";

// Registration payload for new auth-service
export interface RegisterPayload {
  displayName: string;
  email: string;
  password: string;
  role: "STUDENT" | "FACULTY" | "DEPT_ADMIN" | "PLACEMENTS_ADMIN" | "HEAD_ADMIN";
  collegeId: string;
  department: string;
  collegeMemberId?: string;
  year?: number; // Required for STUDENT role
}

// Auth response from backend
export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    roles: string[];
    avatarUrl?: string | null;
  };
}

// Register new user with college validation
export async function registerUser(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await http.post<AuthResponse>("/v1/auth/register", payload);
  return data;
}

// Login user
export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const { data } = await http.post<AuthResponse>("/v1/auth/login", { email, password });
  return data;
}

// Refresh access token
export async function refreshAccessToken(): Promise<{ accessToken: string }> {
  const { data } = await http.post<{ accessToken: string }>("/v1/auth/refresh");
  return data;
}

// Logout user
export async function logoutUser(): Promise<{ message: string }> {
  const { data } = await http.post<{ message: string }>("/v1/auth/logout");
  return data;
}

// Forgot password
export async function forgotPassword(email: string): Promise<{ message: string }> {
  const { data } = await http.post<{ message: string }>("/v1/auth/forgot-password", { email });
  return data;
}

// Reset password
export async function resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  const { data } = await http.post<{ message: string }>("/v1/auth/reset-password", { 
    token, 
    newPassword 
  });
  return data;
}

// Verify email
export async function verifyEmail(token: string): Promise<{ message: string }> {
  const { data } = await http.post<{ message: string }>("/v1/auth/verify-email", { token });
  return data;
}

// Resend verification email
export async function resendVerification(email: string): Promise<{ message: string }> {
  const { data } = await http.post<{ message: string }>("/v1/auth/resend-verification", { email });
  return data;
}

// Get current user
export async function getCurrentUser(): Promise<AuthResponse['user']> {
  const { data } = await http.get<{ user: AuthResponse['user'] }>("/v1/auth/me");
  return data.user;
}

// OAuth exchange
export async function exchangeOAuthToken(
  provider: "google" | "github", 
  accessToken: string
): Promise<AuthResponse> {
  const { data } = await http.post<AuthResponse>("/v1/auth/oauth/exchange", { 
    provider, 
    accessToken 
  });
  return data;
}

// Get college departments
export async function getCollegeDepartments(collegeId: string): Promise<string[]> {
  console.log('Making API call to:', `/v1/colleges/${collegeId}/departments`);
  console.log('Using httpEvents base URL:', httpEvents.defaults.baseURL);
  try {
    const response = await httpEvents.get<{ departments: string[] }>(`/v1/colleges/${collegeId}/departments`);
    console.log('API response:', response);
    return response.data.departments;
  } catch (error) {
    console.error('API call failed:', error);
    console.error('Error details:', {
      message: (error as any)?.message,
      status: (error as any)?.response?.status,
      data: (error as any)?.response?.data,
      url: (error as any)?.config?.url
    });
    throw error;
  }
}
