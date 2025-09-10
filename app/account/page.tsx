import { Suspense } from 'react';
import Account from "../../pages/Account";

// Loading component for better UX
function AccountLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading account...</p>
      </div>
    </div>
  );
}

export default function AccountPage() {
  // Pure client-side approach - no SSR at all
  // This eliminates auth race conditions and provides instant loading
  return (
    <Suspense fallback={<AccountLoading />}>
      <Account />
    </Suspense>
  );
}
