"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import http from "@/lib/http";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { signIn } from "next-auth/react";

export const dynamic = 'force-dynamic';

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen grid place-items-center text-sm text-slate-600">Loading...</div>}>
      <VerifyEmailInner />
    </Suspense>
  );
}

function VerifyEmailInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const token = useMemo(() => sp?.get("token") || "", [sp]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setError("Missing token in the URL.");
        setLoading(false);
        return;
      }
      try {
        const { data } = await http.post("/v1/auth/verify-email", { token });
        if (!data?.accessToken || !data?.user) throw new Error(data?.message || "Verification failed");
        setMessage("Email verified successfully. Redirecting...");
        await signIn("credentials", {
          accessToken: data.accessToken,
          user: JSON.stringify(data.user),
          redirect: false,
        });
        setTimeout(() => router.push("/"), 800);
      } catch (err) {
        setError((err as any)?.response?.data?.message || (err as Error)?.message || "Verification failed");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [token, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-lg px-4 py-12">
        <div className="rounded-2xl border bg-white dark:bg-slate-950 backdrop-blur shadow-sm p-6 md:p-8 text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-blue-600 text-white grid place-items-center shadow">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold">Verifying your email</h1>
          {loading && (
            <p className="mt-2 text-slate-500 inline-flex items-center gap-2 justify-center"><Loader2 className="h-4 w-4 animate-spin" /> Please wait...</p>
          )}
          {message && (
            <p className="mt-3 text-green-600 inline-flex items-center gap-2 justify-center"><CheckCircle2 className="h-5 w-5" /> {message}</p>
          )}
          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>
          )}
          {!loading && (
            <p className="mt-6 text-sm text-slate-600">Return to <a className="text-blue-600 hover:underline" href="/login">sign in</a> or <a className="text-blue-600 hover:underline" href="/resend-verification">resend verification</a>.</p>
          )}
        </div>
      </div>
    </div>
  );
}
