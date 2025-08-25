"use client";

import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { getSession, signOut } from "next-auth/react";
import { getLatestAccessToken, refreshToken } from "./authRefresh";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4001";

const http = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// Attach Authorization header from NextAuth session if available
http.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  try {
    // Prefer the most recent in-memory token first
    const memToken = getLatestAccessToken();
    if (memToken && !(config.headers as any)?.Authorization) {
      config.headers = config.headers || {};
      (config.headers as any).Authorization = `Bearer ${memToken}`;
      return config;
    }

    const session = await getSession();
    const accessToken = (session as any)?.accessToken as string | undefined;
    if (accessToken && !(config.headers as any)?.Authorization) {
      config.headers = config.headers || {};
      (config.headers as any).Authorization = `Bearer ${accessToken}`;
    }
  } catch {}
  return config;
});

// Handle 401 by attempting refresh, updating NextAuth session, and retrying once
http.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (error: AxiosError) => {
    const original = error.config as any;
    if (error?.response?.status === 401 && !original?._retry) {
      original._retry = true;
      const refreshed = await refreshToken(API_BASE);
      if (refreshed && refreshed.accessToken) {
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${refreshed.accessToken}`;
        return http(original);
      }
      // Refresh failed: sign out to break potential loops
      try { await signOut({ redirect: false }); } catch {}
    }
    return Promise.reject(error);
  }
);

export default http;

