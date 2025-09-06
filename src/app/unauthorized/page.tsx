'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function UnauthorizedPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login instead of showing unauthorized page
    router.replace('/login');
  }, [router]);

  return (
    <div className="max-w-xl mx-auto mt-12">
      <div className="bg-white border rounded-2xl p-8 text-center">
        <div className="text-6xl font-bold text-red-600">403</div>
        <h1 className="text-2xl font-semibold text-gray-900 mt-3">Access restricted</h1>
        <p className="text-sm text-gray-600 mt-2">
          Redirecting to login page...
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
