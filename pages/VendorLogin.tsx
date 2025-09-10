"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Lock } from 'lucide-react';
import { useSupabase } from '../context/SupabaseContext';
import { AuthService } from '../services/authService';

export default function VendorLogin() {
  const router = useRouter();
  const { signIn } = useSupabase();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Lock scroll on vendor login page
  useEffect(() => {
    // Prefetch related auth routes to speed up transitions
    try {
      router.prefetch('/viewer-login');
      router.prefetch('/signup');
      router.prefetch('/account'); // Prefetch account page for fast redirect
      router.prefetch('/home'); // Also prefetch home for viewers
    } catch {}
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Enter email and password');
      return;
    }
    setIsLoading(true);

    try {
      // Prevent viewers from logging in via vendor page
      const emailInfo = await AuthService.checkEmailExists(email);
      if (emailInfo.exists && emailInfo.role && emailInfo.role !== 'vendor') {
        setError('This email is registered as a viewer. Please use Viewer Login.');
        return;
      }

      // Proceed with sign-in via context
      const result = await signIn(email, password);
      
      // If sign-in was successful, redirect immediately
      if (result?.user) {
        console.log("VendorLogin: sign-in successful, redirecting to /account");
        // Use router.push for proper Next.js navigation
        router.push('/account');
      }
    } catch (err: any) {
      console.error("VendorLogin unexpected error", err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] h-[100dvh] bg-gray-100 dark:bg-gray-900 dark:bg-gray-900 overflow-hidden transition-colors duration-300">
      <div className="px-4 pt-4">
        <div className="relative mb-4">
          <button onClick={() => router.push('/')} className="absolute left-0 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Logo Section */}
        <div className="flex justify-center mb-4">
          <div className="w-40 h-40 bg-gray-200 dark:bg-gray-800 rounded-full shadow-sm flex items-center justify-center">
            <img src="/logo.png" alt="GoaFYI Logo" className="w-32 h-32 rounded-full object-cover dark:invert" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-gray-100">Vendor Login</h1>
        </div>

        <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl shadow-sm p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/60 shadow-sm"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/60 shadow-sm"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <button type="submit" disabled={isLoading} className="w-full bg-rose-700 hover:bg-rose-800 text-white rounded-lg disabled:opacity-50 text-sm py-2 transition-colors flex items-center justify-center gap-2">
              {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 text-center text-xs text-gray-600 dark:text-gray-400">
            <span>Not signed up? </span>
            <button onClick={() => router.push('/signup')} className="text-rose-700 hover:text-rose-800 font-medium">Register here</button>
          </div>
        </div>
      </div>
    </div>
  );
}


