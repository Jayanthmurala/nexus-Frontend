"use client";

import { useState } from "react";
import http from "@/lib/http";
import { Loader2, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [debugUrl, setDebugUrl] = useState<string | undefined>(undefined);
  const [debugPreviewUrl, setDebugPreviewUrl] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setDebugUrl(undefined);
    setDebugPreviewUrl(undefined);
    setLoading(true);
    try {
      const { data } = await http.post("/v1/auth/forgot-password", { email });
      setMessage(data?.message || "If the email is registered, a reset link has been sent.");
      setDebugUrl(data?.debugUrl);
      setDebugPreviewUrl(data?.debugPreviewUrl);
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
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Forgot password</h1>
              <p className="text-sm text-slate-500">Enter your account email to receive a reset link.</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>
            )}
            {message && (
              <div className="rounded-lg border border-green-200 bg-green-50 text-green-700 px-3 py-2 text-sm">{message}</div>
            )}

            <button
              disabled={loading}
              className="group relative w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white px-4 py-2.5 font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            >
              {loading ? (<><Loader2 className="h-5 w-5 animate-spin" /> Sending...</>) : (<>Send reset link</>)}
            </button>
          </form>

          {debugUrl && (
            <p className="mt-4 text-xs text-slate-500">
              Dev only: <a href={debugUrl} className="text-blue-600 hover:underline">Open reset link</a>
            </p>
          )}

          {debugPreviewUrl && (
            <p className="mt-2 text-xs text-slate-500">
              Dev only: <a href={debugPreviewUrl} className="text-blue-600 hover:underline" target="_blank" rel="noreferrer">Open email preview</a>
            </p>
          )}

          <p className="mt-6 text-sm text-slate-600 dark:text-slate-300">
            Remembered it? <a className="text-blue-600 hover:underline" href="/login">Back to sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
}
