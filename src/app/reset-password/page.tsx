"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import http from "@/lib/http";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";

export const dynamic = 'force-dynamic';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen grid place-items-center text-sm text-slate-600">Loading...</div>}>
      <ResetPasswordInner />
    </Suspense>
  );
}

function ResetPasswordInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const token = useMemo(() => sp?.get("token") || "", [sp]);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!token) setError("Missing token in the URL.");
  }, [token]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setSuccess(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await http.post("/v1/auth/reset-password", { token, password });
      if (!data?.accessToken || !data?.user) throw new Error(data?.message || "Reset failed");
      await signIn("credentials", {
        accessToken: data.accessToken,
        user: JSON.stringify(data.user),
        redirect: false,
      });
      setSuccess("Password reset successful. Redirecting...");
      setTimeout(() => router.push("/"), 800);
    } catch (err) {
      setError((err as any)?.response?.data?.message || (err as Error)?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-lg px-4 py-12">
        <div className="rounded-2xl border bg-white dark:bg-slate-950 backdrop-blur shadow-sm p-6 md:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 text-white grid place-items-center shadow">
              <KeyRound className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Reset password</h1>
              <p className="text-sm text-slate-500">Choose a new password for your account.</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">New password</label>
              <div className="mt-1 relative">
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 px-3 text-slate-500 hover:text-slate-700"
                  onClick={() => setShow((s) => !s)}
                >
                  {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Confirm password</label>
              <input
                type={show ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Re-enter password"
                autoComplete="new-password"
                required
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>
            )}
            {success && (
              <div className="rounded-lg border border-green-200 bg-green-50 text-green-700 px-3 py-2 text-sm">{success}</div>
            )}

            <button
              disabled={loading || !token}
              className="group relative w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white px-4 py-2.5 font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            >
              {loading ? (<><Loader2 className="h-5 w-5 animate-spin" /> Updating...</>) : (<>Reset password</>)}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-600 dark:text-slate-300">
            Back to <a className="text-blue-600 hover:underline" href="/login">sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
}
