"use client";

import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { getSession, signOut } from "next-auth/react";
import { getLatestAccessToken, refreshToken } from "./authRefresh";

const NETWORK_API_BASE = process.env.NEXT_PUBLIC_NETWORK_API_BASE_URL || "http://localhost:4005";
const MESSAGING_API_BASE = process.env.NEXT_PUBLIC_MESSAGING_API_BASE_URL || "http://localhost:4006";
const AUTH_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4001";

console.log('Environment check:', {
  NETWORK_API_BASE,
  allEnvVars: Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_'))
});

if (!NETWORK_API_BASE) {
  console.error('Available NEXT_PUBLIC_ environment variables:', 
    Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_'))
  );
  throw new Error('NEXT_PUBLIC_NETWORK_API_BASE_URL environment variable is required');
}

const httpNetwork = axios.create({
  baseURL: NETWORK_API_BASE,
  withCredentials: true,
});

// Attach Authorization header from NextAuth session if available
httpNetwork.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  try {
    // Prefer the most recent in-memory token first
    const memToken = getLatestAccessToken();
    if (memToken && !(config.headers as any)?.Authorization) {
      config.headers = config.headers || {};
      (config.headers as any).Authorization = `Bearer ${memToken}`;
      console.log('httpNetwork: Using in-memory token for request to:', config.url);
      return config;
    }

    const session = await getSession();
    const accessToken = (session as any)?.accessToken as string | undefined;
    if (accessToken && !(config.headers as any)?.Authorization) {
      config.headers = config.headers || {};
      (config.headers as any).Authorization = `Bearer ${accessToken}`;
      console.log('httpNetwork: Using session token for request to:', config.url);
    } else if (!accessToken) {
      console.warn('httpNetwork: No access token available for request to:', config.url);
    }
  } catch (error) {
    console.error('httpNetwork: Error setting auth header:', error);
  }
  return config;
});

// Handle 401 by attempting refresh, updating NextAuth session, and retrying once
httpNetwork.interceptors.response.use(
  (res: AxiosResponse) => {
    console.log('httpNetwork: Successful response from:', res.config.url, 'Status:', res.status);
    return res;
  },
  async (error: AxiosError) => {
    console.error('httpNetwork: Request failed:', error.config?.url, 'Status:', error.response?.status, 'Error:', error.message);
    const original = error.config as any;
    if (error?.response?.status === 401 && !original?._retry) {
      console.log('httpNetwork: Attempting token refresh for 401 error');
      original._retry = true;
      const refreshed = await refreshToken(AUTH_API_BASE);
      if (refreshed && refreshed.accessToken) {
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${refreshed.accessToken}`;
        console.log('httpNetwork: Retrying request with refreshed token');
        return httpNetwork(original);
      }
      // Refresh failed: sign out to break potential loops
      console.warn('httpNetwork: Token refresh failed, signing out');
      try { await signOut({ redirect: false }); } catch {}
    }
    return Promise.reject(error);
  }
);

// Create separate messaging API client
const httpMessaging = axios.create({
  baseURL: MESSAGING_API_BASE,
  withCredentials: true,
});

// Apply same interceptors to messaging client
httpMessaging.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  try {
    const memToken = getLatestAccessToken();
    if (memToken && !(config.headers as any)?.Authorization) {
      config.headers = config.headers || {};
      (config.headers as any).Authorization = `Bearer ${memToken}`;
      console.log('httpMessaging: Using in-memory token for request to:', config.url);
      return config;
    }

    const session = await getSession();
    const accessToken = (session as any)?.accessToken as string | undefined;
    if (accessToken && !(config.headers as any)?.Authorization) {
      config.headers = config.headers || {};
      (config.headers as any).Authorization = `Bearer ${accessToken}`;
      console.log('httpMessaging: Using session token for request to:', config.url);
    } else if (!accessToken) {
      console.warn('httpMessaging: No access token available for request to:', config.url);
    }
  } catch (error) {
    console.error('httpMessaging: Error setting auth header:', error);
  }
  return config;
});

httpMessaging.interceptors.response.use(
  (res: AxiosResponse) => {
    console.log('httpMessaging: Successful response from:', res.config.url, 'Status:', res.status);
    return res;
  },
  async (error: AxiosError) => {
    console.error('httpMessaging: Request failed:', error.config?.url, 'Status:', error.response?.status, 'Error:', error.message);
    const original = error.config as any;
    if (error?.response?.status === 401 && !original?._retry) {
      console.log('httpMessaging: Attempting token refresh for 401 error');
      original._retry = true;
      const refreshed = await refreshToken(AUTH_API_BASE);
      if (refreshed && refreshed.accessToken) {
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${refreshed.accessToken}`;
        console.log('httpMessaging: Retrying request with refreshed token');
        return httpMessaging(original);
      }
      console.warn('httpMessaging: Token refresh failed, signing out');
      try { await signOut({ redirect: false }); } catch {}
    }
    return Promise.reject(error);
  }
);

export { httpMessaging };
export default httpNetwork;
