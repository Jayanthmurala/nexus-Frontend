import dynamic from 'next/dynamic';

// Disable SSR for this page to prevent prerendering errors
const NetworkTestPage = dynamic(() => import('./NetworkTestContent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading Network Test...</p>
      </div>
    </div>
  )
});

export default NetworkTestPage;
