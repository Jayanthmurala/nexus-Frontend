import Link from 'next/link';
import { ROUTES } from '@/constants/routes';

export default function UnauthorizedPage() {
  return (
    <div className="max-w-xl mx-auto mt-12">
      <div className="bg-white border rounded-2xl p-8 text-center">
        <div className="text-6xl font-bold text-red-600">403</div>
        <h1 className="text-2xl font-semibold text-gray-900 mt-3">Access restricted</h1>
        <p className="text-sm text-gray-600 mt-2">
          You don&apos;t have permission to view this page. If you believe this is a mistake, please contact an administrator.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href={ROUTES.ROOT}
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Go Home
          </Link>
          <Link
            href={ROUTES.DASHBOARD}
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
