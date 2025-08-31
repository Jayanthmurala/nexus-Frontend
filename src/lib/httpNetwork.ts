"use client";

import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { getSession, signOut } from "next-auth/react";
import { getLatestAccessToken, refreshToken } from "./authRefresh";

const NETWORK_API_BASE = process.env.NEXT_PUBLIC_NETWORK_API_BASE_URL || "http://localhost:4005";
const AUTH_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4001";

const httpNetwork = axios.create({
  baseURL: NETWORK_API_BASE,
  withCredentials: true,
});

// Attach Authorization header from NextAuth session or in-memory refreshed token
httpNetwork.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  try {
    const memToken = getLatestAccessToken();
    if (memToken && !(config.headers as any)?.Authorization) {
      config.headers = config.headers || {};
      (config.headers as any).Authorization = `Bearer ${memToken}`;
      try { if (process.env.NODE_ENV !== 'production') console.debug('[httpNetwork] Authorization attached (memToken)'); } catch {}
      return config;
    }

    const session = await getSession();
    const accessToken = (session as any)?.accessToken as string | undefined;
    if (accessToken && !(config.headers as any)?.Authorization) {
      config.headers = config.headers || {};
      (config.headers as any).Authorization = `Bearer ${accessToken}`;
      try { if (process.env.NODE_ENV !== 'production') console.debug('[httpNetwork] Authorization attached (session)'); } catch {}
    }
  } catch {}
  try { if (process.env.NODE_ENV !== 'production') console.debug('[httpNetwork] Proceeding request', { hasAuth: !!(config.headers as any)?.Authorization, url: config.url }); } catch {}
  return config;
});

// Handle 401 (and 500 with expired JWT) by attempting refresh against auth-service and retrying once
httpNetwork.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (error: AxiosError) => {
    const original = error.config as any;
    const status = error?.response?.status;
    const data: any = (error?.response as any)?.data || {};
    const isExpired = data?.code === 'ERR_JWT_EXPIRED' || /exp\s*.*claim.*failed/i.test(String(data?.message || ''));
    const shouldRefresh = (status === 401) || (status === 500 && isExpired);
    if (shouldRefresh && !original?._retry) {
      original._retry = true;
      try { if (process.env.NODE_ENV !== 'production') console.warn('[httpNetwork] auth error received, attempting token refresh', { status, code: data?.code }); } catch {}
      const refreshed = await refreshToken(AUTH_API_BASE);
      if (refreshed && refreshed.accessToken) {
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${refreshed.accessToken}`;
        try { if (process.env.NODE_ENV !== 'production') console.debug('[httpNetwork] Retrying request after refresh', { url: original.url }); } catch {}
        return httpNetwork(original);
      }
      try { await signOut({ redirect: false }); } catch {}
    }
    return Promise.reject(error);
  }
);

export default httpNetwork;
