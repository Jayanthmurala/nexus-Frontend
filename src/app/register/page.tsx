"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchColleges, selectColleges, selectCollegesLoading } from "@/store/slices/collegesSlice";

// Using axios client with baseURL

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [collegeId, setCollegeId] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState<string>("");
  const [collegeMemberId, setCollegeMemberId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const colleges = useAppSelector(selectColleges);
  const collegesLoading = useAppSelector(selectCollegesLoading);
  const { register } = useAuth();

  useEffect(() => {
    // fetch colleges on first render
    dispatch(fetchColleges());
  }, [dispatch]);

  useEffect(() => {
    // set default college if not chosen
    if (!collegeId && colleges.length > 0) {
      setCollegeId(colleges[0].id);
    }
  }, [colleges, collegeId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!collegeId || !department.trim()) {
      setError("Please select a college and enter your department");
      return;
    }
    setSubmitting(true);
    try {
      const ok = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        collegeId,
        department: department.trim(),
        year: year ? Number(year) : undefined,
        collegeMemberId: collegeMemberId.trim() || undefined,
      });
      if (!ok) {
        setError("Registration failed");
        setSubmitting(false);
        return;
      }
      router.push("/");
    } catch (err) {
      setError((err as any)?.response?.data?.message || (err as Error)?.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-4">Create your account</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border p-2 rounded"
          placeholder="Full name"
          required
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border p-2 rounded"
          placeholder="Email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border p-2 rounded"
          placeholder="Password (min 8 chars)"
          required
          minLength={8}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">College</label>
          <select
            value={collegeId}
            onChange={(e) => setCollegeId(e.target.value)}
            className="w-full border p-2 rounded"
            disabled={collegesLoading}
            required
          >
            {collegesLoading && <option>Loading colleges...</option>}
            {!collegesLoading && colleges.length === 0 && <option value="">No colleges available</option>}
            {!collegesLoading && colleges.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <input
          type="text"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="w-full border p-2 rounded"
          placeholder="Department (e.g., CSE)"
          required
        />

        <input
          type="number"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="w-full border p-2 rounded"
          placeholder="Year (optional)"
          min={1}
        />

        <input
          type="text"
          value={collegeMemberId}
          onChange={(e) => setCollegeMemberId(e.target.value)}
          className="w-full border p-2 rounded"
          placeholder="College Member ID (optional)"
        />

        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button disabled={submitting} className="w-full bg-blue-600 text-white rounded p-2">
          {submitting ? "Signing up..." : "Sign up"}
        </button>
      </form>
      <p className="mt-4 text-sm text-gray-600">
        Already have an account? <a className="text-blue-600 underline" href="/login">Sign in</a>
      </p>
    </div>
  );
}
