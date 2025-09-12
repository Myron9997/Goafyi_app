'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminProtectedRoute from '../../../components/AdminProtectedRoute';
import { ArrowLeft, Save, Eye, Mail } from 'lucide-react';

function EmailTemplatesContent() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'vendor-invitation' | 'welcome' | 'reminder'>('vendor-invitation');
  const [previewMode, setPreviewMode] = useState(false);

  // Email template configurations
  const [templates, setTemplates] = useState({
    'vendor-invitation': {
      subject: 'Welcome to GoaFYI - Your Vendor Application Has Been Approved! 🎉',
      enabled: true,
      customizations: {
        headerColor: '#dc2626',
        buttonColor: '#dc2626',
        logoUrl: '/logo.png',
        showBenefits: true,
        showAdminNotes: true,
        expirationDays: 7
      }
    },
    'welcome': {
      subject: 'Welcome to GoaFYI - Let\'s Get Started! 🚀',
      enabled: false,
      customizations: {
        headerColor: '#059669',
        buttonColor: '#059669',
        logoUrl: '/logo.png',
        showBenefits: true,
        showAdminNotes: false,
        expirationDays: 30
      }
    },
    'reminder': {
      subject: 'Complete Your GoaFYI Vendor Setup 📝',
      enabled: false,
      customizations: {
        headerColor: '#d97706',
        buttonColor: '#d97706',
        logoUrl: '/logo.png',
        showBenefits: false,
        showAdminNotes: false,
        expirationDays: 3
      }
    }
  });

  const handleSave = () => {
    // TODO: Save templates to database or config file
    alert('Email templates saved successfully!');
  };

  const handlePreview = () => {
    setPreviewMode(!previewMode);
  };

  const currentTemplate = templates[activeTab];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Email Templates</h1>
                <p className="text-xs text-gray-500">Customize your email designs</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePreview}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Eye className="w-4 h-4" />
                {previewMode ? 'Edit' : 'Preview'}
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Template Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Email Templates</h3>
              <div className="space-y-2">
                {Object.entries(templates).map(([key, template]) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key as any)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      activeTab === key
                        ? 'bg-rose-50 border border-rose-200 text-rose-700'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">
                          {key === 'vendor-invitation' && 'Vendor Invitation'}
                          {key === 'welcome' && 'Welcome Email'}
                          {key === 'reminder' && 'Reminder Email'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {template.subject}
                        </div>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${
                        template.enabled ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Template Editor/Preview */}
          <div className="lg:col-span-2">
            {previewMode ? (
              /* Email Preview */
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Mail className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">Email Preview</h3>
                </div>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                    <div className="text-sm text-gray-600">
                      <strong>To:</strong> vendor@example.com<br />
                      <strong>Subject:</strong> {currentTemplate.subject}
                    </div>
                  </div>
                  <div className="p-4 bg-white">
                    <div className="text-center text-gray-500 py-8">
                      <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Email preview will be shown here</p>
                      <p className="text-sm mt-2">Configure your email service to see live preview</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Template Editor */
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Edit {activeTab === 'vendor-invitation' && 'Vendor Invitation'}
                  {activeTab === 'welcome' && 'Welcome Email'}
                  {activeTab === 'reminder' && 'Reminder Email'}
                </h3>
                
                <div className="space-y-6">
                  {/* Basic Settings */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Subject</label>
                    <input
                      type="text"
                      value={currentTemplate.subject}
                      onChange={(e) => setTemplates(prev => ({
                        ...prev,
                        [activeTab]: {
                          ...prev[activeTab],
                          subject: e.target.value
                        }
                      }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-rose-500 focus:border-rose-500"
                    />
                  </div>

                  {/* Visual Customizations */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Visual Customizations</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Header Color</label>
                        <input
                          type="color"
                          value={currentTemplate.customizations.headerColor}
                          onChange={(e) => setTemplates(prev => ({
                            ...prev,
                            [activeTab]: {
                              ...prev[activeTab],
                              customizations: {
                                ...prev[activeTab].customizations,
                                headerColor: e.target.value
                              }
                            }
                          }))}
                          className="w-full h-10 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Button Color</label>
                        <input
                          type="color"
                          value={currentTemplate.customizations.buttonColor}
                          onChange={(e) => setTemplates(prev => ({
                            ...prev,
                            [activeTab]: {
                              ...prev[activeTab],
                              customizations: {
                                ...prev[activeTab].customizations,
                                buttonColor: e.target.value
                              }
                            }
                          }))}
                          className="w-full h-10 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Content Options */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Content Options</h4>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={currentTemplate.customizations.showBenefits}
                          onChange={(e) => setTemplates(prev => ({
                            ...prev,
                            [activeTab]: {
                              ...prev[activeTab],
                              customizations: {
                                ...prev[activeTab].customizations,
                                showBenefits: e.target.checked
                              }
                            }
                          }))}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Show benefits section</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={currentTemplate.customizations.showAdminNotes}
                          onChange={(e) => setTemplates(prev => ({
                            ...prev,
                            [activeTab]: {
                              ...prev[activeTab],
                              customizations: {
                                ...prev[activeTab].customizations,
                                showAdminNotes: e.target.checked
                              }
                            }
                          }))}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Show admin notes section</span>
                      </label>
                    </div>
                  </div>

                  {/* Expiration */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Link Expiration (days)</label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={currentTemplate.customizations.expirationDays}
                      onChange={(e) => setTemplates(prev => ({
                        ...prev,
                        [activeTab]: {
                          ...prev[activeTab],
                          customizations: {
                            ...prev[activeTab].customizations,
                            expirationDays: parseInt(e.target.value)
                          }
                        }
                      }))}
                      className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-rose-500 focus:border-rose-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EmailTemplatesPage() {
  return (
    <AdminProtectedRoute>
      <EmailTemplatesContent />
    </AdminProtectedRoute>
  );
}
