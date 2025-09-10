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

      // Proceed with sign-in via context (handles redirects)
      await signIn(email, password);
      // Use router.push for faster client-side navigation
      console.log("VendorLogin: redirecting to /account");
      router.push('/account');
    } catch (err: any) {
      console.error("VendorLogin unexpected error", err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] h-[100dvh] bg-white overflow-hidden">
      <div className="px-4 pt-4">
        <div className="relative mb-4">
          <button onClick={() => router.push('/')} className="absolute left-0 p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Logo Section */}
        <div className="flex justify-center mb-4">
          <div className="w-40 h-40 bg-white rounded-full shadow-sm flex items-center justify-center">
            <img src="/logo.png" alt="GoaFYI Logo" className="w-32 h-32 rounded-full object-cover" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-serif font-bold text-gray-900">Vendor Login</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/60 shadow-sm"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/60 shadow-sm"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <button type="submit" disabled={isLoading} className="w-full bg-rose-700 hover:bg-rose-800 text-white rounded-lg disabled:opacity-50 text-sm py-2 transition-colors">
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 text-center text-xs text-gray-600">
            <span>Not signed up? </span>
            <button onClick={() => router.push('/signup')} className="text-rose-700 hover:text-rose-800 font-medium">Register here</button>
          </div>
        </div>
      </div>
    </div>
  );
}


