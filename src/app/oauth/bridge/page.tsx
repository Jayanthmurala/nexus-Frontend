"use client";

import { Suspense, useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import http from "@/lib/http";

// Using axios client with baseURL
export const dynamic = 'force-dynamic';

export default function OAuthBridgePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md p-6 text-center text-sm text-gray-600">Finalizing sign-in...</div>}>
      <OAuthBridgeInner />
    </Suspense>
  );
}

function OAuthBridgeInner() {
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/";

  useEffect(() => {
    if (status === "loading") return;

    // If already have backend access token, proceed
    if (status === "authenticated" && (session as any)?.accessToken) {
      router.replace(redirect);
      return;
    }

    // If OAuth just completed, exchange provider tokens for backend tokens
    (async () => {
      if (status !== "authenticated") {
        router.replace("/login");
        return;
      }
      const oauth = (session as any)?.oauth as { provider: "google" | "github"; accessToken?: string } | undefined;
      if (!oauth?.provider || !oauth?.accessToken) {
        // Nothing to exchange
        router.replace("/login");
        return;
      }
      try {
        const { data } = await http.post(`/v1/auth/oauth/exchange`, { provider: oauth.provider, accessToken: oauth.accessToken });
        if (!data?.accessToken || !data?.user) {
          setError(data?.message || "OAuth exchange failed");
          return;
        }
        // Update NextAuth session with backend token via Credentials provider
        const result = await signIn("credentials", {
          accessToken: data.accessToken,
          user: JSON.stringify(data.user),
          redirect: false,
        });
        if (result?.error) {
          setError(result.error);
          return;
        }
        router.replace(redirect);
      } catch (e) {
        setError((e as any)?.response?.data?.message || (e as Error)?.message || "Unexpected error during OAuth exchange");
      }
    })();
  }, [status, session, router, redirect]);

  return (
    <div className="mx-auto max-w-md p-6 text-center">
      <h1 className="text-xl font-semibold mb-3">Finalizing sign-in...</h1>
      <p className="text-sm text-gray-600 mb-4">Please wait while we secure your session.</p>
      {error && (
        <div className="text-left border rounded p-3 bg-red-50 border-red-200 text-red-700">
          <p className="font-medium mb-2">OAuth exchange error</p>
          <p className="text-sm mb-3">{error}</p>
          <a href="/login" className="text-blue-600 underline">Back to login</a>
        </div>
      )}
    </div>
  );
}
