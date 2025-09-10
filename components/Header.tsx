"use client";

import React, { useState, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { SupabaseContext } from '../context/SupabaseContext';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const supabaseContext = useContext(SupabaseContext);
  const { user, signOut } = supabaseContext || { user: null, signOut: () => {} };
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;
  const isLandingPage = pathname === '/';
  const isVendorLoginPage = pathname === '/vendor-login';
  const isVendorSignupPage = pathname === '/signup';
  const isViewerLoginPage = pathname === '/viewer-login';
  const isViewerHomePage = pathname === '/home';
  const isVendorProfilePage = pathname.startsWith('/vendor/');
  const isAccountPage = pathname === '/account';

  const handleNavigation = (path: string) => {
    router.push(path);
    setMenuOpen(false);
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/');
    setMenuOpen(false);
  };

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-40 border-b border-gray-100 dark:border-gray-800 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 h-12">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => router.push('/')}
          >
            <img src="/logo.png" alt="Logo" className="w-24 h-24 -mt-6 rounded-lg object-cover dark:hidden" />
            <img src="/logodark.png" alt="Logo" className="w-24 h-24 -mt-6 rounded-lg object-cover hidden dark:block" />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 -mt-4">
            {user?.role === 'viewer' ? (
              <>
                <button
                  onClick={() => router.push('/home')}
                  className={`text-sm font-medium transition-colors ${
                    isActive('/home') ? 'text-rose-700' : 'text-gray-600 dark:text-gray-300 hover:text-rose-700'
                  }`}
                >
                  Home
                </button>
                <button
                  onClick={() => router.push('/account')}
                  className={`text-sm font-medium transition-colors ${
                    isActive('/account') ? 'text-rose-700' : 'text-gray-600 dark:text-gray-300 hover:text-rose-700'
                  }`}
                >
                  Profile
                </button>
              </>
            ) : user?.role === 'vendor' ? (
              <>
                <button
                  onClick={() => router.push('/account')}
                  className={`text-sm font-medium transition-colors ${
                    isActive('/account') ? 'text-rose-700' : 'text-gray-600 dark:text-gray-300 hover:text-rose-700'
                  }`}
                >
                  Dashboard
                </button>
              </>
            ) : !isLandingPage ? (
              <>
                <button
                  onClick={() => router.push('/home')}
                  className={`text-sm font-medium transition-colors ${
                    isActive('/home') ? 'text-rose-700' : 'text-gray-600 dark:text-gray-300 hover:text-rose-700'
                  }`}
                >
                  Home
                </button>
                <button
                  onClick={() => router.push('/search')}
                  className={`text-sm font-medium transition-colors ${
                    isActive('/search') ? 'text-rose-700' : 'text-gray-600 dark:text-gray-300 hover:text-rose-700'
                  }`}
                >
                  Search
                </button>
              </>
            ) : null}
            {/* No Admin link for vendors */}
          </nav>

          {/* User Actions (simple sign out when logged in) */}
          <div className="hidden md:flex items-center gap-3 -mt-4">
            {!user ? (
              <>
                <button
                  onClick={() => router.push('/vendor-login')}
                  className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-rose-700 transition-colors"
                  suppressHydrationWarning={true}
                >
                  Vendor Login
                </button>
                <button
                  onClick={() => router.push('/viewer-login')}
                  className="text-sm px-3 py-1 rounded-lg bg-rose-700 text-white hover:bg-rose-800 transition-colors"
                  suppressHydrationWarning={true}
                >
                  Sign In
                </button>
              </>
            ) : (
              <button
                onClick={handleLogout}
                className="text-sm px-3 py-1 rounded-lg bg-rose-700 text-white hover:bg-rose-800 transition-colors"
                suppressHydrationWarning={true}
              >
                Sign Out
              </button>
            )}
          </div>

          {/* Mobile quick actions (visible on small screens) */}
          <div className="md:hidden flex items-center gap-2 -mt-4">
            {!user ? (
              <>
                <button
                  onClick={() => router.push('/vendor-login')}
                  className="text-[12px] font-medium text-gray-600 dark:text-gray-300 hover:text-rose-700 transition-colors px-2 py-1"
                  suppressHydrationWarning={true}
                >
                  Vendor Login
                </button>
                <button
                  onClick={() => router.push('/viewer-login')}
                  className="text-[12px] px-3 py-1 rounded-lg bg-rose-700 text-white hover:bg-rose-800 transition-colors"
                  suppressHydrationWarning={true}
                >
                  Sign In
                </button>
              </>
            ) : (
              <button
                onClick={handleLogout}
                className="text-[12px] px-3 py-1 rounded-lg bg-rose-700 text-white hover:bg-rose-800 transition-colors"
                suppressHydrationWarning={true}
              >
                Sign Out
              </button>
            )}
          </div>

          {/* Mobile Menu Button - Hidden on landing page, vendor login, vendor signup, viewer login, viewer home, vendor profile, and account */}
          {!isLandingPage && !isVendorLoginPage && !isVendorSignupPage && !isViewerLoginPage && !isViewerHomePage && !isVendorProfilePage && !isAccountPage && (
            <button
              onClick={() => setMenuOpen(true)}
              className="md:hidden p-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors -mt-5"
              aria-label="Open menu"
              suppressHydrationWarning={true}
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu - Hidden on landing page, vendor login, vendor signup, viewer login, viewer home, vendor profile, and account */}
      {menuOpen && !isLandingPage && !isVendorLoginPage && !isVendorSignupPage && !isViewerLoginPage && !isViewerHomePage && !isVendorProfilePage && !isAccountPage && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div 
            className="absolute inset-0 bg-black/40" 
            onClick={() => setMenuOpen(false)} 
          />
          <aside className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl p-6 overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Menu</h2>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <nav className="space-y-2">
              {user?.role === 'vendor' ? (
                <>
                  <button
                    onClick={() => handleNavigation('/account')}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      isActive('/account') ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-700' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    Dashboard
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleNavigation('/home')}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      isActive('/home') ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-700' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    Home
                  </button>
                  <button
                    onClick={() => handleNavigation('/account')}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      isActive('/account') ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-700' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    Profile
                  </button>
                </>
              )}
            </nav>

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              {!user ? (
                <div className="space-y-3">
                  <button
                    onClick={() => handleNavigation('/vendor-login')}
                    className="w-full text-left px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    suppressHydrationWarning={true}
                  >
                    Vendor Login
                  </button>
                  <button
                    onClick={() => handleNavigation('/viewer-login')}
                    className="w-full px-3 py-2 rounded-lg bg-rose-700 text-white hover:bg-rose-800 transition-colors"
                    suppressHydrationWarning={true}
                  >
                    Sign In
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}

