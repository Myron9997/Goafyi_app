import React from 'react';
import { useRouter } from 'next/navigation';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 transition-colors duration-300">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-200 dark:text-gray-700">404</h1>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Page Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or doesn't exist.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => router.push('/')}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Go Home
          </button>
          
          <button
            onClick={() => router.push(-1)}
            className="w-full btn-secondary flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>

        <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>Need help? Try these popular pages:</p>
          <div className="mt-2 space-x-4">
            <button
              onClick={() => router.push('/')}
              className="text-rose-700 hover:text-rose-800"
            >
              Browse Vendors
            </button>
            <button
              onClick={() => router.push('/search')}
              className="text-rose-700 hover:text-rose-800"
            >
              Search
            </button>
            <button
              onClick={() => router.push('/signup')}
              className="text-rose-700 hover:text-rose-800"
            >
              List Service
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}






