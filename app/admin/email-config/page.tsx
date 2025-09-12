'use client';

import { useState, useEffect } from 'react';

export default function EmailConfigPage() {
  const [configStatus, setConfigStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkConfig();
  }, []);

  const checkConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/check-email-config');
      const data = await response.json();
      setConfigStatus(data);
    } catch (error) {
      console.error('Error checking config:', error);
      setConfigStatus({ error: 'Failed to check configuration' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Email Configuration</h1>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Email Configuration</h1>
          
          <div className="space-y-6">
            {/* Configuration Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuration Status</h2>
              
              {configStatus?.error ? (
                <div className="text-red-600">
                  <p>❌ {configStatus.error}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <span className={`w-3 h-3 rounded-full ${configStatus?.resend?.apiKey ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="text-sm">
                      Resend API Key: {configStatus?.resend?.apiKey ? '✅ Configured' : '❌ Missing'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className={`w-3 h-3 rounded-full ${configStatus?.resend?.fromEmail ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="text-sm">
                      From Email: {configStatus?.resend?.fromEmail ? `✅ ${configStatus.resend.fromEmail}` : '❌ Missing'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className={`w-3 h-3 rounded-full ${configStatus?.supabase?.url ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="text-sm">
                      Supabase URL: {configStatus?.supabase?.url ? '✅ Configured' : '❌ Missing'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className={`w-3 h-3 rounded-full ${configStatus?.supabase?.serviceRoleKey ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="text-sm">
                      Service Role Key: {configStatus?.supabase?.serviceRoleKey ? '✅ Configured' : '❌ Missing'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Email Service Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Email Service</h2>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <strong>Service:</strong> Resend
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Status:</strong> {configStatus?.resend?.apiKey ? '✅ Ready' : '❌ Not Configured'}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>From Address:</strong> {configStatus?.resend?.fromEmail || 'Not set'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={checkConfig}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  🔄 Refresh Configuration
                </button>
                
                <div className="text-sm text-gray-600">
                  <p>✅ Email system is ready for vendor invitations</p>
                  <p>📧 Invitations will be sent automatically when approving vendor applications</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}