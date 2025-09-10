"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Mail, Lock, User } from 'lucide-react';
import { useSupabase } from '../context/SupabaseContext';
import { supabase } from '../lib/supabase';

export default function ViewerLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUp } = useSupabase();
  const [isSignUp, setIsSignUp] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Lock scroll while on this page and check for signup mode
  useEffect(() => {
    // Prefetch related auth routes to speed up transitions
    try {
      router.prefetch('/vendor-login');
      router.prefetch('/signup');
      router.prefetch('/home'); // Prefetch home page for fast redirect
      router.prefetch('/account'); // Also prefetch account for vendors
    } catch {}
    document.body.style.overflow = 'hidden';
    // Check if mode=signup is in URL params
    const mode = searchParams.get('mode');
    setIsSignUp(mode === 'signup');
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [searchParams, router]);

  const validateForm = (): boolean => {
    if (isSignUp && !form.fullName.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!form.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      setError('Please enter a valid email');
      return false;
    }
    if (!form.password.trim()) {
      setError('Password is required');
      return false;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (isSignUp && form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validateForm()) return;

    setIsLoading(true);
    setError(null); // Clear any previous errors
    try {
      if (isSignUp) {
        console.log('🟢 ViewerLogin: starting sign-up', { email: form.email });
        await signUp(form.email, form.password, form.fullName, 'viewer');
        router.push('/email-confirmation');
      } else {
        // Simple sign-in with password
        const { data, error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password
        });

        console.log("ViewerLogin signIn response", { data, error });

        if (error) {
          setError("Sign in error: " + error.message);
          return;
        }

        // Check that session exists
        if (data?.session) {
          console.log("ViewerLogin session token:", data.session.access_token);
          // Show optimistic success state
          setIsLoading(false);
          setError(null);
          
          // Use router.push for faster client-side navigation
          // The auth state change listener will also handle redirect, but this is immediate
          console.log("ViewerLogin: redirecting to /home");
          router.push('/home');
        } else {
          setError("Signed in, but session not present. Please try again.");
        }
      }
    } catch (err: any) {
      console.error('💥 ViewerLogin: exception', err);
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] h-[100dvh] bg-gray-100 dark:bg-gray-900 dark:bg-gray-900 overflow-hidden transition-colors duration-300">
      <div className="px-4 pt-4">
        <div className="relative mb-2">
          <button onClick={() => router.push('/')} className="absolute left-0 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Logo Section (only on login, not on signup) */}
        {!isSignUp && (
          <div className="flex justify-center mb-4">
            <div className="w-40 h-40 bg-gray-200 dark:bg-gray-800 rounded-full shadow-sm flex items-center justify-center">
              <img src="/logo.png" alt="GoaFYI Logo" className="w-32 h-32 rounded-full object-cover dark:invert" />
            </div>
          </div>
        )}

        <div className="text-center mb-8">
          <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-gray-100">
            {isSignUp ? 'Viewer Sign Up' : 'Viewer Login'}
          </h1>
        </div>

        <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl shadow-sm p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            {isSignUp && (
              <div>
                <label htmlFor="fullName" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={form.fullName}
                    onChange={(e) => setForm(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/60 shadow-sm"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
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
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  value={form.password}
                  onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/60 shadow-sm"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {isSignUp && (
              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/60 shadow-sm"
                    placeholder="Confirm your password"
                  />
                </div>
              </div>
            )}

            {error && <p className="text-xs text-red-600">{error}</p>}

            <button type="submit" disabled={isLoading} className="w-full bg-rose-700 hover:bg-rose-800 text-white rounded-lg disabled:opacity-50 text-sm py-2 transition-colors">
              {isLoading 
                ? (isSignUp ? 'Creating Account...' : 'Signing In...') 
                : (isSignUp ? 'Create Account' : 'Sign In')
              }
            </button>
          </form>

          <div className="mt-4 text-center text-xs text-gray-600 dark:text-gray-400">
            <span>{isSignUp ? 'Already have an account?' : "Don't have an account?"} </span>
            <button 
              onClick={() => {
                setIsSignUp(!isSignUp);
                setForm({ fullName: '', email: '', password: '', confirmPassword: '' });
                setError(null);
              }} 
              className="text-rose-700 hover:text-rose-800 font-medium"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
