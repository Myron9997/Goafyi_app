"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Mail, Lock, Check } from 'lucide-react';
import { useSupabase } from '../context/SupabaseContext';
import { AuthService } from '../services/authService';
import { CATEGORIES } from '../constants';

interface VendorSignupForm {
  businessName: string;
  categories: string[];
  email: string;
  password: string;
  confirmPassword: string;
}

export default function VendorSignup() {
  const router = useRouter();
  const { signUp } = useSupabase();
  const [form, setForm] = useState<VendorSignupForm>({
    businessName: '',
    categories: [],
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<Partial<VendorSignupForm>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [tempCategories, setTempCategories] = useState<string[]>([]);

  // Prefetch related auth routes to speed up transitions
  React.useEffect(() => {
    try {
      router.prefetch('/vendor-login');
      router.prefetch('/viewer-login');
    } catch {}
  }, [router]);

  const validateForm = (): boolean => {
    const newErrors: Partial<VendorSignupForm> = {};

    if (!form.businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }

    if (form.categories.length === 0) {
      newErrors.categories = 'Please select at least one category';
    }

    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!form.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof VendorSignupForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleCategoryToggle = (category: string) => {
    setForm(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
    if (errors.categories) {
      setErrors(prev => ({ ...prev, categories: undefined }));
    }
  };

  const openCategoryModal = () => {
    // Initialize temp selection with current categories
    setTempCategories(form.categories);
    setShowCategoryModal(true);
  };

  const toggleTempCategory = (category: string) => {
    setTempCategories(prev => (
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    ));
  };

  const saveCategoriesFromModal = () => {
    setForm(prev => ({ ...prev, categories: tempCategories }));
    if (errors.categories && tempCategories.length > 0) {
      setErrors(prev => ({ ...prev, categories: undefined }));
    }
    setShowCategoryModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      console.log('🚀 Starting vendor signup process...');
      console.log('📧 Email:', form.email);
      console.log('🏢 Business Name:', form.businessName);
      
      // Check if email already exists with different role
      console.log('🔍 Checking if email exists...');
      const emailCheck = await AuthService.checkEmailExists(form.email);
      console.log('📋 Email check result:', emailCheck);
      
      if (emailCheck.exists && emailCheck.role === 'viewer') {
        console.log('❌ Email exists as viewer, blocking signup');
        setErrors({ email: 'This email is already registered as a viewer. Please use the viewer login page.' });
        return;
      }
      
      console.log('✅ Email check passed, proceeding with signup...');
      console.log('📤 Calling signUp with role: vendor');
      
      const result = await signUp(form.email, form.password, form.businessName, 'vendor');
      console.log('🎉 Signup result:', result);
      
      if (result && result.user) {
        console.log('✅ User created successfully:', result.user.id);
        console.log('📧 Email confirmation sent:', result.user.email_confirmed_at ? 'Already confirmed' : 'Pending confirmation');
        
        // Navigate to confirmation page with email
        console.log('🔄 Navigating to email confirmation page...');
        router.push('/email-confirmation');
      } else {
        console.log('❌ No user returned from signup');
        setErrors({ email: 'Signup failed. Please try again.' });
      }
    } catch (error: any) {
      console.error('💥 Signup error:', error);
      console.error('📝 Error details:', {
        message: error.message,
        code: error.code,
        status: error.status,
        details: error.details
      });
      setErrors({ email: error.message || 'Something went wrong. Please try again.' });
    } finally {
      console.log('🏁 Signup process finished, setting isSubmitting to false');
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <div className="min-h-screen bg-gray-50 flex items-start justify-center px-4 pt-6 md:pt-10">
      <div className="w-full max-w-md mt-0">
        {/* Header */}
        <div className="relative mb-3">
          <button
            onClick={() => router.back()}
            className="absolute left-0 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 text-center">Vendor Sign Up</h1>
        </div>

        {/* Signup Form */}
        <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Business Name */}
            <div>
              <label htmlFor="businessName" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Business Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  id="businessName"
                  name="businessName"
                  value={form.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 shadow-sm ${errors.businessName ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-rose-500/40 focus:border-rose-500/60'}`}
                  placeholder="Enter your business name"
                />
              </div>
              {errors.businessName && <p className="text-sm text-red-600 mt-1">{errors.businessName}</p>}
            </div>

            {/* Categories (launch modal) */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Service Categories
              </label>
              <button
                type="button"
                onClick={openCategoryModal}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-colors text-left"
              >
                {form.categories.length > 0
                  ? `Selected: ${form.categories.join(', ')}`
                  : 'Select categories'}
              </button>
              {errors.categories && <p className="text-sm text-red-600 mt-1">{errors.categories}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 shadow-sm ${errors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-rose-500/40 focus:border-rose-500/60'}`}
                  placeholder="Enter your email address"
                />
              </div>
              {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  id="password"
                  name="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 shadow-sm ${errors.password ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-rose-500/40 focus:border-rose-500/60'}`}
                  placeholder="Enter your password"
                />
              </div>
              {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 shadow-sm ${errors.confirmPassword ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-rose-500/40 focus:border-rose-500/60'}`}
                  placeholder="Confirm your password"
                />
              </div>
              {errors.confirmPassword && <p className="text-sm text-red-600 mt-1">{errors.confirmPassword}</p>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-rose-700 hover:bg-rose-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm py-2 transition-colors"
            >
              {isSubmitting ? 'Creating Account...' : 'Create Vendor Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <button
                onClick={() => router.push('/vendor-login')}
                className="text-rose-700 hover:text-rose-800 font-medium"
              >
                Sign In
              </button>
            </p>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Are you a viewer?{' '}
              <button
                onClick={() => router.push('/viewer-login')}
                className="text-rose-700 hover:text-rose-800 font-medium"
              >
                Viewer login
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
    {/* Categories Modal */}
    {showCategoryModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
        <div className="absolute inset-0 bg-black/40" onClick={() => setShowCategoryModal(false)} />
        <div className="relative bg-gray-100 dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-sm p-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">Select Service Categories</h3>
          <div className="grid grid-cols-2 gap-1.5 max-h-64 overflow-auto">
            {CATEGORIES.filter(cat => cat !== 'All').map(category => (
              <button
                key={category}
                type="button"
                onClick={() => toggleTempCategory(category)}
                className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-medium transition-colors ${
                  tempCategories.includes(category)
                    ? 'bg-rose-50 border-rose-300 text-rose-700'
                    : 'bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                  tempCategories.includes(category)
                    ? 'bg-rose-500 border-rose-500 border'
                    : 'border-gray-300 dark:border-gray-600'
                }`}>
                  {tempCategories.includes(category) && (
                    <Check className="w-2.5 h-2.5 text-white" />
                  )}
                </div>
                {category}
              </button>
            ))}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCategoryModal(false)}
              className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 dark:text-gray-300 hover:bg-gray-200 transition-colors text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveCategoriesFromModal}
              className="px-3 py-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors text-xs"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
