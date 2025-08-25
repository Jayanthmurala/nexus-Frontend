"use client";

import axios from "axios";
import { signIn } from "next-auth/react";

// Shared singletons across all axios clients
let inFlightRefresh: Promise<{ accessToken: string; user: any } | null> | null = null;
let latestAccessToken: string | null = null;

export function getLatestAccessToken(): string | null {
  return latestAccessToken;
}

export async function refreshToken(authBase?: string): Promise<{ accessToken: string; user: any } | null> {
  if (!inFlightRefresh) {
    inFlightRefresh = (async () => {
      try {
        const base = authBase || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4001";
        const refresh = await axios.post(
          `${base}/v1/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const { accessToken, user } = (refresh.data as any) || {};
        if (!accessToken || !user) throw new Error("refresh failed");
        latestAccessToken = accessToken;
        await signIn("credentials", {
          accessToken,
          user: JSON.stringify(user),
          redirect: false,
        });
        try { console.debug("[authRefresh] token refreshed"); } catch {}
        return { accessToken, user };
      } catch (e) {
        try { console.error("[authRefresh] refresh failed", e); } catch {}
        return null;
      } finally {
        const p = inFlightRefresh;
        setTimeout(() => {
          if (inFlightRefresh === p) inFlightRefresh = null;
        }, 0);
      }
    })();
  }
  return inFlightRefresh;
}
