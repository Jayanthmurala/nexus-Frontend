"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Github, Loader2, ShieldCheck } from "lucide-react";
import http from "@/lib/http";


export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await http.post(`/v1/auth/login`, { email, password });
      if (!data?.accessToken) throw new Error(data?.message || "Login failed");
      const result = await signIn("credentials", {
        accessToken: data.accessToken,
        user: JSON.stringify(data.user),
        redirect: false,
      });
      if (result?.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
      router.push("/");
    } catch (err) {
      setError((err as any)?.response?.data?.message || (err as Error)?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-16">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Brand/Left panel */}
          <div className="hidden md:block">
            <div className="relative overflow-hidden rounded-2xl border bg-white/60 dark:bg-slate-900/60 backdrop-blur shadow-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-purple-500/10" />
              <div className="relative p-8">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-600 text-white grid place-items-center shadow">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Welcome to Nexus</h2>
                    <p className="text-sm text-slate-500">Secure, seamless access to your campus network.</p>
                  </div>
                </div>
                <ul className="mt-8 space-y-4 text-slate-600 dark:text-slate-300">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                    <span>Single sign-on with Google or GitHub</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-cyan-500" />
                    <span>JWT-based API access with auto-refresh</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-purple-500" />
                    <span>Privacy-first. Your data stays protected</span>
                  </li>
                </ul>
                <div className="mt-10 h-40 md:h-52 rounded-xl bg-gradient-to-br from-blue-500 via-cyan-500 to-purple-500 opacity-20" />
              </div>
            </div>
          </div>

          {/* Auth Card */}
          <div className="md:ml-auto">
            <div className="mx-auto max-w-md">
              <div className="rounded-2xl border bg-white dark:bg-slate-950 backdrop-blur shadow-sm p-6 md:p-8">
                <div className="mb-6">
                  <h1 className="text-2xl font-semibold">Sign in</h1>
                  <p className="text-sm text-slate-500">Welcome back. Please enter your details.</p>
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
                  <div>
                    <div className="flex items-center justify-between">
                      <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                      <a href="/forgot-password" className="text-xs text-blue-600 hover:underline">Forgot password?</a>
                    </div>
                    <div className="mt-1 relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Your password"
                        autoComplete="current-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute inset-y-0 right-0 pr-3 grid place-items-center text-slate-500 hover:text-slate-700"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    disabled={loading}
                    className="group relative w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white px-4 py-2.5 font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <span>Sign in</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="my-6 flex items-center">
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                  <span className="px-3 text-xs uppercase tracking-wide text-slate-500">or</span>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                </div>

                <div className="grid gap-3">
                  <button
                    onClick={() => signIn("google", { callbackUrl: "/oauth/bridge?redirect=/" })}
                    className="w-full inline-flex items-center justify-center gap-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-900"
                  >
                    <GoogleIcon />
                    <span>Continue with Google</span>
                  </button>
                  <button
                    onClick={() => signIn("github", { callbackUrl: "/oauth/bridge?redirect=/" })}
                    className="w-full inline-flex items-center justify-center gap-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-900"
                  >
                    <Github className="h-5 w-5" />
                    <span>Continue with GitHub</span>
                  </button>
                </div>

                <p className="mt-6 text-sm text-slate-600 dark:text-slate-300">
                  Don&apos;t have an account? {" "}
                  <a className="text-blue-600 hover:underline" href="/register">Register</a>
                </p>
              </div>
              <p className="mt-4 text-center text-xs text-slate-500">
                Protected by industry standards. Sessions are secured with rotating refresh tokens.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-1.7 3.6-5.5 3.6-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3 14.6 2 12 2 6.5 2 2 6.5 2 12s4.5 10 10 10c5.8 0 9.6-4.1 9.6-9.9 0-.7-.1-1.2-.2-1.7H12z" />
      <path fill="#34A853" d="M3.9 7.6l3.2 2.4C8 7.9 9.9 6.6 12 6.6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3 14.6 2 12 2 8 2 4.6 4.1 3 7.1l.9.5z" />
      <path fill="#FBBC05" d="M12 22c2.6 0 4.8-.9 6.4-2.4l-3-2.5c-.8.5-1.8.8-3.4.8-2.9 0-5.4-1.9-6.2-4.5l-3.1 2.4C4.5 19.9 7.9 22 12 22z" />
      <path fill="#4285F4" d="M21.6 12.1c0-.7-.1-1.2-.2-1.7H12v3.9h5.5c-.3 1.7-1.9 3-5.5 3-2.7 0-5-1.8-5.8-4.2l-3.1 2.4C4.5 19.9 7.9 22 12 22c5.8 0 9.6-4.1 9.6-9.9z" />
    </svg>
  );
}
