"use client";

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';

export default function EmailConfirmation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || 'your email';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Check Your Email</h1>
            <p className="text-gray-600">We've sent you a confirmation link</p>
          </div>
        </div>

        {/* Confirmation Card */}
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          {/* Success Icon */}
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>

          {/* Main Message */}
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Account Created Successfully!
          </h2>
          
          <p className="text-gray-600 mb-6">
            We've sent a confirmation email to <strong>{email}</strong>
          </p>

          {/* Instructions */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <p className="text-sm text-blue-800 font-medium mb-1">
                  Next Steps:
                </p>
                <ol className="text-sm text-blue-700 space-y-1">
                  <li>1. Check your email inbox</li>
                  <li>2. Click the confirmation link</li>
                  <li>3. Return here to sign in</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => router.push('/viewer-login')}
              className="w-full btn-primary"
            >
              Go to Sign In
            </button>
            
            <button
              onClick={() => router.push('/')}
              className="w-full btn-secondary"
            >
              Back to Landing
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Didn't receive the email? Check your spam folder or{' '}
              <button
                onClick={() => router.push('/viewer-login')}
                className="text-rose-700 hover:text-rose-800 font-medium"
              >
                try signing up again
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
