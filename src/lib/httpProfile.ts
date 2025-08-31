"use client";

import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { getSession, signOut } from "next-auth/react";
import { getLatestAccessToken, refreshToken } from "./authRefresh";

const PROFILE_API_BASE = process.env.NEXT_PUBLIC_PROFILE_API_BASE_URL || "http://localhost:4002";
const AUTH_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4001";

const httpProfile = axios.create({
  baseURL: PROFILE_API_BASE,
  withCredentials: true,
});

// Attach Authorization header from NextAuth session if available
httpProfile.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  try {
    // Prefer the most recent in-memory token first
    const memToken = getLatestAccessToken();
    if (memToken && !(config.headers as any)?.Authorization) {
      config.headers = config.headers || {};
      (config.headers as any).Authorization = `Bearer ${memToken}`;
      console.log('httpProfile: Using in-memory token for request to:', config.url);
      return config;
    }

    const session = await getSession();
    const accessToken = (session as any)?.accessToken as string | undefined;
    if (accessToken && !(config.headers as any)?.Authorization) {
      config.headers = config.headers || {};
      (config.headers as any).Authorization = `Bearer ${accessToken}`;
      console.log('httpProfile: Using session token for request to:', config.url);
    } else if (!accessToken) {
      console.warn('httpProfile: No access token available for request to:', config.url);
    }
  } catch (error) {
    console.error('httpProfile: Error setting auth header:', error);
  }
  return config;
});

// Handle 401 by attempting refresh, updating NextAuth session, and retrying once
httpProfile.interceptors.response.use(
  (res: AxiosResponse) => {
    console.log('httpProfile: Successful response from:', res.config.url, 'Status:', res.status);
    return res;
  },
  async (error: AxiosError) => {
    console.error('httpProfile: Request failed:', error.config?.url, 'Status:', error.response?.status, 'Error:', error.message);
    const original = error.config as any;
    if (error?.response?.status === 401 && !original?._retry) {
      console.log('httpProfile: Attempting token refresh for 401 error');
      original._retry = true;
      const refreshed = await refreshToken(AUTH_API_BASE);
      if (refreshed && refreshed.accessToken) {
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${refreshed.accessToken}`;
        console.log('httpProfile: Retrying request with refreshed token');
        return httpProfile(original);
      }
      // Refresh failed: sign out to break potential loops
      console.warn('httpProfile: Token refresh failed, signing out');
      try { await signOut({ redirect: false }); } catch {}
    }
    return Promise.reject(error);
  }
);

export default httpProfile;
