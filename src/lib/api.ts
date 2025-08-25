"use client";

import { getSession, signIn } from "next-auth/react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4001";

function resolveUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  const prefix = path.startsWith("/") ? "" : "/";
  return `${API_BASE}${prefix}${path}`;
}

/**
 * Client-side fetch wrapper that:
 * - Adds Authorization: Bearer <accessToken> from NextAuth session
 * - Includes credentials for refresh cookie
 * - On 401, calls /v1/auth/refresh and updates NextAuth session, then retries once
 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const url = resolveUrl(path);
  const headers = new Headers(init.headers || {});

  // Attach token if present
  const session = await getSession();
  if ((session as any)?.accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${(session as any).accessToken}`);
  }

  const attempt = await fetch(url, { ...init, headers, credentials: "include" });
  if (attempt.status !== 401) return attempt;

  // Try refresh
  try {
    const refreshRes = await fetch(`${API_BASE}/v1/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    const refreshData = await refreshRes.json().catch(() => null);
    if (!refreshRes.ok || !refreshData?.accessToken || !refreshData?.user) {
      return attempt; // bubble 401 to caller
    }

    // Update NextAuth JWT session with new accessToken + user
    await signIn("credentials", {
      accessToken: refreshData.accessToken,
      user: JSON.stringify(refreshData.user),
      redirect: false,
    });

    const retryHeaders = new Headers(headers);
    retryHeaders.set("Authorization", `Bearer ${refreshData.accessToken}`);
    return fetch(url, { ...init, headers: retryHeaders, credentials: "include" });
  } catch {
    return attempt;
  }
}

export async function apiJson<T = any>(path: string, init?: RequestInit): Promise<{
  ok: boolean;
  status: number;
  data: T | null;
  response: Response;
}> {
  const res = await apiFetch(path, init);
  const data = (await res.json().catch(() => null)) as T | null;
  return { ok: res.ok, status: res.status, data, response: res };
}
