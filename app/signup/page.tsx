'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Mail, Lock } from 'lucide-react';

function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isValidInvitation, setIsValidInvitation] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [invitationData, setInvitationData] = useState<{
    email: string;
    businessName?: string;
    token: string;
  } | null>(null);

  useEffect(() => {
    checkInvitation();
  }, []);

  const checkInvitation = async () => {
    try {
      const invited = searchParams.get('invited');
      const email = searchParams.get('email');
      const token = searchParams.get('token');

      // Check if this is a valid invitation
      if (invited === 'true' && email && token) {
        // Validate token with backend
        const response = await fetch('/api/validate-invitation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, token }),
        });

        if (response.ok) {
          setInvitationData({ email, token });
          setIsValidInvitation(true);
        } else {
          setIsValidInvitation(false);
        }
      } else {
        setIsValidInvitation(false);
      }
    } catch (error) {
      console.error('Error checking invitation:', error);
      setIsValidInvitation(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = () => {
    if (invitationData) {
      // Redirect to the vendor signup form with invitation data
      router.push(`/vendor-signup?email=${encodeURIComponent(invitationData.email)}&token=${invitationData.token}&invited=true`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying invitation...</p>
        </div>
      </div>
    );
  }

  if (!isValidInvitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Restricted
          </h1>
          
          <p className="text-gray-600 mb-6">
            This signup page is invitation-only. You need a valid invitation link to create a vendor account.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-blue-800 mb-2">
              <Mail className="w-5 h-5" />
              <span className="font-medium">How to get an invitation:</span>
            </div>
            <ul className="text-sm text-blue-700 text-left space-y-1">
              <li>• Submit a vendor application on our website</li>
              <li>• Wait for admin approval</li>
              <li>• Check your email for invitation link</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => router.push('/')}
              className="w-full bg-rose-600 text-white py-3 px-4 rounded-lg hover:bg-rose-700 transition-colors"
            >
              Go to Homepage
            </button>
            
            <button
              onClick={() => router.push('/vendor-login')}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Already have an account? Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to GoaFYI!
          </h1>
          
          <p className="text-gray-600">
            Your vendor application has been approved. You can now create your account.
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-green-800 mb-2">
            <Mail className="w-5 h-5" />
            <span className="font-medium">Invitation Details:</span>
          </div>
          <p className="text-sm text-green-700">
            Email: <strong>{invitationData?.email}</strong>
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleCreateAccount}
            className="w-full bg-rose-600 text-white py-3 px-4 rounded-lg hover:bg-rose-700 transition-colors font-medium"
          >
            🚀 Create Your Vendor Account
          </button>
          
          <div className="text-center">
            <p className="text-sm text-gray-500">
              This invitation link will expire in 7 days
            </p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Lock className="w-4 h-4" />
            <span>Secure invitation-only signup</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading component for Suspense fallback
function SignupLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function SignupPage() {
  return (
    <Suspense fallback={<SignupLoading />}>
      <SignupPageContent />
    </Suspense>
  );
}